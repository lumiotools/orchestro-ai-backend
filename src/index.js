import express from "express";
import cors from "cors";
import chatRoute from "./routes/chat.js";
import ratesRoute from "./routes/rates.js";
import { handleWebsiteScreenshot } from "./controllers/website-screenshot.js";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
  })
);
app.use("/api/v1/", chatRoute);
app.use("/api/v1/", ratesRoute);

app.get("/", (req, res) => {
  res.send("server is healthy ...");
});

app.use("/website-screenshots", express.static("src/website-screenshots"));
app.get("/api/v1/website-screenshot", handleWebsiteScreenshot);

const PORT = parseInt(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`server listening on port ${PORT}`);
});
