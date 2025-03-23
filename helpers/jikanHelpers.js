import axios from "axios";
import Bottleneck from "bottleneck";
import NodeCache from "node-cache";
import { formatRating, JIKAN_URL } from "../utils/animeUtils.js";


const cache = new NodeCache({ stdTTL: 2 * 60 * 60}); // cached for 2 hours
const jikanUrl = JIKAN_URL;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const limiter = new Bottleneck({
  maxConcurrent: 3,            // allows 3 requests at once
  minTime: 334,                // ~3 per second (1000ms / 3 ≈ 333.33)
  reservoir: 60,               // Total of 60 requests per minute
  reservoirRefreshAmount: 60,  // Refill back to 60
  reservoirRefreshInterval: 60 * 1000, // Every 60 seconds
});

const fetchAllAnimes = async (geminiRecommendations, isCancelledFn) => {
  try {

    const animeTitles = geminiRecommendations.map((anime) => anime.title);
    const cachedResults = [];
    const toFetch = [];

    animeTitles.forEach((title) => {
      const cachedAnime = cache.get(title);
      if(cachedAnime !== undefined) {
         const matchingRecommendation = geminiRecommendations.find(a => a.title === title);
         if(matchingRecommendation) {
            cachedResults.push({ 
              ...cachedAnime, 
              similarity_reason: matchingRecommendation.similarity_reason });
         }
      } else {
        toFetch.push(title);
      }
    })

    if (toFetch.length === 0 || isCancelledFn()) return cachedResults;

    const fetchedAnimes = [];

    for(const title of toFetch) {
      if (isCancelledFn()) break;
      
        try {
          const animeData = await fetchAnimeFromJikanByName(title);
          if(animeData) {
            cache.set(title, animeData);
            const matching = geminiRecommendations.find(a => a.title === title);
            fetchedAnimes.push({
              ...animeData,
              similarity_reason: matching?.similarity_reason || null,
            });
          }
        } catch (error) {
          console.error(
            `Error fetching anime with title: ${title}`,
            error
          );
          return null;
        }
      }

    const successfulResponses = [
      ...cachedResults,
      ...fetchedAnimes.filter(Boolean)
    ];

    const uniqueResponses = Array.from(
      new Map(successfulResponses.map((anime) => [anime.mal_id, anime])).values()
    );

    return uniqueResponses;

  } catch (error) {
    console.error(error);
    return [];
  }
};

const fetchAnimeFromJikanByName = async (title, retryCount = 0) => {
  try {
    const cachedAnime = cache.get(title);
    if (cachedAnime !== undefined) {
      return cachedAnime;
    }

    const animeResponse = await limiter.schedule(() =>
      axios.get(`${jikanUrl}anime/?q=${title}`)
    );


    if (!animeResponse.data.data || animeResponse.data.data.length === 0) {
      console.error(`No results found for: ${title}`);
      cache.set(title, null);
      return null;
    }

    const anime = animeResponse.data.data[0];
    const extractedAnime = {
      mal_id: anime.mal_id,
      image: anime.images.jpg.image_url,
      rating: formatRating(anime.rating),
      title_english: anime.title_english || anime.title,
      year: anime.year ||  "",
    };
    cache.set(title, extractedAnime);
    return extractedAnime;

  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.error(`Rate limit exceeded for: ${title}. Retrying in 3s...`);
      if(retryCount < 3) {
        await delay(3000);
        return fetchAnimeFromJikanByName(title, retryCount + 1);
      } else {
        console.error(`Failed after 3 retries: ${title}`);
        cache.set(title, null);
        return null
      }
    } else {
      console.error(`Error fetching anime: ${title}`, error.message);
      cache.set(title, null);
      return null;
    }
  }
};

const fetchFavorites = async (username, retryCount = 0) => {
  try {
    const response = await axios.get(`${jikanUrl}users/${username}/favorites`); 
    if (response.data?.data?.length > 0) {
      return response.data.data.anime.map((anime) => anime.title).filter(Boolean);
    }
    return [];
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.error(`Rate limit exceeded for favorites. Retrying in 3s...`);
      if (retryCount < 3) {
        await delay(3000);
        return fetchFavorites(username, retryCount + 1);
      } else {
        console.error(`Failed to fetch favorites after 3 retries.`);
      }
    }
    return [];
  }
}

const fetchWatchHistory = async (username, retryCount = 0) => {
  try {
    await delay(3000);
    const response = await axios.get(`${jikanUrl}users/${username}/history?type=anime`);
    return response.data?.data?.map((anime) => anime.entry.name).filter(Boolean) || [];
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.error(`Rate limit exceeded for watch history. Retrying in 3s...`);
      if (retryCount < 3) {
        await delay(3000);
        return fetchWatchHistory(username, retryCount + 1);
      } else {
        console.error(`Failed to fetch watch history after 3 retries.`);
      }
    }
    return [];
  }
};

export { cache, fetchAllAnimes, fetchAnimeFromJikanByName, fetchFavorites, fetchWatchHistory };
