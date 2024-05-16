'use server';

import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
} from "@langchain/core/prompts";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import { createStreamableValue } from 'ai/rsc';

export async function runAgent(input: string) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    const tools = [new TavilySearchResults({ maxResults: 1 })];

    const prompt = await pull<ChatPromptTemplate>("hwchase17/openai-tools-agent");

    const llm = new ChatOpenAI({
      model: "gpt-4o-2024-05-13",
      temperature: 0,
    });

    const agent = await createOpenAIToolsAgent({
      llm,
      tools,
      prompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
    });
    
    const streamingEvents = agentExecutor.streamEvents({
      input,
    }, {
      version: "v1",
    });

    for await (const item of streamingEvents) {
      stream.update(JSON.parse(JSON.stringify(item, null, 2)));
    }

    stream.done();
  })();

  return { streamData: stream.value };
}