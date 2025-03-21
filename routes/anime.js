import express from "express";
import * as animeController from "../controllers/anime-controller.js";

const router = express.Router();

router.get("/:animeId", animeController.getAnime);
router.get("/seasons/hottest", animeController.getSeasonHottest);

export default router;