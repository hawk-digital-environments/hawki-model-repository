import type {BatchProcessingStep} from 'src/processing/steps/types.js';
 
export const cleanupDescriptions: BatchProcessingStep = async (
    models
) => {
    return models.map(model => {
        if (!model.description) {
            return model;
        }

        for (const [locale, description] of Object.entries(model.description)) {
            // Remove spaces,
            // remove line breaks (and replace them with spaces)
            // remove multiple spaces
            // Remove invisible characters like zero-width space (U+200B)
            model.description[locale] = description
                .replace(/\s+/g, ' ')
                .replace(/[\u200B-\u200D\uFEFF]/g, '')
                .trim();
        }

        return model;
    });
};
