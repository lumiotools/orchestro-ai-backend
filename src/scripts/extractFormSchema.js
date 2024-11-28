import { OpenAI } from "llamaindex";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import dotenv from "dotenv";
import fs from "fs";
import extractDomain from "../utils/urlExtract.js";

dotenv.config();

puppeteer.use(StealthPlugin());

const openAi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o-mini",
  additionalChatOptions: {
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "contact-form-schema",
        schema: {
          type: "object",
          properties: {
            title: { type: ["string", "null"] },
            description: { type: ["string", "null"] },
            fields: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  fieldSelector: { type: "string" },
                  title: { type: "string" },
                  type: { type: "string" },
                  options: {
                    type: ["array", "null"],
                    items: {
                      type: "object",
                      properties: {
                        value: { type: "string" },
                        label: { type: "string" },
                      },
                      required: ["value", "label"],
                      additionalProperties: false,
                    },
                  },
                  required: { type: "boolean" },
                },
                required: [
                  "id",
                  "fieldSelector",
                  "title",
                  "type",
                  "options",
                  "required",
                ],
                additionalProperties: false,
              },
            },
            button: {
              type: "object",
              properties: {
                fieldSelector: { type: "string" },
                text: { type: "string" },
              },
              required: ["fieldSelector", "text"],
              additionalProperties: false,
            },
            feedbackFieldSelector: { type: "string" },
          },
          required: [
            "title",
            "description",
            "fields",
            "button",
            "feedbackFieldSelector",
          ],
          additionalProperties: false,
        },
        strict: true,
      },
    },
  },
});

// Helper to extract HTML
const extractHTML = async (url, browser) => {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForNetworkIdle();
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const html = await page.content();
    return html;
  } catch (error) {
    console.error(`Error loading URL ${url}: ${error}`);
    return null;
  } finally {
    await page.close();
  }
};

// Helper to get form schema from OpenAI
const getFormSchema = async (html, url) => {
  const prompt = `
You are an expert in parsing HTML forms into JSON schema. Given the following HTML content of a webpage, extract and format the form schema into the given JSON format. 

Example JSON format:
{
  "title": "Form Title",
  "description": "Form Description (if available)",
  "fields": [
    {
      "id": 0, (unique identifier for the field starts from 0)
      "fieldSelector": "html_field_selector", (eg format, [name='email'] or [id='email-1123']) prefer id over name
      "title": "Field Label",
      "type": "text | email | textarea | checkbox | radio | select", (for type tel use type text) (for displaying a information message use type message and set required to false)
      "options": [
        {
            "value": "Option 1",
            "label": "Option 1 Label"
        }
      ], (options required for select and radio types)
      "required": true | false
    }
  ],
  "button": {
    "fieldSelector": "html_button_selector", (eg format, .submit-button.main or .button-primary or #submitButton)
    "text": "Button Text"
  },
  "feedbackFieldSelector": "html_feedback_selector" (eg format, .success.main or .success-message or #successMessage)
}

HTML content:
${html}

For the company, derive the name from the domain in the URL "${url}". Ensure the JSON output is complete and follows the schema format. If there are multiple forms on the page, return a list of JSON objects.
`;

  try {
    const response = await openAi.chat({
      messages: [
        { role: "system", content: "Extract form schemas." },
        { role: "user", content: prompt },
      ],
    });

    return response.message.content;
  } catch (error) {
    console.error(`Error processing OpenAI request: ${error}`);
    return null;
  }
};

// Main function to run Puppeteer and OpenAI
const scrapeForms = async () => {
  const companies = JSON.parse(
    fs.readFileSync("src/data/contact_form_urls_1.json", "utf-8")
  ).filter((company) => company.contactForm);

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--disable-http2"],
  });

  let results = [];

  try {
    results = JSON.parse(
      fs.readFileSync("src/data/contact_forms_scrape_1.json", "utf-8")
    );
  } catch (error) {}

  for (const [index, company] of companies.entries()) {
    if (
      results.find((result) => result.company === extractDomain(company.url))
    ) {
      console.log(`Skipping: ${company.contactForm}`);
      continue;
    }
    console.log(
      `Processing: ${index}/${companies.length} ${company.contactForm}`
    );
    const html = await extractHTML(company.contactForm, browser);
    if (html) {
      const formSchema = await getFormSchema(html, company.url);
      if (formSchema) {
        results.push({
          company: extractDomain(company.url),
          formUrl: company.contactForm,
          ...JSON.parse(formSchema),
        });
      } else {
        console.error(`Failed to parse form for ${company.contactForm}`);
      }
    }
    fs.writeFileSync(
      "src/data/contact_forms_scrape_1.json",
      JSON.stringify(results, null, 4)
    );
  }

  await browser.close();
  console.log("Scraping completed.");
};

scrapeForms();
