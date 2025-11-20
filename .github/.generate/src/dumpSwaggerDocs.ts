import {createProgram, TsOAS} from 'ts-oas';
import {resolve} from 'path';
import {getConfigFromFile} from 'ts-oas/dist/util.js';
import path from 'node:path';
import {stringify} from 'yaml';
import * as fs from 'node:fs';

/* ====================================================================================
 * Generate OpenAPI spec for the types defined in src/types.openapi.ts
 * These types will be used to display the API documentation on the website
 * ==================================================================================== */

const config = getConfigFromFile(path.join(__dirname, '../tsconfig.json'));
const tsProgram = createProgram(
    [
        'src/types.openapi.ts'
    ],
    {
        ...config,
        module: 'nodenext',
        target: 'esnext'
    },
    resolve()
);

const tsoas = new TsOAS(tsProgram, {ref: true});
const specObject = tsoas.getOpenApiSpec([/GetModelsAPI/]);
specObject.info = {
    ...specObject.info,
    title: 'HAWKI - Model Repository',
    version: '1.0.0',
    description: `Welcome to the HAWKI Model Repository API! 🚀
    
**BETA NOTICE:** This API is currently in beta. While we strive for accuracy and reliability, please be aware that the structure and content of the API may change as we continue to improve and expand the list.

This API provides comprehensive, up-to-date information about AI models from various providers, including pricing, capabilities, and technical specifications. Whether you're building the next great AI application or just exploring what's available, you'll find everything you need to make informed decisions about model selection.

Our database is automatically refreshed twice daily, ensuring you always have access to the latest model information, pricing updates, and new releases. From free tiers to enterprise options, from text generation to multimodal capabilities - it's all here.

Happy building! 🛠️`,
    license: {
        name: 'Apache License 2.0',
        url: 'https://www.apache.org/licenses/LICENSE-2.0.html'
    },
    contact: {
        name: 'HAWKI',
        url: 'https://hawki.info',
        email: 'ki@hawk.de'
    }
};
specObject.externalDocs = {
    description: 'The GitHub Repository of this project',
    url: 'https://github.com/hawk-digital-environments/hawki-model-repository'
};
specObject.servers = [
    {
        url: 'https://models.hawki.info',
        description: 'The official HAWKI Model Repository server'
    }
];

const openapiYml = stringify(specObject);

fs.writeFileSync(path.join(__dirname, '..', 'pages', 'static', 'openapi.yml'), openapiYml);
