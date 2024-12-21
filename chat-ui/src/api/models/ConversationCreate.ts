/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for creating a new conversation.
 */
export type ConversationCreate = {
    name: string;
    id: string;
    system_prompt_id?: (string | null);
    model?: (string | null);
    max_tokens?: (number | null);
};

