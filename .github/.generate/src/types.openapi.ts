import {ApiMapper} from 'ts-oas';
import type {ProcessedModelInformation, ProcessedModelProviderInformation, ProviderInformation} from 'src/types.js';
import type {ModelInformationOfProvider} from 'src/sources/types.js';

/* ====================================================================================
 * OpenAPI types for the /models.json endpoint
 * Remaps some of the internal types to more API-friendly names
 * ==================================================================================== */

/**
 * Information about a provider in the API response.
 */
interface Provider extends ProviderInformation {

}

/**
 * The model information for a provider that offers a free tier for the model.
 */
interface FreeProviderOfModel extends ModelInformationOfProvider {

}

/**
 * The model information for a provider that offers the model.
 */
interface ProviderOfModel extends ProcessedModelProviderInformation {

}

/**
 * The information about a single AI model in the API response.
 */
interface Model extends Omit<ProcessedModelInformation, 'providers' | 'freeProviders'> {
    /**
     * The list of providers that offer this model along with their specific information.
     */
    providers: ProviderOfModel[];
    /**
     * Lists the providers, that provide a free tier for this model (if any).
     */
    freeProviders?: FreeProviderOfModel[];
}

interface ModelsJsonResponse {
    /**
     * The list of model information entries
     */
    models: Model[];
    /**
     * The list of provider information entries
     */
    providers: Provider[];
}

export type GetModelsAPI = ApiMapper<{
    path: '/models.json';
    method: 'GET';
    responses: {
        /** @contentType application/json */
        200: ModelsJsonResponse;
    }
}>
