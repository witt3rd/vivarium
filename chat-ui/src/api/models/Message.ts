/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessageImage } from './MessageImage';
import type { TokenUsage } from './TokenUsage';
/**
 * A message in a conversation.
 */
export type Message = {
    id?: (string | null);
    role: string;
    content: Array<Record<string, any>>;
    images?: (Array<MessageImage> | null);
    timestamp?: (string | null);
    cache?: boolean;
    assistant_message_id?: (string | null);
    usage?: (TokenUsage | null);
};

