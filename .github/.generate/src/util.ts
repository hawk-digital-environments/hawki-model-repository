/**
 * Returns the last part of a model id with potential namespaces.
 * "namespace/model" => "model"
 * "model" => "model"
 * @param modelId
 */
export function getModelBaseId(modelId: string): string {
    const parts = modelId.split('/');
    if (parts.length <= 1) {
        return modelId;
    }
    return parts[parts.length - 1];
}

/**
 * Removes exactly one namespace from the start of a model id.
 * "namespace/model" => "model"
 * "provider/namespace/model" => "namespace/model"
 * "model" => "model"
 * @param modelId
 */
export function removeModelidNamespace(modelId: string): string {
    const parts = modelId.split('/');
    if (parts.length <= 1) {
        return modelId;
    }
    parts.shift();
    return parts.join('/');
}

/**
 * Returns tue if the model id looks like a junk model id (e.g. contains a date or "latest").
 * @param modelId
 */
export function isJunkModelId(modelId: string): boolean {
    return /[@-](\d{8})(.|$)/.test(modelId) // matches @20231031, -20231031
        || /[@-](\d{4}-\d{2}-\d{2})(.|$)/.test(modelId) // matches @2023-10-31, -2023-10-31
        || /[@-][10][0-9]-[23]\d/.test(modelId) // matches @10-23xx, -10-23xx, @10-31xx, -10-31xx so we are fine for the next decades
        || /[@-][23]\d[10][0-9]/.test(modelId) // matches @23xx, -23xx, @31xx, -31xx so we are fine for the next decades
        || modelId.toLowerCase().includes('preview')
        || modelId.toLowerCase().includes('-latest');
}
