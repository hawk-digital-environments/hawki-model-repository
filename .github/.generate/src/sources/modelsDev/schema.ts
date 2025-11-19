import {z} from 'zod';

export const modelsDevModelSchema = z.object({
    id: z.string().nonempty(),
    name: z.string().nonempty(),
    attachment: z.boolean().optional(),
    reasoning: z.boolean().optional(),
    tool_call: z.boolean().optional(),
    temperature: z.boolean().optional(),
    knowledge: z.string().optional(),
    open_weights: z.boolean().optional(),
    modalities: z.object({
        input: z.array(z.enum(['text', 'image', 'file', 'audio', 'video', 'pdf'])),
        output: z.array(z.enum(['text', 'image', 'audio', 'embeddings']))
    }),
    cost: z.object({
        input: z.number().optional(),
        output: z.number().optional(),
        cache_read: z.number().optional(),
        cache_write: z.number().optional(),
        reasoning: z.number().optional(),
        input_audio: z.number().optional(),
        output_audio: z.number().optional(),
        context_over_200k: z.object({
            input: z.number().optional(),
            output: z.number().optional(),
            cache_read: z.number().optional(),
            cache_write: z.number().optional()
        }).optional()
    }).optional(),
    limit: z.object({
        context: z.number().optional(),
        output: z.number().optional()
    }).optional()
});

export const modelProviderSchema = z.object({
    id: z.string().nonempty(),
    name: z.string().nonempty(),
    models: z.record(z.string().nonempty(), modelsDevModelSchema)
});
