import { Router } from "express";
import { handleChat, handleCarrierChat, handleCarrierApiDocsChat } from "../controllers/chat.js";

const route = Router();

route.post("/chat", handleChat);
route.post("/chat/carrier", handleCarrierChat);
route.post("/chat/api-docs", handleCarrierApiDocsChat);

export default route;
