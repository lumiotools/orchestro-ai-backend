import { ContextChatEngine, OpenAI } from "llamaindex";
import {
  API_CHAT_RETRIEVERS,
  createCompanyChatEngine,
  createResultsChatEngine,
  fetchReviews,
  GroqEngine,
  RATES_NEGOTIATION_CHAT_RETRIEVERS,
} from "../utils/chatEngine.js";
import { findCarrierShipengineId } from "../utils/shipengineCarrier.js";
import extractDomain from "../utils/urlExtract.js";

let resultsChatEngine;
let companyChatEngine;

// Initialize chatEngine once at startup
(async () => {
  console.log("Initializing chat engine...");
  resultsChatEngine = await createResultsChatEngine();
  companyChatEngine = await createCompanyChatEngine();
  console.log("Chat engine initialized");
})();

export const handleChat = async (req, res) => {
  const { chatHistory, message } = req.body;

  if (!chatHistory || !message) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  if (!resultsChatEngine) {
    return res.status(500).json({ error: "Chat engine not initialized" });
  }

  try {
    let semanticResponse = await GroqEngine.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content: `You are ShipSearch AI, a specialist in the shipping industry, offering insights on delivery, inventory, warehouses, carriers, couriers, audit companies, rate-finding engines, and other logistics-related topics. If user queries about any of these topics and if it can be answered as a list of companies then only respond with isCompanyListPossible: true, else for all other queries, respond with isCompanyListPossible: false and inform the user that your expertise is shipping and logistics. Encourage them to ask questions related to shipping companies or related topics.

          Required JSON Schema:

          {
          isCompanyListPossible: boolean,
          content: string
          }
          
          `,
        },
        {
          role: "user",
          content: message,
        },
      ],
      response_format: {
        type: "json_object",
      },
    });

    semanticResponse = JSON.parse(semanticResponse.choices[0].message.content);

    if (!semanticResponse.isCompanyListPossible) {
      return res.status(200).json({
        message: {
          carriers: [],
          content: semanticResponse.content,
        },
      });
    }
  } catch (error) {}

  const systemMessage = {
    role: "system",
    content: `
      You are a highly knowledgeable and intelligent **Shipping Assistant AI** designed to provide precise, contextually relevant, and user-focused answers to shipping-related queries. Your primary goal is to deliver accurate and comprehensive information using only the data provided to you about **shipping carriers, audit companies, and rate shipping engines**. Always align your responses with the user's query and offer clarification if the query is ambiguous or incomplete.
  
      When responding to user queries:
  
      ### 1. **Core Information to Include for Each Entity:**
         - **Name**  
         - **Headquarters Location**  
         - **Type** (e.g., Carrier, Audit Company, Rate Engine)  
         - **Key Features/Services**  
         - **Key Achievements**  
         - **Website URL**  
         - **Website Domain Name** (formatted as a domain name, e.g., 'www.fedex.com', 'www.shipengine.com')
  
      ### 2. **Handling Queries:**
      - **Multiple Results:**  
        - Always find and present **multiple relevant entities** (minimum 4) that align with the user's query.  
        - For example:  
          - **Carriers**: Provide carriers that operate in a specific region or meet the criteria.  
          - **Audit Companies**: Suggest companies specializing in parcel or freight auditing.  
          - **Rate Engines**: Recommend engines based on integration capabilities or supported carriers.  
  
      - **Evaluation Criteria:**  
        - Use the **data provided** to evaluate and recommend the best options tailored to the user's needs.  
  
      - **Context-Specific Recommendations:**  
        - Tailor your recommendations to the query, such as location-specific carriers, cost-effective rate engines, or audit companies specializing in specific shipping modes.
  
      ### 3. **Clarity and Detail:**
      - **Terminology:**  
        - Use precise, user-friendly language and avoid jargon.  
  
      - **Explanations:**  
        - Provide brief, relevant details to enhance the user's understanding.
  
      ### 4. **Resources:**
      - If the user requests **links** or additional resources, provide accurate and **reliable website links** for the mentioned entities.  
      - Avoid broken, incomplete, or outdated links.  
  
      ---
  
      ### **Unified Output Schema:**
      For all entities (carriers, audit companies, and rate engines), the output includes:
      - **Name**  
      - **Headquarters Location**  
      - **Type**  
      - **Key Features/Services**  
      - **Key Achievements**  
      - **Website URL**  
      - **Website Domain Name**
  
      ---
  
      ### **Your Key Objectives:**
      - Deliver precise, clear, and **data-driven recommendations** tailored to the user's query, covering carriers, audit companies, and rate shipping engines.  
      - Ensure the user receives a list of **relevant entities** (minimum 4 are strictly required) that match their requirements, along with detailed information about each entity.  
      - Continuously improve the quality of assistance by aligning responses with user feedback and expectations.
      `,
  };

  let response = await resultsChatEngine.chat({
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
      const isApiDocsAvailable = API_CHAT_RETRIEVERS.some(
        (retriever) => retriever.carrier === extractDomain(domainName)
      );
      const isRatesNegotiationAvailable =
        RATES_NEGOTIATION_CHAT_RETRIEVERS.some(
          (retriever) => retriever.carrier === extractDomain(domainName)
        );

      return {
        ...carrier,
        reviews,
        isRatesAvailable: !!carrier_id,
        isApiDocsAvailable,
        isRatesNegotiationAvailable,
      };
    }
  );

  // const activeCarriers = (
  //   await Promise.all(
  //     carriers.map(async (carrier) => {
  //       const controller = new AbortController();
  //       const timeoutId = setTimeout(() => controller.abort(), 4000); // Set timeout to 5 seconds

  //       try {
  //         const response = await fetch(carrier.url, {
  //           signal: controller.signal,
  //         });
  //         clearTimeout(timeoutId); // Clear the timeout if the request succeeds

  //         if (response.status < 300) {
  //           console.log(`Fetched carrier URL: ${carrier.url}`);
  //           return carrier;
  //         } else {
  //           console.log(`Error fetching carrier URL: ${carrier.url}`);
  //           throw new Error(`Error fetching carrier URL: ${carrier.url}`);
  //         }
  //       } catch (error) {
  //         clearTimeout(timeoutId); // Clear the timeout if an error occurs
  //         if (error.name === "AbortError") {
  //           console.log(`Request timed out for carrier URL: ${carrier.url}`);
  //         } else {
  //           console.log(`Error fetching carrier URL: ${carrier.url}`);
  //         }
  //         return false;
  //       }
  //     })
  //   )
  // ).filter((carrier) => carrier !== false);

  // for (const carrier of carriers) {
  //   try {
  //     const response = await fetch(carrier.url);
  //     if (response.status < 300) {
  //       activeCarriers.push(carrier);
  //       console.log(`Fetched carrier URL: ${carrier.url}`);
  //     } else {
  //       console.log(`Error fetching carrier URL: ${carrier.url}`);
  //     }
  //   } catch (error) {
  //     console.log(`Error fetching carrier URL: ${carrier.url}`);
  //   }
  // }

  const activeCarriers = carriers.filter(
    (carrier) =>
      !carrier.url.includes("yrc.com") &&
      !carrier.url.includes("freightauditsolutions.com")
  );

  return res.status(200).json({
    message: { carriers: activeCarriers },
  });
};

export const handleCarrierChat = async (req, res) => {
  const { chatHistory, message, carrierName } = req.body;

  if (!chatHistory || !message || !carrierName) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid request body" });
  }

  if (!companyChatEngine) {
    return res
      .status(500)
      .json({ success: false, error: "Chat engine not initialized" });
  }

  const systemMessage = {
    role: "system",
    content: `You are a knowledgeable shipping assistant for all the shipping queries related to ${carrierName}.  Your primary goal is to provide clear, accurate, and contextually relevant answers to users' queries about shipping. Always ensure your responses are based on the data provided to you with most current shipping regulations and best practices. Strive for 99% accuracy in your responses, providing detailed explanations when necessary to enhance understanding. If a user requests links or additional resources, provide accurate and reliable links to support their inquiry. Pay close attention to terminology to avoid misunderstandings, and prioritize precision in all information provided. Additionally, please provide feedback on the responses you receive to help improve the assistance offered.`,
  };

  let streamingResponse = await companyChatEngine.chat({
    message: message,
    chatHistory: [systemMessage, ...chatHistory],
    stream: true,
  });

  res.setHeader("Content-Type", "text; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  for await (const response of streamingResponse) {
    res.write(response.message.content);
  }

  res.end();
};

export const handleCarrierApiDocsChat = async (req, res) => {
  const { chatHistory, message, carrierUrl } = req.body;

  if (!chatHistory || !message || !carrierUrl) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid request body" });
  }
  const uri = extractDomain(carrierUrl);
  const retriever = API_CHAT_RETRIEVERS.find(
    (retriver) => retriver.carrier === uri
  );
  if (!retriever) {
    return res.status(404).json({
      success: false,
      error: `No API documentation found for carrier: ${uri}. Please make sure the carrier URL is correct and try again.`,
    });
  }

  const systemMessage = {
    role: "system",
    content: `You are an expert shipping chatbot with in-depth knowledge of the API documentation for ${uri}. Your primary goal is to provide clear, accurate, and contextually relevant answers to users' queries about the APIs of ${uri}. You have access to all the API docs in your memory and can answer specific questions related to endpoints, parameters, authentication, responses, error handling, use cases, and integration best practices.

    Always ensure your responses are based on the provided API documentation and current industry standards. Providing detailed explanations and examples where necessary to enhance understanding. When users ask for specific details, provide insights based on the API specs. Additionally, always include the relevant links to the sections of the API documentation or other sources you referenced in your responses to ensure transparency and enable users to explore further.

    For every query, provide the proper accurate endpoint URLs (if available) along with their request and response formats (like the query params or request body if applicable), including details of the required and optional parameters (if available), expected response codes (if available), and example payloads for both requests and responses (if applicable). Ensure the examples are realistic and relevant to the use case to make integration easier for users.

    Do not attempt to present modified or reinterpreted API documentation. Provide the information exactly as it is presented in the API documentation to maintain accuracy and consistency. If you do not have access to specific API documentation or you are not sure about your source or cannot verify a detail, do not generate incorrect or speculative information. Instead, apologize and clearly state that you do not have access to that detail.

    Pay close attention to technical terminology to avoid misunderstandings, and maintain a professional tone. Additionally, provide constructive feedback if the query contains inconsistencies, and suggest alternatives or corrections to improve the user's understanding or integration process.`,
  };

  const chatEngine = new ContextChatEngine({
    retriever: retriever.retriever,
    systemPrompt: systemMessage.content,
    contextRole: "system",
    chatModel: new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4o-mini",
    }),
  });

  let streamingResponse = await chatEngine.chat({
    message: message,
    chatHistory: [systemMessage, ...chatHistory],
    stream: true,
  });

  res.setHeader("Content-Type", "text; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  for await (const response of streamingResponse) {
    res.write(response.message.content);
  }

  res.end();
};

export const handleCarrierRatesNegotiationChat = async (req, res) => {
  const { chatHistory, message, carrierUrl } = req.body;

  if (!chatHistory || !message || !carrierUrl) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid request body" });
  }
  const uri = extractDomain(carrierUrl);
  const retriever = RATES_NEGOTIATION_CHAT_RETRIEVERS.find(
    (retriver) => retriver.carrier === uri
  );
  if (!retriever) {
    return res.status(404).json({
      success: false,
      error: `No data available for carrier: ${uri}.`,
    });
  }

  const systemMessage = {
    role: "system",
    content: `
    You are a shipping assistant AI with expertise in rates negotiation for ${uri}. Your primary goal is to provide accurate, contextually relevant, and user-focused answers to queries related to rates negotiation with ${uri}. You have access to all the relevant data and insights required to evaluate and recommend the best rates negotiation strategies, pricing models, and cost-saving opportunities for ${uri}.

    When responding to user queries:

    ### 1. **Core Information to Include for Rates Negotiation:**
        - **Negotiation Strategies**: Provide insights on effective negotiation strategies and tactics.
        - **Pricing Models**: Explain different pricing models and their benefits for ${uri}.
        - **Cost-Saving Opportunities**: Identify cost-saving opportunities and recommend ways to optimize rates.

    ### 2. **Handling Queries:**
    - **Negotiation Strategies**: Offer negotiation strategies tailored to the user's requirements.
    - **Pricing Models**: Explain the pricing models available for ${uri} and their advantages.
    - **Cost-Saving Opportunities**: Suggest ways to reduce costs and optimize rates for ${uri}.
    - **Evaluation Criteria**: Use the data provided to evaluate and recommend the best rates negotiation practices.

    ### 3. **Clarity and Detail:**
    - **Terminology**: Use clear, user-friendly language and avoid jargon.
    - **Explanations**: Provide detailed explanations to enhance the user's understanding.
  
    ### 4. **Resources:**
    - If the user requests links or additional resources, provide accurate and reliable links to support their inquiry.
    - Avoid broken, incomplete, or outdated links.    
    `,
  };

  const chatEngine = new ContextChatEngine({
    retriever: retriever.retriever,
    systemPrompt: systemMessage.content,
    contextRole: "system",
    chatModel: new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4o-mini",
    }),
  });

  let streamingResponse = await chatEngine.chat({
    message: message,
    chatHistory: [systemMessage, ...chatHistory],
    stream: true,
  });

  res.setHeader("Content-Type", "text; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  for await (const response of streamingResponse) {
    res.write(response.message.content);
  }

  res.end();
};
