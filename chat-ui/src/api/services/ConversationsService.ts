/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from "../core/CancelablePromise";
import { OpenAPI } from "../core/OpenAPI";
import { request as __request } from "../core/request";
import type { Body_add_message_api_conversations__conv_id__messages_post } from "../models/Body_add_message_api_conversations__conv_id__messages_post";
import type { ConversationMetadata } from "../models/ConversationMetadata";
import type { Message } from "../models/Message";
import type { MessageCreate } from "../models/MessageCreate";
import type { MetadataCreate } from "../models/MetadataCreate";
import type { MetadataUpdate } from "../models/MetadataUpdate";
import type { SystemPrompt } from "../models/SystemPrompt";
export class ConversationsService {
  /**
   * Get Metadata List
   * Get all conversation metadata.
   * @returns ConversationMetadata Successful Response
   * @throws ApiError
   */
  public static getMetadataListApiConversationsGet(): CancelablePromise<
    Array<ConversationMetadata>
  > {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/conversations",
    });
  }
  /**
   * Create Metadata
   * Create new conversation metadata.
   * @param requestBody
   * @returns ConversationMetadata Successful Response
   * @throws ApiError
   */
  public static createMetadataApiConversationsPost(
    requestBody: MetadataCreate
  ): CancelablePromise<ConversationMetadata> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/conversations",
      body: requestBody,
      mediaType: "application/json",
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
  public static getMetadataApiConversationsConvIdMetadataGet(
    convId: string
  ): CancelablePromise<ConversationMetadata> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/conversations/{conv_id}/metadata",
      path: {
        conv_id: convId,
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
  public static updateMetadataApiConversationsConvIdMetadataPut(
    convId: string,
    requestBody: MetadataUpdate
  ): CancelablePromise<ConversationMetadata> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/conversations/{conv_id}/metadata",
      path: {
        conv_id: convId,
      },
      body: requestBody,
      mediaType: "application/json",
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
  public static getMessagesApiConversationsConvIdMessagesGet(
    convId: string
  ): CancelablePromise<Array<Message>> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/conversations/{conv_id}/messages",
      path: {
        conv_id: convId,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Add Message
   * Add a message and get LLM's streaming response.
   * @param convId
   * @param formData
   * @returns any Successful Response
   * @throws ApiError
   */
  public static addMessageApiConversationsConvIdMessagesPost(
    convId: string,
    formData: Body_add_message_api_conversations__conv_id__messages_post
  ): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/conversations/{conv_id}/messages",
      path: {
        conv_id: convId,
      },
      formData: formData,
      mediaType: "multipart/form-data",
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
  public static updateMessageApiConversationsConvIdMessagesMessageIdPut(
    convId: string,
    messageId: string,
    requestBody: Message
  ): CancelablePromise<Array<Message>> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/conversations/{conv_id}/messages/{message_id}",
      path: {
        conv_id: convId,
        message_id: messageId,
      },
      body: requestBody,
      mediaType: "application/json",
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Delete Message
   * Delete a message and its associated images.
   * @param convId
   * @param messageId
   * @returns Message Successful Response
   * @throws ApiError
   */
  public static deleteMessageApiConversationsConvIdMessagesMessageIdDelete(
    convId: string,
    messageId: string
  ): CancelablePromise<Array<Message>> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/conversations/{conv_id}/messages/{message_id}",
      path: {
        conv_id: convId,
        message_id: messageId,
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
  public static toggleMessageCacheApiConversationsConvIdMessagesMessageIdCachePost(
    convId: string,
    messageId: string
  ): CancelablePromise<Array<Message>> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/conversations/{conv_id}/messages/{message_id}/cache",
      path: {
        conv_id: convId,
        message_id: messageId,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Get Transcript
   * Get messages in markdown format with configurable role prefixes.
   *
   * Args:
   * conv_id: Conversation ID
   * assistant_prefix: Custom prefix for assistant messages, None to omit
   * user_prefix: Custom prefix for user messages, None to omit
   * @param convId
   * @param assistantPrefix
   * @param userPrefix
   * @returns string Successful Response
   * @throws ApiError
   */
  public static getTranscriptApiConversationsConvIdTranscriptGet(
    convId: string,
    assistantPrefix?: string | null,
    userPrefix?: string | null
  ): CancelablePromise<string> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/conversations/{conv_id}/transcript",
      path: {
        conv_id: convId,
      },
      query: {
        assistant_prefix: assistantPrefix,
        user_prefix: userPrefix,
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
  public static cloneConversationApiConversationsConvIdClonePost(
    convId: string
  ): CancelablePromise<ConversationMetadata> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/conversations/{conv_id}/clone",
      path: {
        conv_id: convId,
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
  public static addTagApiConversationsConvIdTagsTagPost(
    convId: string,
    tag: string
  ): CancelablePromise<ConversationMetadata> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/conversations/{conv_id}/tags/{tag}",
      path: {
        conv_id: convId,
        tag: tag,
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
  public static removeTagApiConversationsConvIdTagsTagDelete(
    convId: string,
    tag: string
  ): CancelablePromise<ConversationMetadata> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/conversations/{conv_id}/tags/{tag}",
      path: {
        conv_id: convId,
        tag: tag,
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
  public static listTagsApiConversationsTagsGet(): CancelablePromise<
    Array<string>
  > {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/conversations/tags",
    });
  }
  /**
   * Get Conversations By Tag
   * Get all conversations with a specific tag.
   * @param tag
   * @returns ConversationMetadata Successful Response
   * @throws ApiError
   */
  public static getConversationsByTagApiConversationsTagsTagGet(
    tag: string
  ): CancelablePromise<Array<ConversationMetadata>> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/conversations/tags/{tag}",
      path: {
        tag: tag,
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
  public static deleteConversationApiConversationsConvIdDelete(
    convId: string
  ): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/conversations/{conv_id}",
      path: {
        conv_id: convId,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Get Image
   * Get an image by its ID.
   * @param convId
   * @param imageId
   * @returns any Successful Response
   * @throws ApiError
   */
  public static getImageApiConversationsConvIdImagesImageIdGet(
    convId: string,
    imageId: string
  ): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/conversations/{conv_id}/images/{image_id}",
      path: {
        conv_id: convId,
        image_id: imageId,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Create System Prompt From Transcript
   * Create a new system prompt from conversation transcript.
   *
   * Args:
   * conv_id: Source conversation ID
   * name: Name for the new system prompt
   * assistant_prefix: Custom prefix for assistant messages, None to omit
   * user_prefix: Custom prefix for user messages, None to omit
   * @param convId
   * @param name Name for the new system prompt
   * @param assistantPrefix Custom prefix for assistant messages
   * @param userPrefix Custom prefix for user messages
   * @returns SystemPrompt Successful Response
   * @throws ApiError
   */
  public static createSystemPromptFromTranscriptApiConversationsConvIdSystemPromptFromTranscriptPost(
    convId: string,
    name: string,
    assistantPrefix?: string | null,
    userPrefix?: string | null
  ): CancelablePromise<SystemPrompt> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/conversations/{conv_id}/system-prompt-from-transcript",
      path: {
        conv_id: convId,
      },
      query: {
        name: name,
        assistant_prefix: assistantPrefix,
        user_prefix: userPrefix,
      },
      errors: {
        422: `Validation Error`,
      },
    });
  }
  /**
   * Add Cached Message
   * Add a cached user message to a conversation.
   *
   * This endpoint is optimized for large cached messages and does not support:
   * - File uploads
   * - Streaming responses
   * - Anthropic API calls
   *
   * Returns just the message ID as acknowledgment.
   * @param convId
   * @param requestBody
   * @returns string Successful Response
   * @throws ApiError
   */
  public static addCachedMessageApiConversationsConvIdCachedMessagePost(
    convId: string,
    requestBody: MessageCreate
  ): CancelablePromise<string> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/conversations/{conv_id}/cached-message",
      path: {
        conv_id: convId,
      },
      body: requestBody,
      mediaType: "application/json",
      errors: {
        422: `Validation Error`,
      },
    });
  }
}
