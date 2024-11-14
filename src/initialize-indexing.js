import getDocuments from "./utils/getDocuments.js";
import createIndex from "./utils/createIndex.js";

const documents = getDocuments();

(async () => {
  console.log("Initializing chat engine...");
  await createIndex(documents);
  console.log("Chat engine initialized");
})();
