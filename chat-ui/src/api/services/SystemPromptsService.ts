/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SystemPrompt } from '../models/SystemPrompt';
import type { SystemPromptCreate } from '../models/SystemPromptCreate';
import type { SystemPromptUpdate } from '../models/SystemPromptUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SystemPromptsService {
    /**
     * Get System Prompts
     * Get all system prompts.
     * @returns SystemPrompt Successful Response
     * @throws ApiError
     */
    public static getSystemPromptsSystemPromptsGet(): CancelablePromise<Array<SystemPrompt>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/system-prompts',
        });
    }
    /**
     * Create System Prompt
     * Create a new system prompt.
     * @param requestBody
     * @returns SystemPrompt Successful Response
     * @throws ApiError
     */
    public static createSystemPromptSystemPromptsPost(
        requestBody: SystemPromptCreate,
    ): CancelablePromise<SystemPrompt> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/system-prompts',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get System Prompt
     * Get a specific system prompt.
     * @param promptId
     * @returns SystemPrompt Successful Response
     * @throws ApiError
     */
    public static getSystemPromptSystemPromptsPromptIdGet(
        promptId: string,
    ): CancelablePromise<SystemPrompt> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/system-prompts/{prompt_id}',
            path: {
                'prompt_id': promptId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update System Prompt
     * Update a system prompt.
     * @param promptId
     * @param requestBody
     * @returns SystemPrompt Successful Response
     * @throws ApiError
     */
    public static updateSystemPromptSystemPromptsPromptIdPut(
        promptId: string,
        requestBody: SystemPromptUpdate,
    ): CancelablePromise<SystemPrompt> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/system-prompts/{prompt_id}',
            path: {
                'prompt_id': promptId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete System Prompt
     * Delete a system prompt.
     * @param promptId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteSystemPromptSystemPromptsPromptIdDelete(
        promptId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/system-prompts/{prompt_id}',
            path: {
                'prompt_id': promptId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
