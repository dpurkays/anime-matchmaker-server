import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import "dotenv/config";
import { formatRating } from "../utils/animeUtils.js";
import { parseAIresponse } from "../utils/geminiUtils.js";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({model: "gemini-2.0-flash"});

const getAnimeByTVShow = async(req, res) => {
    try {
        const tvShow = req.query.tvShow;
        console.log(tvShow);

        if (!tvShow) {
            return res.status(400).json({ error: "TV show name is required" });
        }

        const prompt =  `
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
        const parsedData = parseAIresponse(result);
        // console.log(parsedData);
        //  call jikan api here and parse to send to frontend
        console.log(parsedData.recommendations[0].title)
        fetchAnimeFromJikanByName(parsedData.recommendations[0].title);


        res.status(200).json(parsedData);
    } catch(error) {
        console.error(error);
        res.status(500).json({error: "Failed to fetch anime recommendations"});
    }
}

const fetchAnimeFromJikanByName = async (title) => {
    try{
        const jikanUrl = "https://api.jikan.moe/v4/anime";
        const animeResponse = await axios.get(`${jikanUrl}/?q=${title}`);
        if(animeResponse.data.length === 0) {
            console.error(`no results foudn for :${title}`);
            return null;
        }

        const anime = animeResponse.data.data[0];
        const extractedAnime = {
            mal_id: anime.mal_id,
            image: anime.images.jpg.image_url,
            rating: formatRating(anime.rating),
            title_english: anime.title_english,
            year: anime.year
        }
        console.log(extractedAnime);



    } catch(error) {
        console.error(error);
        return null;
    }
}

export { getAnimeByTVShow };
