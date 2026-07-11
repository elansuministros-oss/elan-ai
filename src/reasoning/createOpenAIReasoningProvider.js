import OpenAI from 'openai';
import { loadOpenAIConfig } from '../config/openAIConfig.js';
import { OpenAIReasoningProvider } from './openAIReasoningProvider.js';

export function createOpenAIReasoningProvider({
  env = process.env,
  clientFactory = (options) => new OpenAI(options)
} = {}) {
  const config = loadOpenAIConfig(env);

  const client = clientFactory({
    apiKey: config.apiKey
  });

  return new OpenAIReasoningProvider({
    client,
    model: config.model
  });
}