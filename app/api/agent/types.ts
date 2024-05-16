type LangChainImageDetail = 'auto' | 'low' | 'high';
type LangChainMessageContentText = {
    type: 'text';
    text: string;
};
type LangChainMessageContentImageUrl = {
    type: 'image_url';
    image_url: string | {
        url: string;
        detail?: LangChainImageDetail;
    };
};
type LangChainMessageContentComplex = LangChainMessageContentText | LangChainMessageContentImageUrl | (Record<string, any> & {
    type?: 'text' | 'image_url' | string;
}) | (Record<string, any> & {
    type?: never;
});
type LangChainMessageContent = string | LangChainMessageContentComplex[];
export type LangChainAIMessageChunk = {
    content: LangChainMessageContent;
};