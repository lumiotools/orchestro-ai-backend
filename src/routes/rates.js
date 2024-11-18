import { Router } from "express";
import { handleRatesEstimation } from "../controllers/rates.js";

const route = Router();

route.post("/rates", handleRatesEstimation);

export default route;
