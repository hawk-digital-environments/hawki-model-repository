import type {ModelInformation} from 'src/sources/types.js';
import type {OutputStructure, ProcessedModelInformation} from 'src/types.js';
import type {RunOptions} from 'src/processing/run.js';
import type {AppCache} from 'src/processing/AppCache.js';

/**
 * A processing step that takes the source model information, the existing processed model information (if any),
 * the new processed model information being built, and the run options.
 * This step is executed when the source model has changed or is new.
 * It returns the updated processed model information after applying the processing step.
 * The return value is the updated value of "newModel" after processing.
 */
export type ProcessingStep = (
    sourceModel: ModelInformation,
    existingModel: ProcessedModelInformation | undefined,
    newModel: ProcessedModelInformation,
    options: RunOptions,
    cache: AppCache
) => Promise<ProcessedModelInformation>;

/**
 * Executed after all individual models have been processed.
 * This step receives the full list of already processed models and must return the full list of processed models.
 * This can be used to apply batch operations, such as deduplication, translations, or sorting.
 * This step only applies to "new" models, or those of which the source has changed.
 */
export type BatchProcessingStep = (
    models: ProcessedModelInformation[],
    options: RunOptions,
    cache: AppCache
) => Promise<ProcessedModelInformation[]>;

/**
 * This is a processing step the is only run when the model in the source has not changed.
 * This can be used to update pricing or other dynamic information without needing to re-process
 * the entire model information.
 * The return value is the updated value of "existingModel" after processing.
 */
export type ProcessingNoChangeStep = (
    sourceModel: ModelInformation,
    existingModel: ProcessedModelInformation,
    options: RunOptions,
    cache: AppCache
) => Promise<ProcessedModelInformation>;

/**
 * A processing step that modifies the overall output structure after all models have been processed.
 * These steps are executed every time, regardless of whether individual models have changed or not.
 * The return value is the updated output structure after processing.
 */
export type ProcessingOutputStructureStep = (
    structure: OutputStructure,
    options: RunOptions,
    cache: AppCache
) => Promise<OutputStructure>;
