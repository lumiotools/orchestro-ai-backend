import { VectorStoreIndex, storageContextFromDefaults } from "llamaindex";
import dotenv from "dotenv";

dotenv.config();

const createIndex = async (documents) => {
  const storageContext = await storageContextFromDefaults({
    persistDir: "./src/llama-storage-new",
  });

  const index = await VectorStoreIndex.fromDocuments(documents, {
    logProgress: true,
    storageContext,
  });

  return index;
};

export default createIndex;
