/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Message } from './Message';
export type Conversation = {
    id?: string;
    name: string;
    messages?: Array<Message>;
    system_prompt_id?: (string | null);
    model?: string;
    max_tokens?: number;
};

