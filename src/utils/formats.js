export const functions = [
  {
    name: "fetchReviews",
    description: "Fetch a list of reviews for multiple carriers.",
    parameters: {
      type: "object",
      properties: {
        carrier_urls: {
          type: "array",
          items: {
            type: "string",
            description:
              "domain name of the carrier (without http://), e.g., www.fedex.com, www.ups.com",
          },
        },
      },
      required: ["carrier_urls"],
    },
  },
];

export const response_format = {
  type: "json_schema",
  json_schema: {
    name: "ship-search-schema",
    strict: true,
    schema: {
      type: "object",
      properties: {
        carriers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
              },
              about: {
                type: "string",
              },
              achievements: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              services: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              headquarter: {
                type: "string",
              },
              type: {
                type: "string",
              },
              url: {
                type: "string",
              },
              domainName: {
                type: "string",
              },
            },
            required: [
              "name",
              "about",
              "achievements",
              "services",
              "headquarter",
              "type",
              "url",
              "domainName",
            ],
            additionalProperties: false,
          },
        },
      },
      required: ["carriers"],
      additionalProperties: false,
    },
  },
};
