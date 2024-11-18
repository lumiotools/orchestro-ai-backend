import fs from "fs";
import path from "path";

const carrierIds = JSON.parse(
  fs.readFileSync(
    path.join(import.meta.dirname, "../", "/data/carrier_id_data.json"),
    "utf-8"
  )
);

export const findCarrierShipengineId = (carrier_url) => {
  const shipengineCarrierIds = carrierIds.find(
    (carrier) =>
      carrier.url ===
        carrier_url.replace("https://", "").replace("http://", "") ||
        carrier.url.replace("www.", "") ===
        carrier_url
          .replace("https://", "")
          .replace("http://", "")
          .replace("www.", "") ||
      carrier.url ===
        carrier_url
          .replace("https://", "")
          .replace("http://", "")
          .replace("www.", "")
  );

  return shipengineCarrierIds?.carrier_id;
};
