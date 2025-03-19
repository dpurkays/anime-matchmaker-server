import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import Bottleneck from "bottleneck";
import "dotenv/config";
import NodeCache from "node-cache";
import { formatRating } from "../utils/animeUtils.js";
import { parseAIresponse } from "../utils/geminiUtils.js";

const cache = new NodeCache({ stdTTL: 60 * 5}); //cached for 5mins
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const limiter = new Bottleneck({
  minTime: 1350, 
  maxConcurrent: 3, // Allows 3 parallel requests (Jikan API allows 3/sec)
  reservoir: 60, // Allows 60 requests per minute
  reservoirRefreshInterval: 60 * 1000, // Refreshes every 60 seconds
  reservoirRefreshAmount: 60, // Restores 60 requests per minute
});


const getAnimeByMood = async (req, res) => {
  try {
    const jikan_genre_ids = req.query.jikan_genre_ids?.split(",") || [];
    const jikanUrl = "https://api.jikan.moe/v4/anime";

    const jikanResponse = await axios.get(
      `${jikanUrl}?genres=${jikan_genre_ids.join(",")}&order_by=popularity`
    );

    if (!jikanResponse.data.data || jikanResponse.data.data.length === 0) {
        return res.status(404).json({ error: "No anime found for given genres" });
    }

    const extractedAnime = jikanResponse.data.data.map((anime) => ({
        mal_id: anime.mal_id,
        image: anime.images.jpg.image_url,
        rating: formatRating(anime.rating),
        title_english: anime.title_english || anime.title,
        year: anime.year || " ",
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
    console.log(tvShow);

    if (!tvShow) {
      return res.status(400).json({ error: "TV show name is required" });
    }

    const cachedData = cache.get(tvShow);
    if (cachedData) {
      console.log("Serving from cache:", tvShow);
      return res.status(200).json(cachedData);
    }

    console.log("🔍 Fetching recommendations from Gemini...");

    const parsedData = await fetchAnimeRecommendationsFromGemini(tvShow);
    const animeRecommendations = await fetchAllAnimes(
      parsedData.recommendations
    );

    if(animeRecommendations.length > 0) {
        cache.set(tvShow, animeRecommendations);
    }

    res.status(200).json(animeRecommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch anime recommendations" });
  }
};

const fetchAnimeRecommendationsFromGemini = async (tvShow) => {
  try {
    const prompt = `
            I have a TV show or movie titled "${tvShow}" and I need **anime that closely match its themes, worldbuilding, and character dynamics.**  

            ### **Step 1: Analyze the Input**  
            First, identify the following aspects of "${tvShow}":  
            - **Genre** (e.g., Cyberpunk, Sci-Fi, Psychological Thriller, Action)  
            - **Setting** (e.g., Virtual Reality, AI-controlled dystopia, Futuristic Society)  
            - **Core Themes** (e.g., Simulation vs. Reality, AI vs. Humans, Hacking, Martial Arts, Free Will)  
            - **Mood & Atmosphere** (e.g., Dark, Futuristic, Philosophical, Action-packed)  

            ### **Step 2: Find Matching Anime**  
            - Select **10 anime that share at least 3 key aspects** with "${tvShow}".  
            - **Each recommendation must include a reason** explaining why it was selected.  
            - **Avoid unrelated genres** (e.g., high-fantasy, historical settings, romance-focused stories).  
            - **Each recommendation must include ONLY two fields:**  
                "title" → The anime name  
                "similarity_reason" → A short reason why this anime was chosen  

            ### ** DO NOT Include:**  
            - Genre  
            - Year of release  
            - Studio names  
            - Any information besides "title" and "similarity_reason"

            **Output Format (JSON only, no extra text):**
            Respond strictly in valid JSON format without any additional text. 
            The JSON should be structured as follows:
            \`\`\`json
            {
                "recommendations": [
                    {
                        "title": "Little Witch Academia",
                        "similarity_reason": "Both feature young students learning magic in a fantasy school setting, with a lighthearted yet adventurous tone."
                    },
                    {
                        "title": "Magi: The Labyrinth of Magic",
                        "similarity_reason": "Shares a magical world, powerful artifacts, and a coming-of-age protagonist discovering their destiny."
                    },
                    {
                        "title": "The Ancient Magus' Bride",
                        "similarity_reason": "Both involve magic, a deep sense of wonder, and characters growing into their magical abilities."
                    },
                    {
                        "title": "Black Clover",
                        "similarity_reason": "Magic users train at an academy, with themes of rivalry, friendship, and overcoming challenges."
                    },
                    {
                        "title": "Fate/Zero",
                        "similarity_reason": "Dark fantasy with magic users engaging in intense battles, featuring deep lore and historical inspirations."
                    }
                ]
                }
            }
            \`\`\`
            **VERY IMPORTANT**:
             - **Only return the JSON array** in the response.
            - Do **NOT** include any introduction, explanation, or extra text.
        `;

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
      console.log("nice, this anime was cached!",title);
      if(cachedAnime !== undefined) {
        cachedResults.push({ ...cachedAnime, similarity_reason: geminiRecommendations.find(a => a.title === title)?.similarity_reason });
      } else {
        toFetch.push(title);
      }
    })

    if (toFetch.length === 0) {
      console.log("All results served from cache!");
      return cachedResults;
    }

    console.log("🔍 Fetching remaining anime from Jikan:", toFetch);
    const fetchedAnimes = await Promise.allSettled(
      toFetch.map(async (title) => {
        try {
          const animeData = await fetchAnimeFromJikanByName(title);
          if(animeData) {
            cache.set(title, animeData);
            return { ...animeData, similarity_reason: geminiRecommendations.find(a => a.title === title)?.similarity_reason }
          } else return null;
        } catch (error) {
          console.error(
            `Error fetching anime with title: ${title}`,
            error
          );
          return null;
        }
      })
    );
    //because results returns a promise
    // const successfulResponses = response
    //   .filter(
    //     (response) => response.status === "fulfilled" && response.value !== null
    //   )
    //   .map((response) => response.value);

    const successfulResponses = [ 
      ...cachedResults, 
      ...fetchedAnimes
      .filter((response) => response.status === "fulfilled" && response.value !==null)
      .map((response) => response.value)
    ];

    return successfulResponses;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const fetchAnimeFromJikanByName = async (title, retryCount = 0) => {
  try {
    console.time(`⏳ Fetching: ${title}`); // Start timer
    const jikanUrl = "https://api.jikan.moe/v4/anime";

    const cachedAnime = cache.get(title);
    if (cachedAnime !== undefined) {
      console.timeEnd(`⏳ Fetching: ${title}`); // End timer (instant for cached)
      console.log(`Served cached data for: ${title}`);
      return cachedAnime;
    }

    const animeResponse = await limiter.schedule(() =>
      axios.get(`${jikanUrl}/?q=${title}`)
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
      year: anime.year || " ",
    };
    cache.set(title, extractedAnime);
    console.log(`got ${title}`);
    return extractedAnime;
  } catch (error) {
     console.timeEnd(`⏳ Fetching: ${title}`);
    if (error.response && error.response.status === 429) {
      console.error(`Rate limit exceeded for: ${title}. Retrying in 2s...`);
      if(retryCount < 3) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
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

export { getAnimeByMood, getAnimeByTVShow };
