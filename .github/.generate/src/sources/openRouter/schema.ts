import {z} from 'zod';

function anyToNumberString(value: any): string | undefined {
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number') {
        return value.toString();
    }
    return undefined;
}

// This is the models schema according to: https://openrouter.ai/docs/api-reference/models/get-models
export const openRouterModelSchema = z.object({
    id: z.string().nonempty(),
    canonical_slug: z.string().nonempty(),
    hugging_face_id: z.string().nullable(),
    name: z.string().nonempty(),
    description: z.union([z.string(), z.object({en: z.string()})]).optional().transform(desc => {
        if (typeof desc === 'string') {
            return desc;
        } else if (desc && typeof desc === 'object' && 'en' in desc) {
            return desc.en;
        }
        return '';
    }),
    created: z.number(),
    pricing: z.object({
        prompt: z.union([z.number(), z.string()]).optional().transform(anyToNumberString),
        completion: z.union([z.number(), z.string()]).nullable().optional().transform(anyToNumberString),
        request: z.union([z.number(), z.string()]).nullable().optional().transform(anyToNumberString),
        image: z.union([z.number(), z.string()]).nullable().optional().transform(anyToNumberString),
        image_output: z.union([z.number(), z.string()]).nullable().optional().transform(anyToNumberString),
        audio: z.union([z.number(), z.string()]).nullable().optional().transform(anyToNumberString),
        input_audio_cache: z.union([z.number(), z.string()]).nullable().optional().transform(anyToNumberString),
        web_search: z.union([z.number(), z.string()]).nullable().optional().transform(anyToNumberString),
        internal_reasoning: z.union([z.number(), z.string()]).nullable().optional().transform(anyToNumberString),
        input_cache_read: z.union([z.number(), z.string()]).nullable().optional().transform(anyToNumberString),
        input_cache_write: z.union([z.number(), z.string()]).nullable().optional().transform(anyToNumberString)
    }),
    context_length: z.number().nullable().default(0).transform(val => val && val > 0 ? val : -1),
    architecture: z.object({
        modality: z.string().nullable(),
        input_modalities: z.array(z.enum(['text', 'image', 'file', 'audio', 'video'])),
        output_modalities: z.array(z.enum(['text', 'image', 'embeddings'])),
        tokenizer: z.string(),
        instruct_type: z.string().nullable()
    }),
    top_provider: z.object({
        is_moderated: z.boolean(),
        context_length: z.number().nullable(),
        max_completion_tokens: z.number().nullable()
    }).nullable(),
    per_request_limits: z.object({
        prompt_tokens: z.number().nullable(),
        completion_tokens: z.number().nullable()
    }).nullable(),
    supported_parameters: z.array(z.string()).optional(),
    default_parameters: z.object().nullable().optional()
});
