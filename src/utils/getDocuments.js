import fs from "fs";
import path from "path";
import { Document } from "llamaindex";

const getDocuments = () => {
  const data = JSON.parse(
    fs.readFileSync(
      path.join(import.meta.dirname, "../", "/data/extended_scraped_data.json"),
      "utf-8"
    )
  );

  const reviewsData = JSON.parse(
    fs.readFileSync(
      path.join(import.meta.dirname, "../", "/data/scraped_reviews_data.json"),
      "utf-8"
    )
  );

  const documents = [];
  // Using only first 3 records for analysis to reduce the time taken for processing
  // You can remove the slice method to use all the records for analysis once you are ready to deploy
  // slice(0, 3)
  data.forEach((doc) => {
    documents.push(
      new Document({
        text: doc.text,
        metadata: {
          url: doc.url,
        },
      })
    );
  });

  reviewsData.forEach((doc) => {
    documents.push(
      new Document({
        text: doc.text,
        metadata: {
          // url: doc.url,
        },
      })
    );
  });

  return documents;
};

export default getDocuments;
