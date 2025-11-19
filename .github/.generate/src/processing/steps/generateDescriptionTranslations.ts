import type {BatchProcessingStep} from 'src/processing/steps/types.js';
import type {AppCache} from 'src/processing/AppCache.js';
import axios from 'axios';
import type {ProcessedModelInformation} from 'src/types.js';

export const generateDescriptionTranslations: BatchProcessingStep = async (
    models,
    options,
    cache
) => {
    console.log('Generating missing translated descriptions for models in batch step');

    // Flat collection of what needs translating - no nested objects yet
    const translationTasks = models.flatMap(model =>
        !model.description?.en
            ? []
            : options.additionalLocales
                .filter(locale => !model.description![locale])
                .map(locale => ({
                    modelId: model.id,
                    locale,
                    text: model.description!.en
                }))
    );

    if (translationTasks.length === 0) {
        return models;
    }

    // Simple Map to store results - composite key avoids nested objects
    const translations = new Map<string, string>(); // key: `${modelId}:${locale}`

    // Group by locale and translate (only one grouping step needed)
    const tasksByLocale = groupBy(translationTasks, task => task.locale);

    for (const [locale, tasks] of tasksByLocale) {
        const translatedTexts = await translateTexts(
            tasks.map(t => t.text),
            locale,
            cache,
            options.secrets.deepLKey
        );

        tasks.forEach((task, index) => {
            translations.set(`${task.modelId}:${locale}`, translatedTexts[index]);
        });
    }

    return models.map(model => {
        const additionalTranslations: Partial<ProcessedModelInformation['description']> = {};

        for (const locale of options.additionalLocales) {
            const translation = translations.get(`${model.id}:${locale}`);
            if (translation) {
                additionalTranslations[locale] = translation;
            }
        }

        if (Object.keys(additionalTranslations).length > 0) {
            return {
                ...model,
                description: {...model.description, ...additionalTranslations} as ProcessedModelInformation['description']
            };
        }

        return model;
    });
};

function groupBy<T, K>(array: T[], keyFn: (item: T) => K): Map<K, T[]> {
    return array.reduce((map, item) => {
        const key = keyFn(item);
        const group = map.get(key) || [];
        group.push(item);
        map.set(key, group);
        return map;
    }, new Map<K, T[]>());
}

async function translateTexts(
    texts: string[],
    locale: string,
    cache: AppCache,
    apiKey: string
): Promise<string[]> {
    const uniqueTexts = [...new Set(texts)];
    const textToIndex = new Map(uniqueTexts.map((text, i) => [text, i]));

    console.log(`Deduped ${texts.length} texts down to ${uniqueTexts.length}`);

    // Translate unique texts in chunks
    const translatedUnique: string[] = [];
    const chunkSize = 50;

    for (let i = 0; i < uniqueTexts.length; i += chunkSize) {
        const chunk = uniqueTexts.slice(i, i + chunkSize);
        const chunkTranslations = await fetchTranslationsFromDeepL(
            chunk,
            locale.toUpperCase(),
            apiKey,
            cache
        );
        translatedUnique.push(...chunkTranslations);
    }

    // Map back to original order
    return texts.map(text => translatedUnique[textToIndex.get(text)!]);
}

async function fetchTranslationsFromDeepL(
    texts: string[],
    targetLang: string,
    apiKey: string,
    cache: AppCache
): Promise<string[]> {
    console.log(`Fetching translations from DeepL API to ${targetLang} for ${texts.length} texts...`);
    const cacheKey = `deepl_${targetLang}_${texts.join('|')}`;

    return cache.remember(cacheKey, async () => {
        try {
            const response = await axios.post(
                'https://api-free.deepl.com/v2/translate',
                {
                    text: texts,
                    target_lang: targetLang
                },
                {
                    headers: {
                        Authorization: `DeepL-Auth-Key ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status !== 200) {
                throw new Error(`Failed to fetch translations: ${response.status} ${response.statusText}`);
            }

            if (!response.data || !Array.isArray(response.data.translations)) {
                throw new Error('Invalid response format: expected an array of translations');
            }

            return response.data.translations.map((t: any) => t.text);
        } catch (e) {
            throw new Error(`Failed to fetch translations from DeepL API: ${e.message}`);
        }
    });
}
