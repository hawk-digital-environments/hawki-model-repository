import type {ProcessingStep} from 'src/processing/steps/types.js';

/**
 * Generates the contextLength, inputLimit and outputLimit information based on the available providers.
 */
export const generateSummaryInformation: ProcessingStep = async (
    _,
    __,
    newModel
) => {
    const fields = ['inputLimit', 'outputLimit', 'contextLength'] as const;
    for (const field of fields) {
        const values = newModel.providers
            .map(p => p[field] || 0)
            .filter(l => l > 0);
        if (values.length > 0) {
            // We take the minimum value across all providers, to be sure we don't overstate it.
            newModel[field] = Math.min(...values);
        } else {
            newModel[field] = undefined;
        }
    }

    return newModel;
};
