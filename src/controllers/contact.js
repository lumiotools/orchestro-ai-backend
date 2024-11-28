import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import { postPageLoadScript } from "../utils/contactFormMiddlewareScripts.js";

puppeteer.use(StealthPlugin());

export const companyContactFormsData = JSON.parse(
  fs.readFileSync("src/data/contact_forms.json", "utf-8")
);

export const handleGetFormSchema = async (req, res) => {
  const { company } = req.query;

  const contactForm = companyContactFormsData.find(
    (form) => form.company === company
  );

  if (!contactForm) {
    return res.status(404).json({
      success: false,
      message: "Company not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      title: contactForm.title,
      description: contactForm.description,
      fields: contactForm.fields.map((field) => ({
        ...field,
        fieldId: undefined,
        fieldName: undefined,
      })),
      buttonText: contactForm.button.text,
    },
  });
};

export const handleContactComapny = async (req, res) => {
  const { company, inputs: userInputs } = req.body;

  const contactForm = companyContactFormsData.find(
    (form) => form.company === company
  );

  if (!contactForm) {
    return res.status(404).json({
      success: false,
      message: "Company not found",
    });
  }

  const formUrl = contactForm.formUrl;
  const fields = contactForm.fields;
  const buttonSelector = contactForm.button.fieldSelector;
  const feedbackSelector = contactForm.feedbackFieldSelector;
  const feedbackAlert = contactForm.feedbackAlert;

  for (const field of fields) {
    if (!userInputs[field.title] && field.required) {
      return res.status(500).json({
        success: false,
        message: `${field.title} is required`,
      });
    }
  }

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--disable-http2"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(formUrl, { waitUntil: "networkidle2", timeout: 60000 });

    await postPageLoadScript(company, page);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    for (const field of fields) {
      const selector =
        field.fieldSelector ??
        (field.fieldId
          ? `#${field.fieldId}` // Use `fieldId` if available
          : `[name="${field.fieldName}"]`); // Use `fieldName` if `fieldId` is not available

      await page.waitForSelector(selector, { timeout: 5000 });

      if (field.type === "checkbox") {
        await page.evaluate((selector) => {
          const element = document.querySelector(selector);
          if (element) element.click();
        }, selector);
      } else if (field.type === "select") {
        await page.select(selector, userInputs[field.title]);
      } else {
        await page.type(selector, userInputs[field.title]);
      }
    }

    let feedbackText = "Form submitted successfully";

    if (feedbackAlert) {
      page.on("dialog", async (dialog) => {
        feedbackText = dialog.message(); // Capture the alert message
        await dialog.dismiss(); // Dismiss the alert to proceed
      });
    }

    await page.waitForSelector(buttonSelector, { timeout: 5000 });
    await page.click(buttonSelector);

    await page.waitForNetworkIdle();

    if (feedbackSelector) {
      // Wait for the feedback element to become visible
      await page.waitForFunction(
        (selector) => {
          const element = document.querySelector(selector);
          if (!element) return false;
          const style = window.getComputedStyle(element);
          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            style.opacity !== "0"
          );
        },
        { timeout: 10000 }, // Adjust timeout as needed
        feedbackSelector
      );

      feedbackText = await page.$eval(feedbackSelector, (el) => el.textContent);
    }

    await browser.close();

    return res.status(200).json({
      success: true,
      message: feedbackText,
    });
  } catch (error) {
    console.error(error);

    await browser.close();

    return res.status(500).json({
      success: false,
      message: "An error occurred, please check your inputs and try again",
    });
  }
};
