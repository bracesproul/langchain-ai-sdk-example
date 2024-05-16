import { z } from "zod";
import { NextRequest } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { LangChainAdapter, Message, StreamingTextResponse } from "ai";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { v4 as uuivv4 } from "uuid";
import { IterableReadableStream } from "@langchain/core/utils/stream";

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

function mapObjectToVercel<T>(toolOutput: T): Message {
  return {
    id: uuivv4(),
    content: "",
    role: "tool",
    tool_calls: [
      {
        id: uuivv4(),
        type: "function",
        function: {
          name: "profanity",
          arguments: JSON.stringify(toolOutput, null, 2),
        },
      },
    ],
  };
}

function asyncGeneratorToReadableStream<T>(
  generator: IterableReadableStream<T>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const item of generator) {
          const stringifiedMsg = JSON.stringify(mapObjectToVercel(item));
          controller.enqueue(encoder.encode(stringifiedMsg));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

const schema = z.object({
  contains_profanity: z
    .boolean()
    .describe("Whether the message contains profanity"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages }: { messages: Message[] } = body;
    // Custom utility function to map Vercel AI messages to LangChain messages
    const lcMessages = mapVercelAiMessageToLcMessage(messages);

    // Define the prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are a helpful assistant. Given the question, use the 'profanity' tool to determine if the message contains profanity.",
      ],
      // This is for chat history, not necessarily required.
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
    ]);
    const model = new ChatOpenAI({
      model: "gpt-4-turbo",
      temperature: 0,
    }).withStructuredOutput(schema, {
      name: "profanity",
    });
    // Use LCEL to create a Runnable chain, piping the prompt -> model
    const chain = prompt.pipe(model);

    // Call .stream() and pass any required inputs
    const stream = await chain.stream({
      chat_history: lcMessages.slice(0, -1),
      input: lcMessages.slice(-1)[0].content,
    });

    // Send the stream back using the StreamingTextResponse class, and LangChainAdapter
    // which converts the stream to a format which the AI SDK can understand.
    return new StreamingTextResponse(
      asyncGeneratorToReadableStream<z.infer<typeof schema>>(stream),
    );
  } catch (e) {
    console.error("Error", e);
  }
}
