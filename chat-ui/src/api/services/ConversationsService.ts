/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Conversation } from '../models/Conversation';
import type { ConversationCreate } from '../models/ConversationCreate';
import type { ConversationUpdate } from '../models/ConversationUpdate';
import type { Message } from '../models/Message';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ConversationsService {
    /**
     * Get Conversations
     * Get all conversations.
     * @returns Conversation Successful Response
     * @throws ApiError
     */
    public static getConversationsConversationsGet(): CancelablePromise<Array<Conversation>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/conversations',
        });
    }
    /**
     * Create Conversation
     * Create a new conversation.
     * @param requestBody
     * @returns Conversation Successful Response
     * @throws ApiError
     */
    public static createConversationConversationsPost(
        requestBody: ConversationCreate,
    ): CancelablePromise<Conversation> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/conversations',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Conversation
     * Get a conversation by ID.
     * @param conversationId
     * @returns Conversation Successful Response
     * @throws ApiError
     */
    public static getConversationConversationsConversationIdGet(
        conversationId: string,
    ): CancelablePromise<Conversation> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/conversations/{conversation_id}',
            path: {
                'conversation_id': conversationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Remove Conversation
     * Delete a conversation.
     * @param conversationId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static removeConversationConversationsConversationIdDelete(
        conversationId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/conversations/{conversation_id}',
            path: {
                'conversation_id': conversationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Conversation
     * Update conversation metadata.
     * @param conversationId
     * @param requestBody
     * @returns Conversation Successful Response
     * @throws ApiError
     */
    public static updateConversationConversationsConversationIdPut(
        conversationId: string,
        requestBody: ConversationUpdate,
    ): CancelablePromise<Conversation> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/conversations/{conversation_id}',
            path: {
                'conversation_id': conversationId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Message
     * Update a message in a conversation.
     * @param conversationId
     * @param messageId
     * @param requestBody
     * @returns Conversation Successful Response
     * @throws ApiError
     */
    public static updateMessageConversationsConversationIdMessagesMessageIdPut(
        conversationId: string,
        messageId: string,
        requestBody: Message,
    ): CancelablePromise<Conversation> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/conversations/{conversation_id}/messages/{message_id}',
            path: {
                'conversation_id': conversationId,
                'message_id': messageId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Message
     * Delete a message from a conversation.
     * @param conversationId
     * @param messageId
     * @returns Conversation Successful Response
     * @throws ApiError
     */
    public static deleteMessageConversationsConversationIdMessagesMessageIdDelete(
        conversationId: string,
        messageId: string,
    ): CancelablePromise<Conversation> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/conversations/{conversation_id}/messages/{message_id}',
            path: {
                'conversation_id': conversationId,
                'message_id': messageId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Toggle Message Cache
     * Toggle the cache flag for a message.
     * @param conversationId
     * @param messageId
     * @returns Conversation Successful Response
     * @throws ApiError
     */
    public static toggleMessageCacheConversationsConversationIdMessagesMessageIdCachePost(
        conversationId: string,
        messageId: string,
    ): CancelablePromise<Conversation> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/conversations/{conversation_id}/messages/{message_id}/cache',
            path: {
                'conversation_id': conversationId,
                'message_id': messageId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add Message
     * Add a message to a conversation and get Claude's streaming response.
     * @param conversationId
     * @param requestBody
     * @returns any Streaming response from Claude
     * @throws ApiError
     */
    public static addMessageConversationsConversationIdMessagesPost(
        conversationId: string,
        requestBody: Message,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/conversations/{conversation_id}/messages',
            path: {
                'conversation_id': conversationId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Conversation Markdown
     * Get a conversation in markdown format.
     * @param conversationId
     * @returns string Successful Response
     * @throws ApiError
     */
    public static getConversationMarkdownConversationsConversationIdMarkdownGet(
        conversationId: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/conversations/{conversation_id}/markdown',
            path: {
                'conversation_id': conversationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Clone Conversation
     * Clone an existing conversation.
     * @param conversationId
     * @returns Conversation Successful Response
     * @throws ApiError
     */
    public static cloneConversationConversationsConversationIdClonePost(
        conversationId: string,
    ): CancelablePromise<Conversation> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/conversations/{conversation_id}/clone',
            path: {
                'conversation_id': conversationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
