import axios from "axios";
import "dotenv/config";
import { formatAiringStatus, formatDuration, formatRating, jikanUrl } from "../utils/animeUtils.js";

const getAnime = async (req, res) => {
    try {
        const {animeId} = req.params;
        const jikanResponse = await axios.get(`${jikanUrl}/${animeId}/full`);
        if (!jikanResponse.data.data || jikanResponse.data.data.length === 0) {
            return res.status(404).json({ error: "No anime found for given genres" });
        }
        const anime = jikanResponse.data.data;
        // console.log(anime)
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
            studio: anime.studios[0].name,
            rating: anime.rating,
            year: anime.year || "",
            aired: anime.aired.to,
            youtube_id: anime.trailer.youtube_id
        }
        console.log(extractedAnime)
        res.status(200).json(extractedAnime);

    } catch(error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch anime details" });
    }
}

export { getAnime };
