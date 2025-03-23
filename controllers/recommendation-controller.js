import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import Bottleneck from "bottleneck";
import "dotenv/config";
import NodeCache from "node-cache";
import { formatRating, JIKAN_URL } from "../utils/animeUtils.js";
import { getGeminiPrompt, parseAIresponse } from "../utils/geminiUtils.js";

// const cache = new NodeCache({ stdTTL: 60 * 5}); //cached for 5mins
const cache = new NodeCache({ stdTTL: 2 * 60 * 60}); //cached for 2 hours
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const jikanUrl = JIKAN_URL;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const limiter = new Bottleneck({
  minTime: 1350, 
  maxConcurrent: 3, // Allows 3 parallel requests (Jikan API allows 3/sec)
  reservoir: 60, // Allows 60 requests per minute
  reservoirRefreshInterval: 60 * 1000, // Refreshes every 60 seconds
  reservoirRefreshAmount: 60, // Restores 60 requests per minute
});

const clearCache = async (req, res) => {
  cache.flushAll();
  res.status(200).json({ message: "✅ Cache cleared successfully." });
}


const getAnimeRecsByMALUser = async (req, res) => {
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
    const animeRecommendations = await fetchAllAnimes(geminiRecommendations.recommendations);
    console.log(animeRecommendations);
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

const fetchFavorites = async (username, retryCount = 0) => {
  try {
    const response = await axios.get(`${jikanUrl}users/${username}/favorites`);
    if (response.data?.data?.length > 0) {
      return response.data.data.anime.map((anime) => anime.title).filter(Boolean);
    }
    return [];
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.error(`Rate limit exceeded for favorites. Retrying in 2s...`);
      if (retryCount < 3) {
        await delay(2000);
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
    await delay(2000); // Delay before making the request
    const response = await axios.get(`${jikanUrl}users/${username}/history?type=anime`);
    return response.data?.data?.map((anime) => anime.entry.name).filter(Boolean) || [];
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.error(`Rate limit exceeded for watch history. Retrying in 2s...`);
      if (retryCount < 3) {
        await delay(2000);
        return fetchWatchHistory(username, retryCount + 1);
      } else {
        console.error(`Failed to fetch watch history after 3 retries.`);
      }
    }
    return [];
  }
};

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
    const animeRecommendations = await fetchAllAnimes(
      geminiRecommendations.recommendations
    );

    if(animeRecommendations.length > 0) {
        cache.set(tvShow, animeRecommendations);
    }

    res.status(200).json(animeRecommendations.filter(Boolean));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch anime recommendations" });
  }
};

const fetchAnimeRecommendationsFromGemini = async (type, tvShow) => {
  try {
    const prompt = getGeminiPrompt(type, tvShow);
    const result = await model.generateContent(prompt);
    return parseAIresponse(result);
  } catch (error) {
    console.error("Error fetching recommendations from Gemini API: ", error);
    return { recommendations: [] };
  }
};

const fetchAllAnimes = async (geminiRecommendations) => {
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

    if (toFetch.length === 0) {
      return cachedResults;
    }

    const fetchedAnimes = await Promise.allSettled(
      toFetch.map(async (title) => {
        try {
          const animeData = await fetchAnimeFromJikanByName(title);
          if(animeData) {
            cache.set(title, animeData);
            const matchingRecommendation = geminiRecommendations.find(a => a.title === title);
            return { 
              ...animeData, 
              similarity_reason: matchingRecommendation ? matchingRecommendation.similarity_reason : null 
            }
          }
        } catch (error) {
          console.error(
            `Error fetching anime with title: ${title}`,
            error
          );
          return null;
        }
      })
    );

    const successfulResponses = [ 
      ...cachedResults, 
      ...fetchedAnimes
      .filter((response) => response.status === "fulfilled" && response.value !==null)
      .map((response) => response.value)
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
      console.error(`Rate limit exceeded for: ${title}. Retrying in 2s...`);
      if(retryCount < 3) {
        await delay(2000);
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

export { clearCache, getAnimeByMood, getAnimeByTVShow, getAnimeRecsByMALUser };

