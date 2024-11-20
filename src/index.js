import express from "express";
import cors from "cors";
import chatRoute from "./routes/chat.js";
import ratesRoute from "./routes/rates.js";
import websiteCaptureRoute from "./routes/website-capture.js";
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
app.use("/api/v1/", websiteCaptureRoute);

app.get("/", (req, res) => {
  res.send("server is healthy ...");
});

const PORT = parseInt(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`server listening on port ${PORT}`);
});
