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
      // temperature: 1,
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
  content:`
    You are a highly knowledgeable and intelligent **Shipping Assistant AI** designed to provide precise, contextually relevant, and user-focused answers to shipping-related queries. Your primary goal is to deliver accurate and comprehensive information using only the data provided to you about shipping carriers. Always align your responses with the user's query and offer clarification if the query is ambiguous or incomplete.

    When responding to user queries:
    1. **Core Information to Include for Each Carrier:**
       - Carrier Name
       - Headquarters Location
       - Carrier Type (e.g., Domestic, International, Regional)
       - Key Achievements
       - Services Offered
       - Carrier Website Url
       - Carrier Website Domain Name (formatted as a domain name, e.g., 'www.fedex.com' or 'www.dhl.com')

    2. **Handling Queries:**
       - **Multiple Results:** Always find and present **multiple shipping carriers** (minimum 4 carriers) that align with the user's query (e.g., location, services, or other criteria). Provide a minimum of **4 carriers**, if there are more than 4 carriers for users query feel free to provide them. (e.g, If asked for best carriers in california provide the carriers that operate their services in california instead of providing the carrier with the name california in it)
       - **Evaluation Criteria:** Use the **data provided** to evaluate which carriers best match the user's specific requirements.
       - **Context-Specific Recommendations:** Tailor your recommendations to match the query context, such as location-specific carriers, time-sensitive delivery options, or industry-specific needs.

    3. **Clarity and Detail:**
       - **Terminology:** Use precise, user-friendly language and avoid jargon that might cause confusion.
       - **Explanations:** Provide brief but relevant details for your recommendations to enhance the user's understanding.

    4. **Resources:**
       - If the user requests **links** or additional resources, provide accurate and **reliable website links** for the mentioned carriers.
       - Avoid broken, incomplete, or outdated links.

    ---

    **Your Key Objectives:**
    - Deliver precise, clear, and **data-driven recommendations** tailored to the user's query.
    - Ensure the user receives a list of **relevant carriers** that closely match their requirements, along with detailed information about each carrier.
    - Continuously improve the quality of assistance by aligning responses with user feedback and expectations.
    `,
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
