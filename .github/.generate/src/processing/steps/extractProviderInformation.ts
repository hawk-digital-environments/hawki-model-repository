import type {ProcessingOutputStructureStep} from 'src/processing/steps/types.js';
import type {ProviderInformation} from 'src/types.js';
import {type ModelInformationOfProvider, providerNameMap} from 'src/sources/types.js';

export const extractProviderInformation: ProcessingOutputStructureStep = async (
    structure
) => {
    const providerInformationById = new Map<string, ProviderInformation>();
    for (const model of structure.models) {
        for (const provider of model.providers) {
            let providerName = (provider as any as ModelInformationOfProvider).providerName;
            // When importing new models from source, the provider name will still be present in the provider object.
            if (!providerName) {
                // If we can statically determine the provider name, use that.
                if (providerNameMap[provider.providerId as keyof typeof providerNameMap]) {
                    providerName = providerNameMap[provider.providerId as keyof typeof providerNameMap];
                } else {
                    continue;
                }
            }
            const providerId = provider.providerId;

            delete (provider as any as ModelInformationOfProvider).providerName;
            if (!providerInformationById.has(providerId)) {
                providerInformationById.set(providerId, {
                    id: providerId,
                    name: providerName
                });
            }
        }
    }

    // Import existing providers from the structure
    (structure.providers ?? []).map(provider => providerInformationById.set(provider.id, provider));

    structure.providers = Array.from(providerInformationById.values()).sort((a, b) => {
        return a.id.localeCompare(b.id);
    });

    return structure;
};
