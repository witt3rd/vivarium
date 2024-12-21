/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TokenUsage } from './TokenUsage';
export type Message = {
    id?: (string | null);
    role: string;
    content: Array<Record<string, any>>;
    timestamp?: (string | null);
    cache?: boolean;
    assistant_message_id?: (string | null);
    usage?: (TokenUsage | null);
};

