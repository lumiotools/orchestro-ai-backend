import {
  createChatEngine,
  fetchReviews,
  systemMessage,
} from "../utils/chatEngine.js";

let functionChatEngine; // Adjust the type as per the actual type returned by createChatEngine
let jsonChatEngine; // Adjust the type as per the actual type returned by createChatEngine
let simpleChatEngine; // Adjust the type as per the actual type returned by createChatEngine

// Initialize chatEngine once at startup
(async () => {
  console.log("Initializing chat engine...");
  functionChatEngine = await createChatEngine({ function_call: true });
  jsonChatEngine = await createChatEngine({ output_response_format: true });
  simpleChatEngine = await createChatEngine({});
  console.log("Chat engine initialized");
})();

export const handleChat = async (req, res) => {
  const { chatHistory, message, json = false } = req.body;

  if (!chatHistory || !message) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  if (!functionChatEngine || !simpleChatEngine) {
    return res.status(500).json({ error: "Chat engine not initialized" });
  }

  let response = await functionChatEngine.chat({
    message: message,
    chatHistory: [systemMessage, ...chatHistory],
  });

  if (response.raw.choices[0].message?.function_call) {
    const carrierUrls = JSON.parse(
      response.raw.choices[0].message.function_call.arguments
    ).carrier_urls;

    const functionCallResponse = [];

    carrierUrls.forEach((carrierUrl) => {
      functionCallResponse.push({
        [carrierUrl]: fetchReviews(carrierUrl),
      });
    });

    chatHistory.push({
      role: "assistant",
      content: JSON.stringify({
        function_call: response.raw.choices[0].message.function_call,
      }),
    });

    chatHistory.push({
      role: "tool",
      content: JSON.stringify(functionCallResponse),
    });

    response = await (json ? jsonChatEngine : simpleChatEngine).chat({
      message: message,
      chatHistory: [systemMessage, ...chatHistory],
    });
  }

  const sources = [];

  response.sourceNodes.forEach(({ node, score }) => {
    const existingSource = sources.find(
      (source) => source.url === node.metadata.url
    );

    if (existingSource) {
      // If URL already exists, update score if the current score is higher
      if (existingSource.score < score) {
        existingSource.score = score;
      }
    } else {
      // If URL does not exist, add it to the sources array
      if (node.metadata.url)
        sources.push({
          url: node.metadata.url,
          score: score,
        });
    }
  });

  // Sort sources by score in descending order
  sources.sort((a, b) => b.score - a.score);

  return res.status(200).json({
    message: json
      ? JSON.parse(response.message.content)
      : response.message.content,
    sources,
  });
};
