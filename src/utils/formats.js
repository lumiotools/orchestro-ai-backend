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
              specialities: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              url: {
                type: "string",
              },
              reviews: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                    },
                    rating: {
                      type: "number",
                    },
                    review: {
                      type: "string",
                    },
                    url: {
                      type: "string",
                    },
                  },
                  required: ["name", "rating", "review", "url"],
                  additionalProperties: false,
                },
              },
            },
            required: ["name", "about", "specialities", "url", "reviews"],
            additionalProperties: false,
          },
        },
      },
      required: ["carriers"],
      additionalProperties: false,
    },
  },
};
