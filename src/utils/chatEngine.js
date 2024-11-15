import {
  ContextChatEngine,
  OpenAI,
  VectorStoreIndex,
  storageContextFromDefaults,
} from "llamaindex";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { functions, response_format } from "./formats.js";

dotenv.config();

const storageContext = await storageContextFromDefaults({
  persistDir: "./src/llama-storage",
});

const index = await VectorStoreIndex.init({
  logProgress: true,
  storageContext: storageContext,
});

const retriever = index.asRetriever();

export const createChatEngine = async ({
  function_call = false,
  output_response_format = false,
}) => {
  const chatEngine = new ContextChatEngine({
    retriever,
    chatModel: new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4o-mini",
      temperature: 0.5,
      additionalChatOptions: {
        ...(function_call
          ? {
              functions: functions,
              function_call: {
                name: "fetchReviews",
              },
            }
          : {}),

        ...(output_response_format
          ? {
              response_format: response_format,
            }
          : {}),
      },
    }),
  });

  return chatEngine;
};

export const systemMessage = {
  role: "system",
  content:
    "You are a knowledgeable shipping assistant. Your primary goal is to provide clear, accurate, and contextually relevant answers to users' queries about shipping. Always seek clarification if a user's request is ambiguous, and ensure your responses are based on the most current shipping regulations and best practices. Include the Carrier Name, Its Headquater, Its Type (e.g, Domestic, International, ...), Achievements, Services, Its correct website url and its domain name (the domain name should be without http:// in this format like www.fedex.com or www.dhl.com). Try to provide multiple carriers that align with the users query. Strive for 99% accuracy in your responses, providing detailed explanations when necessary to enhance understanding. If a user requests links or additional resources, provide accurate and reliable links to support their inquiry. Pay close attention to terminology to avoid misunderstandings, and prioritize precision in all information provided. Additionally, please provide feedback on the responses you receive to help improve the assistance offered.",
};

// export const systemMessage = {
//   role: "system",
//   content:
//     "You are a knowledgeable shipping assistant. Your primary goal is to provide clear, accurate, and contextually relevant answers to users' queries about shipping. Always seek clarification if a user's request is ambiguous, and ensure your responses are based on the most current shipping regulations and best practices, also while recommending the shipping carriers or shipping companies do make a request with all the required carrier urls (request for as much carriers reviews required) and respond with their specializations, ratings (eg, ★★★★★, ★★★), reviews containing the name of reviewer and the full review content as responded by the function call (display and show that user review which best suits the current context and do strictly include the review links in the response), also include why to choose that carrier and stricly the website url of that carrier. Try to include the ratings and reviews in the response wherever necessary. Strive for 99% accuracy in your responses, providing detailed explanations when necessary to enhance understanding. If a user requests links or additional resources, provide accurate and reliable links to support their inquiry. Pay close attention to terminology to avoid misunderstandings, and prioritize precision in all information provided. Additionally, please provide feedback on the responses you receive to help improve the assistance offered.",
// };

const reviewsData = JSON.parse(
  fs.readFileSync(
    path.join(
      import.meta.dirname,
      "../",
      "/data/structured_reviews_scraped_data.json"
    ),
    "utf-8"
  )
);

export function fetchReviews(carrier_url) {
  const carrierReviews = reviewsData.filter(
    (review) =>
      (review.carrier ===
        carrier_url.replace("https://", "").replace("http://", "") ||
        review.carrier ===
          carrier_url
            .replace("https://", "")
            .replace("http://", "")
            .replace("www.", "")) &&
      review.rating >= 3
  );

  // Sort reviews by rating (assuming higher rating means more positive)
  return carrierReviews.sort((a, b) => {
    // Convert ratings to numbers if they're strings
    const ratingA =
      typeof a.rating === "string" ? parseFloat(a.rating) : a.rating;
    const ratingB =
      typeof b.rating === "string" ? parseFloat(b.rating) : b.rating;
    // Sort in descending order (highest ratings first)
    return ratingB - ratingA;
  });
}
