/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SystemPrompt = {
    /**
     * Unique identifier for the system prompt
     */
    id: string;
    /**
     * Display name for the system prompt
     */
    name: string;
    /**
     * The actual system prompt text
     */
    content: string;
    /**
     * Optional description of the prompt's purpose
     */
    description?: (string | null);
    created_at?: string;
    updated_at?: string;
    /**
     * Whether this prompt should use API caching
     */
    is_cached?: boolean;
};

