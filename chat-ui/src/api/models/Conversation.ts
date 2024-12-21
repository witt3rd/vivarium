/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Message } from './Message';
export type Conversation = {
    id?: (string | null);
    name: string;
    system_prompt_id?: (string | null);
    model?: string;
    max_tokens?: number;
    messages?: Array<Message>;
    created_at?: string;
    updated_at?: string;
};

