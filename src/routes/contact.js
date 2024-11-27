import { Router } from "express";
import {
  handleContactComapny,
  handleGetFormSchema,
} from "../controllers/contact.js";

const contactRouter = Router();

contactRouter.get("/contact/schema", handleGetFormSchema);
contactRouter.post("/contact-company", handleContactComapny);

export default contactRouter;
