import { Router } from "express";
import { handleChat } from "../controllers/chat.js";

const route = Router();

route.post("/chat", handleChat);

export default route;
