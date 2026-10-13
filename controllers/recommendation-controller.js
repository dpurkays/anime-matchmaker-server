import axios from "axios";
import "dotenv/config";
import {
  cache,
  fetchAllAnimes,
  fetchMALAnimeList,
} from "../helpers/animeHelpers.js";
import { fetchAnimeRecommendationsFromGemini } from "../helpers/geminiHelpers.js";
import { ANIME_API_URL, formatRating } from "../utils/animeUtils.js";

const animeApiUrl = ANIME_API_URL;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const clearCache = async (req, res) => {
  cache.flushAll();
  res.status(200).json({ message: "✅ Cache cleared successfully." });
};

const getAnimeRecsByMALUser = async (req, res) => {
  let requestAborted = false;
  req.on("close", () => {
    requestAborted = true;
  });

  try {
    const malUsername = req.params.username;

    const cachedData = cache.get(malUsername);
    if (cachedData) return res.status(200).json(cachedData);

    const malAnimeList = await fetchMALAnimeList(malUsername);
    if (requestAborted) return;

    if (malAnimeList === null)
      return res.status(404).json({ error: "MAL user not found" });
    if (malAnimeList.length === 0)
      return res
        .status(404)
        .json({ error: "No anime found in user favorites or watch history." });

    const animeListString = malAnimeList.join(", ");
    const geminiRecommendations = await fetchAnimeRecommendationsFromGemini(
      "mal",
      animeListString,
    );
    await delay(2000);
    if (requestAborted) return;

    const animeRecommendations = await fetchAllAnimes(
      geminiRecommendations.recommendations,
      () => requestAborted,
    );
    if (requestAborted) return;

    if (animeRecommendations.length > 0) {
      cache.set(malUsername, animeRecommendations);
    }
    res.status(200).json(animeRecommendations.filter(Boolean));
  } catch (error) {
    console.error("getAnimeRecsByMALUser: ", error.message);
    res.status(500).json({ error: "Failed to fetch anime recommendations" });
  }
};

const getAnimeByMood = async (req, res) => {
  try {
    const genreParam = req.params.genreIds;
    const anime_genre_ids = genreParam?.split(",").filter(Boolean);

    if (!anime_genre_ids || anime_genre_ids.length === 0)
      return res
        .status(400)
        .json({ error: "Genre IDs are required in the query." });
    const animeResponse = await axios.get(
      `${animeApiUrl}anime?genres=${anime_genre_ids.join(",")}&order_by=popularity`,
    );

    if (!animeResponse.data.data || animeResponse.data.data.length === 0) {
      return res.status(404).json({ error: "No anime found for given genres" });
    }

    const extractedAnime = animeResponse.data.data.map((anime) => ({
      mal_id: anime.mal_id,
      image: anime.images.jpg.image_url,
      rating: formatRating(anime.rating),
      title_english: anime.title_english || anime.title,
      year: anime.year || anime.aired?.prop?.from?.year || "N/A",
    }));

    res.status(200).json(extractedAnime);
  } catch (error) {
    console.error("getAnimeByMood: ", error.message);
    res.status(500).json({ error: "Failed to fetch animes" });
  }
};

const getAnimeByTVShow = async (req, res) => {
  let requestAborted = false;

  req.on("close", () => {
    requestAborted = true;
  });

  try {
    const tvShow = req.query.tvShow;

    if (!tvShow) {
      return res.status(400).json({ error: "TV show name is required" });
    }

    const cachedData = cache.get(tvShow);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const geminiRecommendations = await fetchAnimeRecommendationsFromGemini(
      "tv",
      tvShow,
    );
    if (requestAborted) return;
    const animeRecommendations = await fetchAllAnimes(
      geminiRecommendations.recommendations,
      () => requestAborted,
    );
    if (animeRecommendations.length > 0 && !requestAborted) {
      cache.set(tvShow, animeRecommendations);
    }

    res.status(200).json(animeRecommendations.filter(Boolean));
  } catch (error) {
    console.error("getAnimeByTVShow: ", error.message);
    res.status(500).json({ error: "Failed to fetch anime recommendations" });
  }
};

export { clearCache, getAnimeByMood, getAnimeByTVShow, getAnimeRecsByMALUser };
