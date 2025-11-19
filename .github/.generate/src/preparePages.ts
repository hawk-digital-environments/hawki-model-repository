import path from 'node:path';
import * as fs from 'node:fs';
import {setOutput} from '@actions/core';

/* ====================================================================================
 * Packs up all required files for the GitHub Pages deployment
 * If any of the expected files are missing, we throw an error to prevent incomplete deployments
 * ==================================================================================== */

const pagesDir = path.join(__dirname, '..', 'pages');
const staticDir = path.join(pagesDir, 'static');

if (!fs.existsSync(staticDir)) {
    throw new Error(`The static directory "${staticDir}" does not exist. Please make sure you have built the pages before deploying.`);
}

const modelsJsonSrc = path.join(__dirname, '..', '..', '..', 'models.json');

if (!fs.existsSync(modelsJsonSrc)) {
    throw new Error(`The models.json file "${modelsJsonSrc}" does not exist. Please make sure you have run the model list update script before deploying.`);
}

const modelsJsonDest = path.join(pagesDir, 'models.json'); // The models.json is at the root directory of the pages
fs.copyFileSync(modelsJsonSrc, modelsJsonDest);

const openapiSrc = path.join(staticDir, 'openapi.yml');
if (!fs.existsSync(openapiSrc)) {
    throw new Error(`The OpenAPI spec file "${openapiSrc}" does not exist. Please make sure you have run the dumpSwaggerDocs script before deploying.`);
}

const openapiViewerSourceDir = path.join(__dirname, '..', 'node_modules', 'swagger-ui-dist');
const openapiViewerDestDir = staticDir;

if (!fs.existsSync(openapiViewerSourceDir)) {
    throw new Error(`The Swagger UI source directory "${openapiViewerSourceDir}" does not exist. Please make sure you have installed the dependencies before deploying.`);
}

const requiredFiles = [
    'swagger-ui.css',
    'swagger-ui-bundle.js',
    'swagger-ui-standalone-preset.js'
];

for (const file of requiredFiles) {
    const src = path.join(openapiViewerSourceDir, file);
    const dest = path.join(openapiViewerDestDir, file);

    if (!fs.existsSync(src)) {
        throw new Error(`The required Swagger UI file "${src}" does not exist. Please make sure you have installed the dependencies before deploying.`);
    }
    fs.copyFileSync(src, dest);
}

/**
 * Sets the output variable 'pages-dir' to the path of the prepared pages directory.
 * This allows subsequent steps in the GitHub Actions workflow to easily access the directory for deployment.
 */
setOutput('pages-dir', pagesDir);
