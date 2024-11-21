import { ContextChatEngine, OpenAI } from "llamaindex";
import {
  API_CHAT_RETRIEVERS,
  createChatEngine,
  fetchReviews,
  systemMessage,
} from "../utils/chatEngine.js";
import { findCarrierShipengineId } from "../utils/shipengineCarrier.js";
import extractDomain from "../utils/urlExtract.js";

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
  const { chatHistory, message } = req.body;

  if (!chatHistory || !message) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  if (!functionChatEngine || !simpleChatEngine) {
    return res.status(500).json({ error: "Chat engine not initialized" });
  }

  let response = await jsonChatEngine.chat({
    message: message,
    chatHistory: [systemMessage, ...chatHistory],
  });

  const carriers = JSON.parse(response.message.content).carriers.map(
    ({ domainName, ...carrier }) => {
      const reviews = fetchReviews(domainName)
        .slice(0, 3)
        .map((review) => ({
          name: review.reviewer_name,
          rating: review.rating,
          review: review.review_content,
          url: review.review_link,
        }));

      const carrier_id = findCarrierShipengineId(domainName);
      const isApiDocsAvailable = API_CHAT_RETRIEVERS.some((retriever) => retriever.carrier === extractDomain(domainName));
      
      return {
        ...carrier,
        reviews,
        isRatesAvailable: !!carrier_id,
        isApiDocsAvailable,
      };
    }
  );

  return res.status(200).json({
    message: { carriers },
  });
};

export const handleCarrierChat = async (req, res) => {
  const { chatHistory, message, carrierName } = req.body;

  if (!chatHistory || !message || !carrierName) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid request body" });
  }

  if (!simpleChatEngine) {
    return res
      .status(500)
      .json({ success: false, error: "Chat engine not initialized" });
  }

  const systemMessage = {
    role: "system",
    content: `You are a knowledgeable shipping assistant for all the shipping queries related to ${carrierName}.  Your primary goal is to provide clear, accurate, and contextually relevant answers to users' queries about shipping. Always ensure your responses are based on the data provided to you with most current shipping regulations and best practices. Strive for 99% accuracy in your responses, providing detailed explanations when necessary to enhance understanding. If a user requests links or additional resources, provide accurate and reliable links to support their inquiry. Pay close attention to terminology to avoid misunderstandings, and prioritize precision in all information provided. Additionally, please provide feedback on the responses you receive to help improve the assistance offered.`,
  };

  let response = await simpleChatEngine.chat({
    message: message,
    chatHistory: [systemMessage, ...chatHistory],
  });

  return res
    .status(200)
    .json({ success: true, message: response.message.content });
};

export const handleCarrierApiDocsChat = async (req, res) => {
  const { chatHistory, message, carrierUrl } = req.body;

  if (!chatHistory || !message || !carrierUrl) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid request body" });
  }
  const uri = extractDomain(carrierUrl);
  const retriever = API_CHAT_RETRIEVERS.find((retriver) => retriver.carrier === uri);
  if (!retriever) {
    return res
      .status(404)
      .json({ success: false, error: `No API documentation found for carrier: ${uri}. Please make sure the carrier URL is correct and try again.` });
  }
  const chatEngine = new ContextChatEngine({
    retriever: retriever.retriever,
    contextRole:"system",
    chatModel: new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4o-mini",
    })
  });

  const systemMessage = {
    role: "system",
    content: `You are an expert shipping chatbot with in-depth knowledge of the API documentation for ${uri}. Your primary goal is to provide clear, accurate, and contextually relevant answers to users' queries about the APIs of ${uri}. You have access to all the API docs in your memory and can answer specific questions related to endpoints, parameters, authentication, responses, error handling, use cases, and integration best practices.

    Always ensure your responses are based on the provided API documentation and current industry standards. Providing detailed explanations and examples where necessary to enhance understanding. When users ask for specific details, provide insights based on the API specs. Additionally, always include the relevant links to the sections of the API documentation or other sources you referenced in your responses to ensure transparency and enable users to explore further.

    For every query, provide the proper endpoint URLs along with their request and response formats, including details of the required and optional parameters, expected response codes, and example payloads for both requests and responses. Ensure the examples are realistic and relevant to the use case to make integration easier for users.

    Do not attempt to modify or reinterpret the API documentation. Provide the information exactly as it is presented in the API documentation to maintain accuracy and consistency. If you do not have access to specific API documentation or cannot verify a detail, do not generate incorrect or speculative information. Instead, apologize and clearly state that you do not have access to that detail.

    Pay close attention to technical terminology to avoid misunderstandings, and maintain a professional tone. Additionally, provide constructive feedback if the query contains inconsistencies, and suggest alternatives or corrections to improve the user's understanding or integration process.`,
  };

  let response = await chatEngine.chat({
    message: message,
    chatHistory: [systemMessage, ...chatHistory],
  });

  return res
    .status(200)
    .json({ success: true, message: response.message.content });
};