import express from "express";
import * as recommendationController from "../controllers/recommendation-controller.js";

const router = express.Router();

router.route("/tv").get(recommendationController.getAnimeByTVShow);

export default router;