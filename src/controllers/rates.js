import ShipEngine from "shipengine";
import { findCarrierShipengineId } from "../utils/shipengineCarrier.js";

export const handleRatesEstimation = async (req, res) => {
  try {
    const { from_address, to_address, packages, carrierUrl } = req.body;

    if (!from_address || !to_address || !packages || !carrierUrl) {
      return res.status(400).json({ error: "Please fill all the fields" });
    }

    const carrier_id = findCarrierShipengineId(carrierUrl);

    if (!carrier_id) {
      return res.status(400).json({ error: "Carrier not supported" });
    }

    const shipengine = new ShipEngine(process.env.SHIPENGINE_API_KEY);

    const response = await shipengine.getRatesWithShipmentDetails({
      rateOptions: {
        carrierIds: [carrier_id],
      },
      shipment: {
        validateAddress: "no_validation",
        shipFrom: from_address,
        shipTo: to_address,
        packages: packages,
        // shipTo: {
        //   name: "Amanda Miller",
        //   phone: "555-555-5555",
        //   addressLine1: "525 S Winchester Blvd",
        //   cityLocality: "San Jose",
        //   stateProvince: "CA",
        //   postalCode: "95128",
        //   countryCode: "US",
        //   addressResidentialIndicator: "yes",
        // },
        // shipFrom: {
        //   companyName: "Example Corp.",
        //   name: "John Doe",
        //   phone: "111-111-1111",
        //   addressLine1: "4009 Marathon Blvd",
        //   addressLine2: "Suite 300",
        //   cityLocality: "Austin",
        //   stateProvince: "TX",
        //   postalCode: "78756",
        //   countryCode: "US",
        //   addressResidentialIndicator: "no",
        // },
        // packages: [
        //   {
        //     weight: {
        //       value: 1.0,
        //       unit: "ounce",
        //     },
        //     dimensions: {
        //       length: 7,
        //       width: 5,
        //       height: 6,
        //       unit: "inch",
        //     },
        //   },
        // ],
      },
    });

    if (response.rateResponse.invalidRates?.length > 0) {
      console.log(response.rateResponse.invalidRates);
      return res.status(400).json({ error: "No rates found" });
    }

    if (response.rateResponse.rates.length === 0) {
      return res.status(400).json({ error: "No rates found" });
    }

    const rates = response.rateResponse.rates.map((rate) => ({
      serviceType: rate.serviceType,
      serviceCode: rate.serviceCode,
      estimatedDeliveryDate: rate.estimatedDeliveryDate,
      shipDate: rate.shipDate,
      amounts: {
        currency: rate.shippingAmount.currency,
        shipping: rate.shippingAmount.amount,
        insurance: rate.insuranceAmount.amount,
        confirmation: rate.confirmationAmount.amount,
        other: rate.otherAmount.amount,
      },
    }));

    return res.status(200).json({ rates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
