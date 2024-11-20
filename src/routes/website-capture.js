import { Router } from "express";
import { handleWebsiteCapture } from "../controllers/website-capture.js";

const route = Router();

route.get("/website-capture", handleWebsiteCapture);

export default route;
