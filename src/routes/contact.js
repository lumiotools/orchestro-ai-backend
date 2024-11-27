import { Router } from "express";
import { handleContactComapny } from "../controllers/contact.js";

const contactRouter = Router();

contactRouter.post("/contact-company", handleContactComapny);

export default contactRouter;
