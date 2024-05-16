import { NextRequest } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { LangChainAdapter, Message, StreamData, StreamObjectResult, StreamingTextResponse } from "ai";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import {
  ChatPromptTemplate,
} from "@langchain/core/prompts";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import { StreamEvent } from "@langchain/core/tracers/log_stream";


function asyncGeneratorToReadableStream(generator: AsyncGenerator<Uint8Array>): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const item of generator) {
          controller.enqueue(item);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

const mapVercelAiMessageToLcMessage = (messages: Message[]): BaseMessage[] => {
  return messages.map((message) => {
    if (message.role === "user") {
      return new HumanMessage(message.content);
    } else if (message.role === "system") {
      return new SystemMessage(message.content);
    } else if (message.role === "assistant") {
      return new AIMessage(message.content);
    } else {
      throw new Error(`TODO implement support for role: ${message.role}`);
    }
  });
};

export async function POST(req: NextRequest) {
  try {
    // Define the tools the agent will have access to.
    const tools = [new TavilySearchResults({ maxResults: 1 })];

    const prompt = await pull<ChatPromptTemplate>("hwchase17/openai-tools-agent");

    const llm = new ChatOpenAI({
      model: "gpt-3.5-turbo-1106",
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
    
    const stream = agentExecutor.streamEvents({
      input: "what is LangChain?",
    }, {
      version: "v1",
      encoding: "text/event-stream"
    });


    return new Response(asyncGeneratorToReadableStream(stream), {
      headers: {
        "Content-Type": "text/event-stream",
      },
    });
  } catch (e) {
    console.error("Error", e);
  }
}
