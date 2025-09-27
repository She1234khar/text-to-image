import express from "express";
import userAuth from "../middlewares/auth.js";
import { createOrder, captureOrder } from "../controllers/paypalController.js";

const paypalRouter = express.Router();

paypalRouter.post("/create-order", userAuth, createOrder);
paypalRouter.post("/capture-order", userAuth, captureOrder);

export default paypalRouter;



