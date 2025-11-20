import type {ModelInformation} from 'src/sources/types.js';
import type {HashFileStructure, OutputStructure, ProcessedModelInformation} from 'src/types.js';
import {createCache} from 'src/processing/AppCache.js';
import {hash} from 'node:crypto';
import type {RunOptions} from 'src/processing/run.js';
import type {BatchProcessingStep, ProcessingNoChangeStep, ProcessingOutputStructureStep, ProcessingStep} from 'src/processing/steps/types.js';

/**
 * The main processor function that handles the processing of source models against existing models.
 * @param sourceModels The list of models obtained from the sources.
 * @param structure The existing structure containing previously processed models.
 * @param hashes The existing hashes structure containing previously calculated hashes. This object can be modified and will be persisted automatically.
 * @param steps Collection of processing steps to apply.
 * @param steps.newAndChanged A list of processing steps to apply when a model has changed or is new.
 * @param steps.batch A list of batch processing steps to apply after individual model processing.
 * @param steps.noChange A list of processing steps to apply when a model is unchanged.
 * @param steps.outputStructure A list of processing steps to apply to the overall output structure.
 * @param options The run options containing configuration and secrets.
 */
export async function processor(
    sourceModels: ModelInformation[],
    structure: OutputStructure,
    hashes: HashFileStructure,
    steps: {
        newAndChanged: ProcessingStep[];
        batch: BatchProcessingStep[];
        noChange: ProcessingNoChangeStep[];
        outputStructure: ProcessingOutputStructureStep[]
    },
    options: RunOptions
): Promise<OutputStructure> {
    const cache = createCache(options.cacheFilePath);
    const existingModels = structure.models ?? [];
    const existingModelIds = existingModels.map(m => m.id);
    const sourceModelIds = sourceModels.map(m => m.id);
    const missingModelIds = existingModelIds.filter(id => !sourceModelIds.includes(id));

    const {
        newAndChanged: newAndChangedSteps = [],
        batch: batchSteps = [],
        noChange: noChangeSteps = [],
        outputStructure: outputStructureSteps = []
    } = steps;

    for (const missingModelId of missingModelIds) {
        console.log('Model', missingModelId, 'is missing from source and will now be marked as deprecated.');
        const existingModel = existingModels.find(m => m.id === missingModelId)!;
        existingModel.deprecated = true;
    }

    let newModelsList: ProcessedModelInformation[] = [];

    for (const sourceModel of sourceModels) {
        console.log('Processing model', sourceModel.id);
        const newHash = calculateModelHash(sourceModel);
        const existingHash = hashes[sourceModel.id] ?? '-1';

        let existingModel: ProcessedModelInformation | null = null;
        let newModel: ProcessedModelInformation = {
            ...sourceModel,
            description: undefined,
            lastImportedAt: new Date().toISOString(),
            providers: []
        };

        if (existingModelIds.includes(sourceModel.id)) {
            existingModel = existingModels.find(m => m.id === sourceModel.id)!;
            if (existingHash === newHash) {
                // The source model is exactly the same as before.
                console.log('Model', sourceModel.id, 'is unchanged.');
                if (noChangeSteps.length > 0) {
                    for (const step of noChangeSteps) {
                        existingModel = await step(sourceModel, existingModel, options, cache);
                    }
                    newModelsList.push(existingModel);
                }
                continue;
            }
        }

        // Update the hash for this model
        hashes[sourceModel.id] = newHash;

        // The source model has changed, or is new.
        for (const step of newAndChangedSteps) {
            newModel = await step(sourceModel, existingModel ?? undefined, newModel, options, cache);
        }

        newModelsList.push(newModel);
    }

    // Apply batch processing steps
    for (const batchStep of batchSteps) {
        newModelsList = await batchStep(newModelsList, options, cache);
    }

    // Add back any existing models that were not in the source (and thus not processed above)
    for (const existingModel of existingModels) {
        if (!newModelsList.find(m => m.id === existingModel.id)) {
            newModelsList.push(existingModel);
        }
    }

    // Sort the final list by model ID for consistency
    newModelsList.sort((a, b) => a.id.localeCompare(b.id));

    structure = {
        ...structure,
        models: newModelsList
    };

    // Apply output structure processing steps
    for (const outputStructureStep of outputStructureSteps) {
        structure = await outputStructureStep(structure, options, cache);
    }

    return structure;
}

/**
 * Stringify and hash the model information to create a unique identifier for the model's data.
 * Ensure to sort lists to maintain consistency.
 * @param model
 */
function calculateModelHash(model: ModelInformation): string {
    const modelCopy = {...model};

    modelCopy.aliases = [...model.aliases].sort();
    modelCopy.providers = [...model.providers].sort((a, b) => a.providerId.localeCompare(b.providerId));
    const modelString = JSON.stringify(modelCopy);

    return hash('sha256', modelString);
}
