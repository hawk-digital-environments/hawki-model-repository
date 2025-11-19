import type {ModelInformation, ModelInformationOfProvider} from 'src/sources/types.js';

export interface ProcessedModelProviderInformation extends Omit<ModelInformationOfProvider, 'price' | 'providerName'> {
    /**
     * The pricing information for the model from this provider.
     * The key of the record is the currency code, a string of: https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json
     * @todo This is a really basic structure for pricing, we might need to extend this in the future to support more complex pricing models.
     */
    price: Record<string, {
        /**
         * The currency in which the pricing is given, a string of: https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json
         */
        currency: string;
        /**
         * The price per 1M input tokens, in the given currency. If not known, this property may be omitted.
         * The value is given as a number (e.g., 0.02 for $0.02 per 1M tokens) Zero indicates free usage; omit if unknown.
         */
        input?: string;
        /**
         * The price per 1M output tokens, in the given currency. If not known, this property may be omitted.
         * The value is given as a number (e.g., 0.02 for $0.02 per 1M tokens) Zero indicates free usage; omit if unknown.
         */
        output?: string;
    }>;
}

export interface ProcessedModelInformation extends Omit<ModelInformation, 'description' | 'providers'> {
    /**
     * The localized descriptions for the model, "en" is always present, the other keys depend on the available translations.
     */
    description?: { en: string } & Record<string, string>;

    /**
     * The maximum context length of the model in number of tokens. If not known, this property may be omitted.
     * This value always represents the MINIMUM of all contextLength values defined in the `providers` array.
     */
    contextLength?: number;

    /**
     * If known, the maximum number of completion tokens the model supports. If not known, this property may be omitted.
     * This value always represents the MINIMUM of all inputLimit values defined in the `providers` array.
     */
    inputLimit?: number;

    /**
     * If known, the maximum number of prompt tokens the model supports. If not known, this property may be omitted.
     * This value always represents the MINIMUM of all outputLimit values defined in the `providers` array.
     */
    outputLimit?: number;

    /**
     * If true, the model has been removed from all sources and is therefore deprecated.
     */
    deprecated?: boolean;

    /**
     * The ISO 8601 date string of when this model was last imported from the sources.
     * This value only updates when the model information changes.
     */
    lastImportedAt?: string;

    /**
     * The list of providers that offer this model along with their specific information.
     */
    providers: ProcessedModelProviderInformation[];
}

export interface ProviderInformation {
    /**
     * The unique id of the provider
     */
    id: string;
    /**
     * The name of the provider
     */
    name: string;
}

export interface OutputStructure {
    /**
     * The list of model information entries
     */
    models: ProcessedModelInformation[];
    /**
     * The list of provider information entries
     */
    providers: ProviderInformation[];
}

export type HashFileStructure = Record<string, string>;
