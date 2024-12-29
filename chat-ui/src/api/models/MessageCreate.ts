/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for creating a new message with optional images.
 */
export type MessageCreate = {
    id: string;
    assistant_message_id: string;
    content: Array<Record<string, any>>;
    cache?: boolean;
};

