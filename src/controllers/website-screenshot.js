import fs from "fs";
import extractDomain, { extractFormattedUrl } from "../utils/urlExtract.js";

export const handleWebsiteScreenshot = async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({
      message: "url is required",
    });
  }
  try {
    const formattedUrl = extractFormattedUrl(url);
    const domain = extractDomain(url);

    const filePath = `src/website-screenshots/${formattedUrl}.webp`;
    const domainFilePath = `src/website-screenshots/${domain}.webp`;

    if (fs.existsSync(filePath)) {
      return res.status(200).json({
        success: true,
        message: "screenshot exists",
        data: { url: `/website-screenshots/${formattedUrl}.webp` },
      });
    } else if (fs.existsSync(domainFilePath)) {
      return res.status(200).json({
        success: true,
        message: "screenshot exists",
        data: { url: `/website-screenshots/${domain}.webp` },
      });
    }

    return res.status(404).json({
      success: false,
      message: "screenshot does not exist",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
