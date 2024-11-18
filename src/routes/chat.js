import { Router } from "express";
import { handleChat, handleCarrierChat } from "../controllers/chat.js";

const route = Router();

route.post("/chat", handleChat);
route.post("/chat/carrier", handleCarrierChat);

export default route;
