/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_add_message_conversations__conv_id__messages_post } from '../models/Body_add_message_conversations__conv_id__messages_post';
import type { ConversationMetadata } from '../models/ConversationMetadata';
import type { Message } from '../models/Message';
import type { MetadataCreate } from '../models/MetadataCreate';
import type { MetadataUpdate } from '../models/MetadataUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ConversationsService {
    /**
     * Get Metadata List
     * Get all conversation metadata.
     * @returns ConversationMetadata Successful Response
     * @throws ApiError
     */
    public static getMetadataListConversationsGet(): CancelablePromise<Array<ConversationMetadata>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/conversations',
        });
    }
    /**
     * Create Metadata
     * Create new conversation metadata.
     * @param requestBody
     * @returns ConversationMetadata Successful Response
     * @throws ApiError
     */
    public static createMetadataConversationsPost(
        requestBody: MetadataCreate,
    ): CancelablePromise<ConversationMetadata> {
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
     * Get Metadata
     * Get conversation metadata.
     * @param convId
     * @returns ConversationMetadata Successful Response
     * @throws ApiError
     */
    public static getMetadataConversationsConvIdMetadataGet(
        convId: string,
    ): CancelablePromise<ConversationMetadata> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/conversations/{conv_id}/metadata',
            path: {
                'conv_id': convId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Metadata
     * Update conversation metadata.
     * @param convId
     * @param requestBody
     * @returns ConversationMetadata Successful Response
     * @throws ApiError
     */
    public static updateMetadataConversationsConvIdMetadataPut(
        convId: string,
        requestBody: MetadataUpdate,
    ): CancelablePromise<ConversationMetadata> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/conversations/{conv_id}/metadata',
            path: {
                'conv_id': convId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Messages
     * Get all messages for a conversation.
     * @param convId
     * @returns Message Successful Response
     * @throws ApiError
     */
    public static getMessagesConversationsConvIdMessagesGet(
        convId: string,
    ): CancelablePromise<Array<Message>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/conversations/{conv_id}/messages',
            path: {
                'conv_id': convId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add Message
     * Add a message and get Claude's streaming response.
     * @param convId
     * @param formData
     * @returns any Successful Response
     * @throws ApiError
     */
    public static addMessageConversationsConvIdMessagesPost(
        convId: string,
        formData: Body_add_message_conversations__conv_id__messages_post,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/conversations/{conv_id}/messages',
            path: {
                'conv_id': convId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Message
     * Update a message.
     * @param convId
     * @param messageId
     * @param requestBody
     * @returns Message Successful Response
     * @throws ApiError
     */
    public static updateMessageConversationsConvIdMessagesMessageIdPut(
        convId: string,
        messageId: string,
        requestBody: Message,
    ): CancelablePromise<Array<Message>> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/conversations/{conv_id}/messages/{message_id}',
            path: {
                'conv_id': convId,
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
     * Delete a message.
     * @param convId
     * @param messageId
     * @returns Message Successful Response
     * @throws ApiError
     */
    public static deleteMessageConversationsConvIdMessagesMessageIdDelete(
        convId: string,
        messageId: string,
    ): CancelablePromise<Array<Message>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/conversations/{conv_id}/messages/{message_id}',
            path: {
                'conv_id': convId,
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
     * @param convId
     * @param messageId
     * @returns Message Successful Response
     * @throws ApiError
     */
    public static toggleMessageCacheConversationsConvIdMessagesMessageIdCachePost(
        convId: string,
        messageId: string,
    ): CancelablePromise<Array<Message>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/conversations/{conv_id}/messages/{message_id}/cache',
            path: {
                'conv_id': convId,
                'message_id': messageId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Markdown
     * Get messages in markdown format.
     * @param convId
     * @returns string Successful Response
     * @throws ApiError
     */
    public static getMarkdownConversationsConvIdMarkdownGet(
        convId: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/conversations/{conv_id}/markdown',
            path: {
                'conv_id': convId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Clone Conversation
     * Clone a conversation.
     * @param convId
     * @returns ConversationMetadata Successful Response
     * @throws ApiError
     */
    public static cloneConversationConversationsConvIdClonePost(
        convId: string,
    ): CancelablePromise<ConversationMetadata> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/conversations/{conv_id}/clone',
            path: {
                'conv_id': convId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add Tag
     * Add a tag to a conversation.
     * @param convId
     * @param tag
     * @returns ConversationMetadata Successful Response
     * @throws ApiError
     */
    public static addTagConversationsConvIdTagsTagPost(
        convId: string,
        tag: string,
    ): CancelablePromise<ConversationMetadata> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/conversations/{conv_id}/tags/{tag}',
            path: {
                'conv_id': convId,
                'tag': tag,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Remove Tag
     * Remove a tag from a conversation.
     * @param convId
     * @param tag
     * @returns ConversationMetadata Successful Response
     * @throws ApiError
     */
    public static removeTagConversationsConvIdTagsTagDelete(
        convId: string,
        tag: string,
    ): CancelablePromise<ConversationMetadata> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/conversations/{conv_id}/tags/{tag}',
            path: {
                'conv_id': convId,
                'tag': tag,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Tags
     * Get a list of all unique tags across all conversations.
     * @returns string Successful Response
     * @throws ApiError
     */
    public static listTagsConversationsTagsGet(): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/conversations/tags',
        });
    }
    /**
     * Get Conversations By Tag
     * Get all conversations with a specific tag.
     * @param tag
     * @returns ConversationMetadata Successful Response
     * @throws ApiError
     */
    public static getConversationsByTagConversationsTagsTagGet(
        tag: string,
    ): CancelablePromise<Array<ConversationMetadata>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/conversations/tags/{tag}',
            path: {
                'tag': tag,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Conversation
     * Delete a conversation and all its contents.
     * @param convId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteConversationConversationsConvIdDelete(
        convId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/conversations/{conv_id}',
            path: {
                'conv_id': convId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
