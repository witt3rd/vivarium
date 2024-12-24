/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for updating conversation metadata.
 */
export type MetadataUpdate = {
    name: string;
    system_prompt_id?: (string | null);
    model?: (string | null);
    max_tokens?: (number | null);
    tags?: Array<string>;
};

