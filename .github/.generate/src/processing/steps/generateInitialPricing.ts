import type {ProcessingStep} from 'src/processing/steps/types.js';
import type {ProcessedModelProviderInformation} from 'src/types.js';
import {convertCurrency} from 'src/processing/util/convertCurrency.js';

export const generateInitialPricing: ProcessingStep = async (
    sourceModel,
    _,
    newModel,
    options,
    cache
) => {
    console.log('Generating initial pricing for model', sourceModel.id);

    const providersWithPricing: ProcessedModelProviderInformation[] = [];
    for (const provider of sourceModel.providers) {
        if (provider.price) {
            console.log('Converting pricing for model', sourceModel.id, 'from provider', provider.providerId);
            const sourceCurrency = provider.price.currency;
            const prices: ProcessedModelProviderInformation['price'] = {
                [sourceCurrency]: {
                    currency: sourceCurrency,
                    input: provider.price.input,
                    output: provider.price.output
                }
            };
            for (const targetCurrency of options.additionalCurrencies) {
                if (targetCurrency.toLowerCase() === sourceCurrency.toLowerCase()) {
                    continue;
                }

                for (const priceType of ['input', 'output'] as const) {
                    if (provider.price[priceType]) {
                        const convertedPrice = await convertCurrency(
                            provider.price[priceType]!,
                            sourceCurrency,
                            targetCurrency,
                            cache
                        );
                        if (!prices[targetCurrency]) {
                            prices[targetCurrency] = {
                                currency: targetCurrency
                            };
                        }
                        prices[targetCurrency][priceType] = convertedPrice;
                    }
                }
            }
            providersWithPricing.push({
                ...provider,
                price: prices
            });
        }
    }
    newModel.providers = providersWithPricing;

    return newModel;
};
