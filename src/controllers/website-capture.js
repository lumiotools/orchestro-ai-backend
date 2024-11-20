import fs from "fs";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

export const handleWebsiteCapture = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send("Error: URL parameter is required.");
  }
  puppeteer.use(StealthPlugin());
  const browser = await puppeteer.launch({
    args: ["--disable-http2"],
    userDataDir: "./project/puppeteer",
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(url, { waitUntil: "networkidle2" });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const screenshotBuffer = await page.screenshot();

    await browser.close();

    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Length": screenshotBuffer.length,
    });
    res.end(screenshotBuffer);
  } catch (error) {
    await browser.close();

    const svgPath = "assets/website-screenshot-error.svg";

    const readStream = fs.createReadStream(svgPath);
    res.writeHead(200, {
      "Content-Type": "image/svg+xml",
    });

    readStream.pipe(res);
  }
};
