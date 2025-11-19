import type {ModelInformation, ModelInformationOfProvider} from 'src/sources/types.js';

export function deduplicateModels(models: ModelInformation[]): ModelInformation[] {
    const makeIdComparable = (id: string) => id.toLowerCase()
        .replace(/[^a-z0-9]/g, ''); // normalize by lowercasing and removing non-alphanumeric characters

    const freeSuffix = ':free';

    const modelsById = new Map<string, ModelInformation>();
    for (const model of models) {

        const isFreeModel = model.id.toLowerCase().endsWith(freeSuffix);
        if (isFreeModel) {
            model.id = model.id.slice(0, -freeSuffix.length);
            model.aliases.push(model.id);
        }

        const comparableId = makeIdComparable(model.id);
        if (!modelsById.has(comparableId)) {
            modelsById.set(comparableId, model);
            continue;
        }

        const existingModel = modelsById.get(comparableId)!;

        // Merge aliases
        existingModel.aliases = Array.from(new Set([...existingModel.aliases, ...model.aliases]))
            .sort((a, b) => b.length - a.length);

        // Merge providers
        if (isFreeModel) {
            existingModel.freeProviders = deduplicateProviders([...(existingModel.freeProviders ?? []), ...model.providers]);
        } else {
            existingModel.providers = deduplicateProviders([...existingModel.providers, ...model.providers]);
        }

        if (existingModel.description === '' && model.description !== '') {
            existingModel.description = model.description;
        }

        const aInput = new Set(existingModel.input);
        const bInput = new Set(model.input);
        if (aInput.size !== bInput.size || ![...aInput].every(value => bInput.has(value))) {
            existingModel.input = Array.from(new Set([...existingModel.input, ...model.input]));
        }

        const aOutput = new Set(existingModel.output);
        const bOutput = new Set(model.output);
        if (aOutput.size !== bOutput.size || ![...aOutput].every(value => bOutput.has(value))) {
            existingModel.output = Array.from(new Set([...existingModel.output, ...model.output]));
        }

        const aParameters = new Set(existingModel.parameters ?? []);
        const bParameters = new Set(model.parameters ?? []);
        if (aParameters.size !== bParameters.size || ![...aParameters].every(value => bParameters.has(value))) {
            existingModel.parameters = Array.from(new Set([...existingModel.parameters!, ...model.parameters!]));
        }

        // Merge defaultParameters, but without overwriting existing values
        if (model.defaultParameters) {
            existingModel.defaultParameters = {
                ...model.defaultParameters,
                ...(existingModel.defaultParameters ?? {})
            };
        }

        // Merge flags, if we have false in either, set to false, if existing is undefined, take from model, otherwise keep existing
        const flags = ['openWeights', 'reasoning', 'toolCalling'] as const;
        for (const flag of flags) {
            if (existingModel[flag] === false || model[flag] === false) {
                existingModel[flag] = false;
            } else if (existingModel[flag] === undefined) {
                existingModel[flag] = model[flag];
            }
        }

        // Merge knowledge date to the earliest date
        if (existingModel.knowledge && model.knowledge) {
            const existingDate = new Date(existingModel.knowledge);
            const modelDate = new Date(model.knowledge);
            if (modelDate < existingDate) {
                existingModel.knowledge = model.knowledge;
            }
        } else if (!existingModel.knowledge && model.knowledge) {
            existingModel.knowledge = model.knowledge;
        }
    }

    return Array.from(modelsById.values());
}

/**
 * Merge duplicate providers in the given list of ModelInformationOfProvider.
 * merge if:
 *  a.providerId === b.providerId
 *  or a.providerName.length > 5 && b.providerName.startsWith(a.providerName)
 *  or b.providerName.length > 5 && a.providerName.startsWith(b.providerName)
 * do not merge if:
 *  price.currency differs
 *
 * when merging:
 *  take the lower contextLength, inputLimit, outputLimit (keep undefined as unknown)
 *  merge price objects, taking the higher price for input and output (keep undefined as unknown)
 *  take the shorter provider id, but the longer provider name
 *
 * @param providers
 */
function deduplicateProviders(providers: ModelInformationOfProvider[]): ModelInformationOfProvider[] {
    const deduplicated: ModelInformationOfProvider[] = [];

    for (const provider of providers) {
        const existing = deduplicated.find(p =>
            p.price?.currency === provider.price?.currency &&
            (
                p.providerId === provider.providerId ||
                (p.providerName && provider.providerName && p.providerName.length > 5 && provider.providerName.startsWith(p.providerName)) ||
                (p.providerName && provider.providerName && provider.providerName.length > 5 && p.providerName.startsWith(provider.providerName))
            )
        );

        if (existing) {
            // Merge providerId
            if (provider.providerId.length < existing.providerId.length) {
                existing.providerId = provider.providerId;
            }

            // Merge providerName
            if (provider.providerName && (!existing.providerName || provider.providerName.length > existing.providerName.length)) {
                existing.providerName = provider.providerName;
            }

            // Merge contextLength
            if (provider.contextLength !== undefined) {
                if (existing.contextLength === undefined || provider.contextLength < existing.contextLength) {
                    existing.contextLength = provider.contextLength;
                }
            }

            // Merge inputLimit
            if (provider.inputLimit !== undefined) {
                if (existing.inputLimit === undefined || provider.inputLimit < existing.inputLimit) {
                    existing.inputLimit = provider.inputLimit;
                }
            }

            // Merge outputLimit
            if (provider.outputLimit !== undefined) {
                if (existing.outputLimit === undefined || provider.outputLimit < existing.outputLimit) {
                    existing.outputLimit = provider.outputLimit;
                }
            }

            // Merge price
            if (provider.price) {
                if (!existing.price) {
                    existing.price = {
                        currency: provider.price.currency
                    };
                }
                if (provider.price.input !== undefined) {
                    if (existing.price.input === undefined || parseFloat(provider.price.input) > parseFloat(existing.price.input)) {
                        existing.price.input = provider.price.input;
                    }
                }
                if (provider.price.output !== undefined) {
                    if (existing.price.output === undefined || parseFloat(provider.price.output) > parseFloat(existing.price.output)) {
                        existing.price.output = provider.price.output;
                    }
                }
            }
        } else {
            deduplicated.push(provider);
        }
    }

    return deduplicated;
}
