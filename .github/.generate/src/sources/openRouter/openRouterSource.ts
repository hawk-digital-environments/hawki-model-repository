import {type ModelInformation, type ModelInformationOfProvider, type ModelInformationSource, ProviderIdentifier} from '../types.js';
import axios from 'axios';
import {openRouterModelSchema} from './schema.js';
import Big from 'big.js';
import {getModelBaseId, isJunkModelId} from 'src/util.js';


type OpenRouterModel = ReturnType<(typeof openRouterModelSchema)['parse']>;

async function fetchModels(token: string): Promise<OpenRouterModel[]> {
    try {
        const response = await axios.get(
            'https://openrouter.ai/api/v1/models',
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (response.status !== 200) {
            throw new Error(`Failed to fetch open router models: ${response.status} ${response.statusText}`);
        }

        if (!response.data || !Array.isArray(response.data.data)) {
            throw new Error('Invalid open router response format: expected an array of models');
        }

        return response.data.data.map(
            (model: any) => {
                console.log(`Validating open router model: ${model.id}`);
                return openRouterModelSchema.parse(model);
            }
        );
    } catch (e) {
        throw new Error(`Error fetching open router models: ${(e as Error).message}`);
    }
}

function normalizeModels(models: OpenRouterModel[]): ModelInformation[] {
    const normalizeDescription = (modelId: string, description: any) => {
        const descNormalized = typeof description === 'string' ? description : (description.en || '');
        if (typeof descNormalized !== 'string') {
            console.log(descNormalized);
            throw new Error(`Model ${modelId} description is not a string`);
        }
        if (!descNormalized) {
            throw new Error(`Model ${modelId} description is empty`);
        }

        // Remove references to open router if necessary
        // if(descNormalized.toLowerCase().includes('openrouter') || descNormalized.toLowerCase().includes('open router')){
        //     console.log(description);
        //     process.exit();
        // }

        return descNormalized;
    };

    // per_request_limits
    return models.map(model => {
        const id = getModelBaseId(model.id);

        const idAliases = Array.from(
            new Set(
                [
                    id,
                    model.id,
                    model.canonical_slug ?? '',
                    getModelBaseId(model.canonical_slug ?? ''),
                    model.hugging_face_id ?? '',
                    getModelBaseId(model.hugging_face_id ?? '')
                ].filter(Boolean).map(m => m.toLowerCase())
            )
        );

        const convertPrice = (priceStr: string | undefined) => {
            if (priceStr === '0' || priceStr === '0.0' || priceStr === '0.00') {
                return '0';
            }
            if (!priceStr) {
                return undefined;
            }
            return (new Big(priceStr)).mul(1000000).toString();
        };

        const providerInfo: ModelInformationOfProvider = {
            providerId: ProviderIdentifier.OpenRouter,
            contextLength: model.top_provider?.context_length || model.context_length || undefined,
            inputLimit: model.per_request_limits?.prompt_tokens || undefined,
            outputLimit: model.per_request_limits?.completion_tokens || undefined,
            price: {
                currency: 'usd',
                input: convertPrice(model.pricing.prompt),
                output: convertPrice(model.pricing.completion || '0')
            }
        };

        let knowledgeCutoff: string | undefined = undefined;
        if (model.created) {
            const createDate = new Date(model.created * 1000);
            knowledgeCutoff = createDate.toISOString().split('T')[0];
        }

        const info: ModelInformation = {
            id: id,
            aliases: idAliases.sort((a, b) => b.length - a.length),
            name: model.name,
            description: normalizeDescription(model.id, model.description),
            knowledge: knowledgeCutoff,
            reasoning: (model.supported_parameters?.includes('reasoning') ||
                model.supported_parameters?.includes('include_reasoning')) || undefined,
            toolCalling: (model.supported_parameters?.includes('tools') ||
                model.supported_parameters?.includes('tool_choice')) || undefined,
            input: model.architecture.input_modalities,
            output: model.architecture.output_modalities,
            parameters: model.supported_parameters,
            defaultParameters: model.default_parameters || undefined,
            providers: [providerInfo]
        };

        return info;
    });
}

export const openRouterSource: ModelInformationSource = async (options) => {
    const fetchedModels = await fetchModels(options.secrets.openRouterKey);
    const filteredModels = fetchedModels.filter(model => !isJunkModelId(model.id));
    return normalizeModels(filteredModels);
};
