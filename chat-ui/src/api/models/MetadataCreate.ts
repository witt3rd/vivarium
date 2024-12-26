/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for creating new conversation metadata.
 */
export type MetadataCreate = {
    name: string;
    id: string;
    system_prompt_id?: (string | null);
    model?: (string | null);
    max_tokens?: (number | null);
    tags?: Array<string>;
    persona_name?: (string | null);
    user_name?: (string | null);
};

