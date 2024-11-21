import {
  ContextChatEngine,
  OpenAI,
  VectorStoreIndex,
  storageContextFromDefaults,
} from "llamaindex";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { results_response_format } from "./formats.js";

dotenv.config();

export const API_CHAT_RETRIEVERS = [];

const BASE_DIR = "./src/llama-storage-api-docs";

// Function to create retrievers for all carriers

// Usage
(async () => {
  // Read all folders in the base directory
  const carrierFolders = fs.readdirSync(BASE_DIR, { withFileTypes: true });

  for (const folder of carrierFolders) {
    // Only process directories
    if (folder.isDirectory()) {
      const carrierPath = path.join(BASE_DIR, folder.name);

      // Create storage context for the carrier
      const storageContext = await storageContextFromDefaults({
        persistDir: carrierPath,
      });

      // Initialize vector store index
      const index = await VectorStoreIndex.init({
        logProgress: true,
        storageContext: storageContext,
      });

      // Create retriever and map it to the carrier URL

      API_CHAT_RETRIEVERS.push({
        carrier: folder.name,
        retriever: index.asRetriever(),
      });
    }
  }

  console.log("API Docs Chats Initialized");
})();

const storageContext = await storageContextFromDefaults({
  persistDir: "./src/llama-storage-new",
});

const index = await VectorStoreIndex.init({
  logProgress: true,
  storageContext: storageContext,
});

const retriever = index.asRetriever({ similarityTopK: 5 });

export const createResultsChatEngine = async () => {
  const chatEngine = new ContextChatEngine({
    retriever,
    contextRole: "memory",
    systemPrompt:
      "You are a shipping assistant you have knowledge about shipping carriers, audit companies and rate shipping engines. You need to evaluate the users queries based on your memory, and return the minimum 4-5 matches.",
    chatModel: new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4o-mini",
      additionalChatOptions: {
        response_format: results_response_format,
      },
    }),
  });

  return chatEngine;
};

export const createCompanyChatEngine = async () => {
  const chatEngine = new ContextChatEngine({
    retriever,
    contextRole: "system",
    // systemPrompt:
    //   "You are a shipping assistant you have knowledge about shipping carriers, audit companies and rate shipping engines. You need to evaluate the users queries based on your memory, and return the minimum best 4-5 matches.",
    chatModel: new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4o-mini",
    }),
  });

  return chatEngine;
};

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
        review.carrier.replace("www.", "") ===
          carrier_url
            .replace("https://", "")
            .replace("http://", "")
            .replace("www.", "") ||
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
