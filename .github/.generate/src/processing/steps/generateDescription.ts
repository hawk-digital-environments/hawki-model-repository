import type {ProcessingStep} from 'src/processing/steps/types.js';
import type {ModelInformation} from 'src/sources/types.js';
import type {ProcessedModelInformation} from 'src/types.js';
import axios from 'axios';
import type {AppCache} from 'src/processing/AppCache.js';
import type {RunOptions} from 'src/processing/run.js';

export const generateDescription: ProcessingStep = async (
    sourceModel,
    existingModel,
    newModel,
    options,
    cache
) => {
    console.log('Generating description for model', sourceModel.id);
    const sourceDescription = getSourceDescription(sourceModel);
    const description = sourceDescription
        ?? existingModel?.description?.en
        ?? await generateAiDescription(sourceModel, cache, options);

    if (!description) {
        console.log(`No description could be found or generated for model ${sourceModel.id}`);
        return newModel;
    }

    let descriptions: ProcessedModelInformation['description'] = {
        en: description
    };

    if (existingModel?.description) {
        descriptions = Object.assign(descriptions, existingModel!.description);
    }

    newModel.description = descriptions;

    return newModel;
};

function getSourceDescription(sourceModel: ModelInformation) {
    if (!sourceModel.description || sourceModel.description.trim() === '') {
        return undefined;
    }

    return sourceModel.description;
}


async function fetchHuggingfaceCard(modelIdAliases: string[]): Promise<string | null> {
    for (const alias of modelIdAliases) {
        try {
            const url = `https://huggingface.co/${alias}/raw/main/README.md`;
            const response = await axios.get(url, {
                headers: {
                    'Content-Type': 'text/plain'
                }
            });

            if (response.status === 200 && typeof response.data === 'string' && response.data.trim().length > 0) {
                return response.data;
            }
        } catch (error) {
            console.error(`Failed to fetch Hugging Face card for alias "${alias}":`, error.message);
        }
    }
    return null;  // No valid card found for any alias
}

/**
 * Remove all markdown code blocks (``` ... ```), inline code (`...`), and images from the card.
 * Remove everything that looks like a markdown link [text](url) and replace it with the text only.
 * Also remove any HTML tags.
 * Remove markdown tables.
 * @param card
 */
function cleanUpCard(card: string): string {
    return card
        // Remove code blocks
        .replace(/```[\s\S]*?```/g, '')
        // Remove inline code
        .replace(/`[^`]*`/g, '')
        // Remove images
        .replace(/!\[.*?\]\(.*?\)/g, '')
        // Remove markdown links but keep the text
        .replace(/\[([^\]]+)\]\((?:[^)]+)\)/g, '$1')
        // Remove HTML tags
        .replace(/<[^>]+>/g, '')
        // Remove markdown tables
        .replace(/\|(.+\|)+\n/g, '')
        // Replace multiple newlines with a single newline
        .replace(/\n{2,}/g, '\n')
        .trim();
}

async function sendSummaryRequestToAi(modelCard: string, token: string): Promise<string | null> {
    const prompt = `Please, summarize the following model card into a concise description (max 300 characters) suitable for a model listing. 
Focus on key features, capabilities, and intended use cases. Avoid promotional language. Answer only with the summary.
If there is not enough information to create a summary, respond with "[[NOPE]]".
Text to summarize:
----${modelCard}`;

    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 200,
            temperature: 0.7
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }
    );

    if (response.status !== 200) {
        throw new Error(`Failed to generate summary: ${response.status} ${response.statusText}`);
    }

    const summary = response.data.choices[0].message.content.trim();
    if (summary === '[[NOPE]]') {
        return null;
    }
    return summary;
}

export async function generateAiDescription(
    modelInformation: ModelInformation,
    cache: AppCache,
    options: RunOptions
) {
    console.log(`Generating description for model: ${modelInformation.id}`);
    return cache.remember(
        `description-${modelInformation.id}`,
        async () => {
            try {
                const huggingfaceCard = await cache.remember(
                    `huggingface-card-${modelInformation.id}`,
                    async () => {
                        console.log(`Fetching Hugging Face card for model: ${modelInformation.id}`);
                        return fetchHuggingfaceCard(
                            modelInformation.aliases
                        );
                    }
                );

                if (!huggingfaceCard) {
                    console.log(`No Hugging Face card found for model: ${modelInformation.id}`);
                    return null;
                }

                console.log(`Generating summary for model: ${modelInformation.id}`);
                return await sendSummaryRequestToAi(
                    cleanUpCard(huggingfaceCard),
                    options.secrets.openAiKey
                );
            } catch (e) {
                console.error('Error generating description for model', modelInformation.id, e);
                return null;
            }
        }
    );
}
