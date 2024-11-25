import { Router } from "express";
import { handleChat, handleCarrierChat, handleCarrierApiDocsChat,handleCarrierRatesNegotiationChat } from "../controllers/chat.js";

const route = Router();

route.post("/chat", handleChat);
route.post("/chat/carrier", handleCarrierChat);
route.post("/chat/api-docs", handleCarrierApiDocsChat);
route.post("/chat/rates-negotiation", handleCarrierRatesNegotiationChat);

export default route;
