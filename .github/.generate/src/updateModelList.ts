import {openRouterSource} from 'src/sources/openRouter/openRouterSource.js';
import {modelsDevSource} from 'src/sources/modelsDev/modelsDevSource.js';
import path from 'node:path';
import {getInput} from '@actions/core';
import {run} from 'src/processing/run.js';

/* ====================================================================================
 * Updates the model list by fetching data from various sources and storing it in a JSON file
 * This script is intended to be run as part of a GitHub Actions workflow to keep the model list up-to-date
 * ==================================================================================== */


console.log(process.env['INPUT_OPEN-ROUTER-KEY']?.slice(0, 4) + '...' + process.env['INPUT_OPEN-ROUTER-KEY']?.slice(-4));
/**
 * The API key for OpenRouter, required to fetch the model list from their API
 */
const openRouterKeyInput = getInput('open-router-key', {required: true});
/**
 * The API key for DeepL, required to translate model descriptions
 */
const deepLKeyInput = getInput('deepl-key', {required: true});
/**
 * The API key for OpenAI, required to summarize model descriptions downloaded from huggingface
 */
const openAiKeyInput = getInput('open-ai-key', {required: true});

run({
    sources: [
        modelsDevSource,
        openRouterSource
        // @todo https://api.aimlapi.com/models could be a good source as well, especially for provider based capabilities
        // @todo try to get GWDG sources: https://docs.hpc.gwdg.de/services/chat-ai/models/index.html Is there a JSON/API?
        // @todo https://ki.vcrp.de/modelcards/ Are there API endpoints available?
    ],
    additionalLocales: ['de'],
    additionalCurrencies: ['eur'],
    storageFilePath: path.join(__dirname, '..', '..', '..', 'models.json'),
    storageHashFilePath: path.join(__dirname, '..', '..', '..', 'models.hashes.json'),
    cacheFilePath: path.join(__dirname, '..', '.cache.json'),
    secrets: {
        openRouterKey: openRouterKeyInput,
        deepLKey: deepLKeyInput,
        openAiKey: openAiKeyInput
    }
});
