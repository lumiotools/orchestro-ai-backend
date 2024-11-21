import fs from "fs";
import path from "path";
import { Document } from "llamaindex";

export const getDocuments = () => {
  const data = JSON.parse(
    fs.readFileSync(
      path.join(import.meta.dirname, "../", "/data/extended_scraped_data.json"),
      "utf-8"
    )
  );

  const documents = [];
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

  return documents;
};

export const getAuditCompaniesDocuments = () => {
  const data = JSON.parse(
    fs.readFileSync(
      path.join(import.meta.dirname, "../", "/data/audit_companies_data.json"),
      "utf-8"
    )
  );

  const documents = [];
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

  return documents;
};

export const getRateShippingEnginesDocuments = () => {
  const data = JSON.parse(
    fs.readFileSync(
      path.join(import.meta.dirname, "../", "/data/rate_shipping_engines_data.json"),
      "utf-8"
    )
  );

  const documents = [];
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

  return documents;
};

export const getAPIDocuments = () => {
  const apiData = JSON.parse(
    fs.readFileSync(
      path.join(
        import.meta.dirname,
        "../",
        "/data/api_docs_structured_data.json"
      ),
      "utf-8"
    )
  );

  const carriers = [];

  apiData.forEach((carrier) => {
    carriers.push({
      url: carrier.carrier_url,
      api_docs: carrier.api_docs.map(
        (doc) =>
          new Document({
            text: doc.text,
            metadata: {
              url: doc.url,
            },
          })
      ),
    });
  });

  return carriers;
};
