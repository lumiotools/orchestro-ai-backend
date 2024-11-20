import { VectorStoreIndex, storageContextFromDefaults } from "llamaindex";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

export const createIndex = async (documents) => {
  const storageContext = await storageContextFromDefaults({
    persistDir: "./src/llama-storage-new",
  });

  const index = await VectorStoreIndex.fromDocuments(documents, {
    logProgress: true,
    storageContext,
  });

  return index;
};

export const createAPIDocIndex = async (documents, carrierUrl) => {
  fs.mkdirSync(`./src/llama-storage-api-docs/${carrierUrl}`, {
    recursive: true,
  });

  const storageContext = await storageContextFromDefaults({
    persistDir: `./src/llama-storage-api-docs/${carrierUrl}`,
  });

  const index = await VectorStoreIndex.fromDocuments(documents, {
    logProgress: true,
    storageContext,
  });

  return index;
};
