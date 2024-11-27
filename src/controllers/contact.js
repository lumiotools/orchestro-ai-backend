import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";

puppeteer.use(StealthPlugin());

const contactData = JSON.parse(
  fs.readFileSync("src/data/contact_forms.json", "utf-8")
);

export const handleContactComapny = async (req, res) => {
  const { company, inputs: userInputs } = req.body;

  const contactForm = contactData.find((form) => form.company === company);

  if (!contactForm) {
    res.status(404).json({
      success: false,
      message: "Company not found",
    });
    return;
  }

  const formUrl = contactForm.formUrl;
  const fields = contactForm.fields;
  const buttonClassName = contactForm.button.fieldClassName;
  const buttonId = contactForm.button.fieldId;
  const feedbackClassName = contactForm.feedbackFieldClassName;
  const feedbackId = contactForm.feedbackFieldId;

  for (const field of fields) {
    if (!userInputs[field.title] && field.required) {
      res.status(500).json({
        success: false,
        message: `${field.title} is required`,
      });
      return;
    }
  }

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--disable-http2"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(formUrl, { waitUntil: "networkidle2", timeout: 60000 });

    for (const field of fields) {
      const selector = `#${field.fieldId}`;

      await page.waitForSelector(selector, { timeout: 5000 });

      await page.type(selector, userInputs[field.title]);
    }

    await page.content();

    await page.waitForSelector(
      buttonClassName ? `.${buttonClassName}` : `#${buttonId}`,
      { timeout: 5000 }
    );
    await page.click(buttonClassName ? `.${buttonClassName}` : `#${buttonId}`);

    await page.waitForNetworkIdle();

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
      feedbackClassName ? `.${feedbackClassName}` : `#${feedbackId}`
    );

    const feedbackText = await page.$eval(
      feedbackClassName ? `.${feedbackClassName}` : `#${feedbackId}`,
      (el) => el.textContent
    );

    await browser.close();

    res.status(200).json({
      success: true,
      message: feedbackText ?? "Form submitted successfully",
    });
  } catch (error) {
    console.error(error);

    await browser.close();

    res.status(500).json({
      success: false,
      message: "An error occurred, please check your inputs and try again",
    });
  }
};
