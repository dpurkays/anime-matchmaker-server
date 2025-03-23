import express from "express";
import * as recommendationController from "../controllers/recommendation-controller.js";

const router = express.Router();

router.get("/mal", recommendationController.getAnimeRecsByMALUser);
router.get("/tv", recommendationController.getAnimeByTVShow);
router.get("/anime-mood", recommendationController.getAnimeByMood);
router.get("/clear-cache", recommendationController.clearCache);
export default router;