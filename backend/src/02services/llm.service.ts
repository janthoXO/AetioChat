import { ChatOllama, type ChatOllamaInput } from "@langchain/ollama";
import { config as envConfig } from "@/config.js";
import { ChatGoogle, type ChatGoogleParams } from "@langchain/google";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * Get an LLM instance based on current configuration.
 * Easily extendable to support cloud providers.
 */
export function getLLM(): BaseChatModel {
  let chat: BaseChatModel;
  switch (envConfig.LLM_PROVIDER) {
    case "ollama": {
      const ollamaConfig: ChatOllamaInput = {
        model: envConfig.LLM_MODEL,
        temperature: 0,
      };

      if (envConfig.LLM_API_KEY) {
        ollamaConfig.headers = {
          Authorization: "Bearer " + envConfig.LLM_API_KEY,
        };
      }

      chat = new ChatOllama(ollamaConfig);
      break;
    }
    case "google": {
      if (!envConfig.LLM_API_KEY) {
        throw new Error("Google API key is not configured");
      }
      const googleConfig: ChatGoogleParams = {
        apiKey: envConfig.LLM_API_KEY,
        model: envConfig.LLM_MODEL,
        temperature: 0,
      };
      chat = new ChatGoogle(googleConfig);
      break;
    }
    default:
      throw new Error(`Unsupported LLM Provider: ${envConfig.LLM_PROVIDER}`);
  }

  return chat;
}
