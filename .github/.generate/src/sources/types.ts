import type {RunOptions} from 'src/processing/run.js';

export interface ModelInformationOfProvider {
    /**
     * The unique identifier of the provider of the model (e.g., "openai", "anthropic", "google", etc.)
     */
    providerId: ProviderIdentifier | string;
    /**
     * A human-readable name of the provider
     * Can be omitted if the providerId is a well-known provider
     */
    providerName?: string;
    /**
     * The maximum context length of the model in number of tokens. If not known, this property may be omitted.
     */
    contextLength?: number;
    /**
     * If known, the maximum number of completion tokens the model supports. If not known, this property may be omitted.
     */
    inputLimit?: number;
    /**
     * If known, the maximum number of prompt tokens the model supports. If not known, this property may be omitted.
     */
    outputLimit?: number;
    /**
     * An object describing the pricing of the model for this provider.
     * @todo This is a really basic structure for pricing, we might need to extend this in the future to support more complex pricing models.
     */
    price?: {
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
    };
}

export interface ModelInformation {
    /**
     * The unique identifier of the model, without any prefixing.
     * This is used to uniquely identify the model across different providers.
     */
    id: string;
    /**
     * A list of alternative ids of this model. SHOULD include the id.
     */
    aliases: string[];
    /**
     * A human-readable name of the model
     */
    name: string;
    /**
     * A description of the model in english language. If no description is available, this property may be an empty string.
     */
    description: string;
    /**
     * The list of input modalities supported by the model
     */
    input: Array<'text' | 'image' | 'file' | 'audio' | 'video'>;
    /**
     * The list of output modalities supported by the model
     */
    output: Array<'text' | 'image' | 'embeddings'>;
    /**
     * Indicates whether the model supports multi-step logical reasoning.
     * If not known, this property may be omitted.
     */
    reasoning?: boolean;
    /**
     * Indicates whether the model's weights are open source and publicly available.
     * If not known, this property may be omitted.
     */
    openWeights?: boolean;
    /**
     * Indicates whether the model supports tool calling.
     * If not known, this property may be omitted.
     */
    toolCalling?: boolean;
    /**
     * The Knowledge cutoff date of the model in ISO 8601 format (e.g., "2023-01-01").
     * If the model does not have a knowledge cutoff, or if it is not known, this property may be omitted.
     */
    knowledge?: string;
    /**
     * A list of supported parameters that can be used when invoking the model.
     * The parameters are represented by their string names (e.g., "temperature", "top_p", etc.)
     *
     * Well known parameters:
     * - max_tokens: This sets the upper limit for the number of tokens the model can generate in response. It won't produce more than this limit. The maximum value is the context length minus the prompt length.
     * - structured_outputs: If the model can return structured outputs using response_format json_schema.
     * - response_format: Forces the model to produce specific output format. Setting to { "type": "json_object" } enables JSON mode, which guarantees the message the model generates is valid JSON. Note: when using JSON mode, you should also instruct the model to produce JSON yourself via a system or user message.
     * - seed: If specified, the inferencing will sample deterministically, such that repeated requests with the same seed and parameters should return the same result. Determinism is not guaranteed for some models.
     * - frequency_penalty: This setting aims to control the repetition of tokens based on how often they appear in the input. It tries to use less frequently those tokens that appear more in the input, proportional to how frequently they occur. Token penalty scales with the number of occurrences. Negative values will encourage token reuse.
     * - presence_penalty: Adjusts how often the model repeats specific tokens already used in the input. Higher values make such repetition less likely, while negative values do the opposite. Token penalty does not scale with the number of occurrences. Negative values will encourage token reuse.
     * - stop: Stop generation immediately if the model encounter any token specified in the stop array.
     * - logprobs: Whether to return log probabilities of the output tokens or not. If true, returns the log probabilities of each output token returned.
     * - top_logprobs: An integer between 0 and 20 specifying the number of most likely tokens to return at each token position, each with an associated log probability. logprobs must be set to true if this parameter is used.
     * - temperature: This setting influences the variety in the model's responses. Lower values lead to more predictable and typical responses, while higher values encourage more diverse and less common responses. At 0, the model always gives the same response for a given input.
     * - top_p: This setting limits the model's choices to a percentage of likely tokens: only the top tokens whose probabilities add up to P. A lower value makes the model's responses more predictable, while the default setting allows for a full range of token choices. Think of it like a dynamic Top-K.
     * - top_k: This limits the model's choice of tokens at each step, making it choose from a smaller set. A value of 1 means the model will always pick the most likely next token, leading to predictable results. By default this setting is disabled, making the model to consider all choices.
     * - min_p: Represents the minimum probability for a token to be considered, relative to the probability of the most likely token. (The value changes depending on the confidence level of the most probable token.) If your Min-P is set to 0.1, that means it will only allow for tokens that are at least 1/10th as probable as the best possible option.
     * - logit_bias: Accepts a JSON object that maps tokens (specified by their token ID in the tokenizer) to an associated bias value from -100 to 100. Mathematically, the bias is added to the logits generated by the model prior to sampling. The exact effect will vary per model, but values between -1 and 1 should decrease or increase likelihood of selection; values like -100 or 100 should result in a ban or exclusive selection of the relevant token.
     */
    parameters?: string[];
    /**
     * A record of default parameter values for the model. The keys are the parameter names, and the values are the default values.
     */
    defaultParameters?: Record<string, any>;
    /**
     * Provider specific information about this model from different providers
     */
    providers: ModelInformationOfProvider[];
    /**
     * Lists the providers, that provide a free tier for this model (if any).
     */
    freeProviders?: ModelInformationOfProvider[];
}

/**
 * Defines a function that retrieves model information based on the provided run options.
 * The function returns a promise that resolves to an array of ModelInformation objects.
 * @param options The run options to use for retrieving model information.
 * @returns A promise that resolves to an array of ModelInformation objects.
 */
export type ModelInformationSource = (options: RunOptions) => Promise<ModelInformation[]>;

/**
 * A list of well known provider identifiers.
 */
export enum ProviderIdentifier {
    OpenAI = 'openai',
    Anthropic = 'anthropic',
    Google = 'google',
    Microsoft = 'microsoft',
    AI21 = 'ai21',
    Cohere = 'cohere',
    HuggingFace = 'huggingface',
    OpenRouter = 'openrouter'
}

/**
 * A reverse mapping of ProviderIdentifier to human-readable provider names.
 */
export const providerNameMap: Record<ProviderIdentifier, string> = {
    [ProviderIdentifier.OpenAI]: 'OpenAI',
    [ProviderIdentifier.Anthropic]: 'Anthropic',
    [ProviderIdentifier.Google]: 'Google',
    [ProviderIdentifier.Microsoft]: 'Microsoft',
    [ProviderIdentifier.AI21]: 'AI21',
    [ProviderIdentifier.Cohere]: 'Cohere',
    [ProviderIdentifier.HuggingFace]: 'Hugging Face',
    [ProviderIdentifier.OpenRouter]: 'OpenRouter'
};
