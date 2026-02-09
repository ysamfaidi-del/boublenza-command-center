import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

export interface AIProviderConfig {
  id: string;
  name: string;
  provider: string;
  available: boolean;
}

function isConfigured(key: string | undefined): boolean {
  return !!key && key.length > 0;
}

export function getAvailableProviders(): AIProviderConfig[] {
  return [
    {
      id: "claude",
      name: "Claude (Anthropic)",
      provider: "anthropic",
      available: isConfigured(process.env.ANTHROPIC_API_KEY),
    },
    {
      id: "gemini",
      name: "Gemini (Google)",
      provider: "google",
      available: isConfigured(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    },
    {
      id: "glm4",
      name: "GLM-4 (Zhipu AI)",
      provider: "zhipu",
      available: isConfigured(process.env.GLM4_API_KEY),
    },
    {
      id: "kimi",
      name: "Kimi K2 (Moonshot)",
      provider: "moonshot",
      available: isConfigured(process.env.KIMI_API_KEY),
    },
    {
      id: "minimax",
      name: "MiniMax",
      provider: "minimax",
      available: isConfigured(process.env.MINIMAX_API_KEY),
    },
  ];
}

export function getLanguageModel(providerId: string) {
  switch (providerId) {
    case "claude": {
      const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      return anthropic("claude-sonnet-4-5-20250929");
    }
    case "gemini": {
      const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
      return google("gemini-2.0-flash");
    }
    case "glm4": {
      const zhipu = createOpenAI({
        apiKey: process.env.GLM4_API_KEY,
        baseURL: "https://open.bigmodel.cn/api/paas/v4",
      });
      return zhipu("glm-4-flash");
    }
    case "kimi": {
      const moonshot = createOpenAI({
        apiKey: process.env.KIMI_API_KEY,
        baseURL: "https://api.moonshot.cn/v1",
      });
      return moonshot("kimi-k2");
    }
    case "minimax": {
      const minimax = createOpenAI({
        apiKey: process.env.MINIMAX_API_KEY,
        baseURL: "https://api.minimax.chat/v1",
      });
      return minimax("MiniMax-Text-01");
    }
    default:
      throw new Error(`Provider inconnu : ${providerId}`);
  }
}
