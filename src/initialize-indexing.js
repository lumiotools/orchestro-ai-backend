import { getDocuments, getAPIDocuments } from "./utils/getDocuments.js";
import { createIndex, createAPIDocIndex } from "./utils/createIndex.js";

const documents = getDocuments();

(async () => {
  console.log("Initializing chat engine...");
  await createIndex(documents);
  console.log("Chat engine initialized");
})();

(async () => {
  console.log("Initializing api docs indexing...");
  const carrier_documents = getAPIDocuments();

  for (const carrier of carrier_documents) {
    console.log(
      `Progress ${carrier_documents.indexOf(carrier)}/${
        carrier_documents.length
      }`
    );
    console.log(
      `Indexing api docs for ${carrier.url}, ${carrier.api_docs.length} documents`
    );
    await createAPIDocIndex(carrier.api_docs, carrier.url);
  }

  console.log("Api docs indexing initialized");
})();
