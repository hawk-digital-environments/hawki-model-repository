import type {ModelInformation, ModelInformationSource} from 'src/sources/types.js';
import {deduplicateModels} from 'src/sources/deduplicateModels.js';
import {processor} from 'src/processing/processor.js';
import type {HashFileStructure, OutputStructure} from 'src/types.js';
import * as fs from 'node:fs';
import {generateDescription} from 'src/processing/steps/generateDescription.js';
import {generateInitialPricing} from 'src/processing/steps/generateInitialPricing.js';
import {setFailed} from '@actions/core';
import {generateDescriptionTranslations} from 'src/processing/steps/generateDescriptionTranslations.js';
import {extractProviderInformation} from 'src/processing/steps/extractProviderInformation.js';
import {generateSummaryInformation} from 'src/processing/steps/generateSummaryInformation.js';
import {cleanupDescriptions} from 'src/processing/steps/cleanupDescriptions.js';
import axiosRetry from 'axios-retry';
import axios from 'axios';

export interface RunOptions {
    /**
     * The list of sources to process for model information
     */
    sources: ModelInformationSource[],

    /**
     * A list of additional locale codes to translate the descriptions into (in addition to 'en').
     */
    additionalLocales: string[],

    /**
     * A list of additional currency codes to convert pricing into (in addition to that provided by the source).
     * The currency keys must be in: https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json
     */
    additionalCurrencies: string[],

    /**
     * A list of model IDs to exclude from the final output.
     * This is useful to filter out models that are known to be problematic or unwanted.
     */
    modelDenyList?: string[],

    /**
     * The absolute path to the storage file where processed model information is stored.
     */
    storageFilePath: string,

    /**
     * The absolute path to the storage file used for storing hashes of model information to detect changes.
     */
    storageHashFilePath: string,

    /**
     * The absolute path to the cache file used for temporary storage during processing.
     */
    cacheFilePath: string,

    secrets: {
        /**
         * The api key for the open router source
         */
        openRouterKey: string

        /**
         * The api key for the DeepL translation service
         */
        deepLKey: string

        /**
         * The api key for the OpenAI service
         */
        openAiKey: string
    }
}

/**
 * The main application runner, to load and process model information from the defined sources.
 * @param options
 */
export async function run(options: RunOptions) {
    try {
        const allModels: ModelInformation[] = [];

        axiosRetry(axios, {
            retries: 5,
            retryDelay: axiosRetry.exponentialDelay
        });

        for (const source of options.sources) {
            const models = await source(options);
            allModels.push(...models);
        }

        // Ensure all model ids are lowercase for consistency
        allModels.forEach(model => {
            model.id = model.id.toLowerCase();
        });

        const models = deduplicateModels(allModels);

        const modelsFiltered = models.filter(model => {
            if (!options.modelDenyList) {
                return true;
            }
            return !options.modelDenyList.includes(model.id);
        });

        const storage: OutputStructure = JSON.parse(fs.readFileSync(options.storageFilePath, 'utf-8'));
        const hashes: HashFileStructure = JSON.parse(fs.readFileSync(options.storageHashFilePath, 'utf-8'));

        const processedStorage = await processor(
            modelsFiltered,
            storage,
            hashes,
            {
                newAndChanged: [
                    generateDescription,
                    generateInitialPricing,
                    generateSummaryInformation
                ],
                batch: [
                    generateDescriptionTranslations,
                    cleanupDescriptions
                ],
                noChange: [
                    // @todo we could add a step to update the pricing (exchange rates) on unchanged models here
                ],
                outputStructure: [
                    extractProviderInformation
                ]
            },
            options
        );

        fs.writeFileSync(options.storageFilePath, JSON.stringify(processedStorage), 'utf-8');
        fs.writeFileSync(options.storageHashFilePath, JSON.stringify(hashes, null, 2), 'utf-8');

        console.log('Processing completed successfully.');
    } catch (e) {
        console.error('ERROR DURING RUN:', e);
        setFailed(`Run failed: ${e.message}`);
        process.exit(1);
    }
}
