import express from "express";
import * as moodsController from "../controllers/moods-controller.js";

const router = express.Router();

router.get("/", moodsController.getAllMoods);
router.get("/:id/genres", moodsController.getAllGenresByMood);
router.get("/:id/genres/:genreId", moodsController.getOneGenre);

export default router;