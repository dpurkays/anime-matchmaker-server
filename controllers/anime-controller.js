import axios from "axios";
import "dotenv/config";
import NodeCache from "node-cache";
import {
  formatAiringStatus,
  formatDuration,
  formatRating,
  JIKAN_URL,
} from "../utils/animeUtils.js";

const jikanUrl = JIKAN_URL;
const cache = new NodeCache({ stdTTL: 4 * 60 * 60 });
const getSeasonHottest = async (req, res) => {
  try {
    const jikanResponse = await axios.get(`${jikanUrl}seasons/now?limit=20`);
    const seen = new Set();
    const extracted = [];

    for (const anime of jikanResponse.data.data) {
      if (!seen.has(anime.mal_id)) {
        seen.add(anime.mal_id);

        extracted.push({
          mal_id: anime.mal_id,
          image: anime.images.jpg.large_image_url,
          rating: formatRating(anime.rating),
          title_english: anime.title_english || anime.title,
          synopsis: anime.synopsis,
          genres: anime.genres.map((genre) => genre.name),
          year: anime.year || "",
        });
      }
    }

    res.status(200).json(extracted);
  } catch (error) {
    console.error("getSeasonHottest:", error);
    res.status(500).json({ error: "Error fetching hottest season animes" });
  }
};

const getAnime = async (req, res) => {
  try {
    const { animeId } = req.params;

    const cachedAnime = cache.get(animeId);
    if (cachedAnime) {
      return res.status(200).json(cachedAnime);
    }

    const jikanResponse = await axios.get(`${jikanUrl}anime/${animeId}/full`);
    if (!jikanResponse.data.data || jikanResponse.data.data.length === 0) {
      return res.status(404).json({ error: `No anime with id ${animeId}` });
    }
    const anime = jikanResponse.data.data;
    const extractedAnime = {
      mal_id: anime.mal_id,
      image: anime.images.jpg.image_url,
      rating: formatRating(anime.rating),
      title_english: anime.title_english || anime.title,
      title_japanese: anime.title_japanese,
      type: anime.type,
      episodes: anime.episodes,
      duration: formatDuration(anime.duration),
      favorites: anime.favorites,
      synopsis: anime.synopsis,
      genres: anime.genres,
      themes: anime.themes,
      status: formatAiringStatus(anime.status),
      studio: anime?.studios[0]?.name || "Unknown",
      rating: anime.rating,
      year: anime.year || anime.aired?.prop?.from?.year || "N/A",
      aired: anime.aired.string,
      youtube_id: anime.trailer.youtube_id,
    };

    cache.set(animeId, extractedAnime);

    res.status(200).json(extractedAnime);
  } catch (error) {
    console.error("getAnime:", error.message);
    res.status(500).json({ error: "Failed to fetch anime details" });
  }
};

export { getAnime, getSeasonHottest };
