import type {ModelInformation, ModelInformationOfProvider, ModelInformationSource} from 'src/sources/types.js';
import axios from 'axios';
import {modelProviderSchema, modelsDevModelSchema} from 'src/sources/modelsDev/schema.js';
import {getModelBaseId, isJunkModelId} from 'src/util.js';
import {deduplicateModels} from 'src/sources/deduplicateModels.js';

type ModelsDevModel = ReturnType<(typeof modelsDevModelSchema)['parse']> & {
    provider: Omit<ReturnType<(typeof modelProviderSchema)['parse']>, 'models'>;
}

async function fetchModels(): Promise<ModelsDevModel[]> {
    try {
        const response = await axios.get('https://models.dev/api.json');

        if (response.status !== 200) {
            throw new Error(`Failed to fetch models.dev models: ${response.status} ${response.statusText}`);
        }

        const result = [];

        for (const provider of Object.values(response.data)) {
            const parsedProvider = modelProviderSchema.parse(provider);
            const {models: _, ...providerWithoutModels} = parsedProvider;

            for (const model of Object.values(parsedProvider.models)) {
                const parsedModel = modelsDevModelSchema.parse(model);
                result.push({
                    ...parsedModel,
                    provider: providerWithoutModels
                });
            }
        }

        return result;
    } catch (e) {
        throw new Error(`Error fetching models from models.dev: ${(e as Error).message}`);
    }
}

function normalizeModels(models: ModelsDevModel[]): ModelInformation[] {
    return models.map(model => {
        const id = getModelBaseId(model.id);

        const idAliases = Array.from(
            new Set(
                [
                    id,
                    model.id
                ].filter(Boolean).map(s => s.toLowerCase())
            )
        );

        const convertPrice = (price: number | undefined) => {
            if (price === undefined) {
                return undefined;
            }
            // Convert the price into a string representing the price per 1M tokens
            return (price).toFixed(2);
        };

        const providerInfo: ModelInformationOfProvider = {
            providerId: model.provider.id,
            providerName: model.provider.name,
            contextLength: model.limit?.context || undefined,
            outputLimit: model.limit?.output || undefined,
            price: {
                currency: 'usd',
                input: convertPrice(model.cost?.input),
                output: convertPrice(model.cost?.output)
            }
        };

        const parameters: string[] = [];
        if (model.temperature) {
            parameters.push('temperature');
        }
        if (model.tool_call) {
            parameters.push('tools');
        }

        let knowledgeCutoff: string | undefined;
        if (model.knowledge) {
            // Check if the field is in format YYYY-MM or YYYY-MM-DD
            const knowledgeRegex = /^\d{4}-(0[1-9]|1[0-2])(-([0-2][0-9]|3[0-1]))?$/;
            if (knowledgeRegex.test(model.knowledge)) {
                const knowledgeCutoffDate = new Date(model.knowledge);
                knowledgeCutoff = knowledgeCutoffDate.toISOString().split('T')[0];
            }
        }

        const info: ModelInformation = {
            id: id,
            aliases: idAliases.sort((a, b) => b.length - a.length),
            description: '',
            name: model.name,
            reasoning: model.reasoning || undefined,
            toolCalling: model.tool_call || undefined,
            openWeights: model.open_weights || undefined,
            knowledge: knowledgeCutoff,
            input: model.modalities.input.filter(mod => ['text', 'image', 'file', 'audio', 'video'].includes(mod)) as Array<'text' | 'image' | 'file' | 'audio' | 'video'>,
            output: model.modalities.output.filter(mod => ['text', 'image', 'embeddings'].includes(mod)) as Array<'text' | 'image' | 'embeddings'>,
            parameters: parameters,
            providers: [providerInfo]
        };

        return info;
    });
}

export const modelsDevSource: ModelInformationSource = async () => {
    const fetchedModels = await fetchModels();
    const filteredModels = fetchedModels.filter(model => !isJunkModelId(model.id));
    const normalizedModels = normalizeModels(filteredModels);
    return deduplicateModels(normalizedModels);
};
