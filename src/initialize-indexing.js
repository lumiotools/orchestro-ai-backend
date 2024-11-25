import { getDocuments, getAPIDocuments, getRateNegotiationDocuments } from "./utils/getDocuments.js";
import { createIndex, createAPIDocIndex, createRateNegotiationIndex } from "./utils/createIndex.js";

// (async () => {
//   console.log("Initializing chat engine...");
//   await createIndex(getDocuments());
//   console.log("Chat engine initialized");
// })();

// (async () => {
//   console.log("Initializing api docs indexing...");
//   const carrier_documents = getAPIDocuments();

//   for (const carrier of carrier_documents) {
//     console.log(
//       `Progress ${carrier_documents.indexOf(carrier)}/${
//         carrier_documents.length
//       }`
//     );
//     console.log(
//       `Indexing api docs for ${carrier.url}, ${carrier.api_docs.length} documents`
//     );
//     await createAPIDocIndex(carrier.api_docs, carrier.url);
//   }

//   console.log("Api docs indexing initialized");
// })();

(async () => {
  console.log("Initializing rates negotiation indexing...");
  const carrier_documents = getRateNegotiationDocuments().slice(100);

  for (const carrier of carrier_documents) {
    console.log(
      `\nProgress ${carrier_documents.indexOf(carrier)}/${
        carrier_documents.length
      }`
    );
    console.log(
      `\nIndexing rates negotiation for ${carrier.url}, ${carrier.articles.length} documents\n`
    );
    
    await createRateNegotiationIndex(carrier.articles, carrier.url);
  }

  console.log("Rates negotiation indexing initialized");
})();
