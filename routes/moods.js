import express from "express";
import * as moodsController from "../controllers/moods-controller.js";

const router = express.Router();

router.get("/", moodsController.getAllMoods);


export default router;