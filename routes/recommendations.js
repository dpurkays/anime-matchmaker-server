import express from "express";
import * as recommendationController from "../controllers/recommendation-controller.js";

const router = express.Router();

router.get("/tv", recommendationController.getAnimeByTVShow);
router.get("/anime-mood", recommendationController.getAnimeByMood);

export default router;