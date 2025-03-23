import axios from "axios";
import "dotenv/config";
import { fetchAnimeRecommendationsFromGemini } from "../helpers/geminiHelpers.js";
import { cache, fetchAllAnimes, fetchFavorites, fetchWatchHistory } from "../helpers/jikanHelpers.js";
import { formatRating, JIKAN_URL } from "../utils/animeUtils.js";

const jikanUrl = JIKAN_URL;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const clearCache = async (req, res) => {
  cache.flushAll();
  res.status(200).json({ message: "✅ Cache cleared successfully." });
}

const getAnimeRecsByMALUser = async (req, res) => {
  let requestAborted = false;
  req.on('close', () => {
    requestAborted = true;
  });

  try{
    const malUsername = req.query.malUsername;

    const cachedData = cache.get(malUsername);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const malAnimeList = await fetchMALanimeList(malUsername);
    if (malAnimeList.length === 0) {
      return res.status(404).json({ error: "No anime found in user favorites or watch history." });
    }

    const animeListString = malAnimeList.join(", ");
    const geminiRecommendations = await fetchAnimeRecommendationsFromGemini("mal", animeListString);
    await delay(2000);
    const animeRecommendations = await fetchAllAnimes(geminiRecommendations.recommendations, () => requestAborted);
    if(animeRecommendations.length > 0) {
        cache.set(malUsername, animeRecommendations);
    }
    res.status(200).json(animeRecommendations.filter(Boolean));
  } catch(error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch anime recommendations" });
  }
}

const fetchMALanimeList = async (username) => {
  try{
    if (!username) {
      console.error("MAL username is required");
      return null;
    } 

    let animeList = await fetchFavorites(username);

    if (animeList.length === 0) {
      console.log("No favorites....looking at watch history");
      animeList = await fetchWatchHistory(username);
    }
   
    return animeList;

  } catch(error) {
    console.error(error);
    throw new Error("Failed to fetch MAL animes");
    
  }
}

const getAnimeByMood = async (req, res) => {
  try {
    const jikan_genre_ids = req.query.jikan_genre_ids?.split(",") || [];
    const jikanResponse = await axios.get(
      `${jikanUrl}anime?genres=${jikan_genre_ids.join(",")}&order_by=popularity`
    );

    if (!jikanResponse.data.data || jikanResponse.data.data.length === 0) {
        return res.status(404).json({ error: "No anime found for given genres" });
    }

    const extractedAnime = jikanResponse.data.data.map((anime) => ({
        mal_id: anime.mal_id,
        image: anime.images.jpg.image_url,
        rating: formatRating(anime.rating),
        title_english: anime.title_english || anime.title,
        year: anime.year || "",
    }));

    res.status(200).json(extractedAnime);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch animes" });
  }
};

const getAnimeByTVShow = async (req, res) => {
  let requestAborted = false;

  req.on('close', () => {
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

    const geminiRecommendations = await fetchAnimeRecommendationsFromGemini("tv", tvShow);
    if (requestAborted) return;
    const animeRecommendations = await fetchAllAnimes(geminiRecommendations.recommendations, () => requestAborted);
    if(animeRecommendations.length > 0 && !requestAborted) {
        cache.set(tvShow, animeRecommendations);
    }

    res.status(200).json(animeRecommendations.filter(Boolean));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch anime recommendations" });
  }
};

export { clearCache, getAnimeByMood, getAnimeByTVShow, getAnimeRecsByMALUser };

