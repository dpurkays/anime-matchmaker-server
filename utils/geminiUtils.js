const parseAIresponse = (result) => {
    const responseText = result.response.text();
    const parsedData = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    if (!parsedData) throw new Error("Failed to extract JSON");
    return JSON.parse(parsedData);
}

const getGeminiPrompt = (type, input) => {
    switch(type) {
        case "tv":
        return  `
            I have a TV show or movie titled "${input}" and I need **anime that closely match its themes, worldbuilding, and character dynamics.**  

            ### **Step 1: Analyze the Input**  
            First, identify the following aspects of "${input}":  
            - **Genre** (e.g., Cyberpunk, Sci-Fi, Psychological Thriller, Action)  
            - **Setting** (e.g., Virtual Reality, AI-controlled dystopia, Futuristic Society)  
            - **Core Themes** (e.g., Simulation vs. Reality, AI vs. Humans, Hacking, Martial Arts, Free Will)  
            - **Mood & Atmosphere** (e.g., Dark, Futuristic, Philosophical, Action-packed)  

            ### **Step 2: Find Matching Anime**  
            - Select **10 anime that share at least 3 key aspects** with "${input}".  
            - **Each recommendation must include a reason** explaining why it was selected.  
            - **Avoid unrelated genres** (e.g., high-fantasy, historical settings, romance-focused stories).  
            - **Each recommendation must include ONLY two fields:**  
                "title" → The anime name  
                "similarity_reason" → A short reason why this anime was chosen, formatted as:
                "This is recommended because "  

            ### ** DO NOT Include:**  
            - Genre  
            - Year of release  
            - Studio names  
            - Any information besides "title" and "similarity_reason"

            **Output Format (JSON only, no extra text):**
            Respond strictly in valid JSON format without any additional text. 
            The JSON should be structured as follows (this is a sample json):
            \`\`\`json
            {
                "recommendations": [
                    {
                    "title": "Little Witch Academia",
                    "similarity_reason": "This is recommended because it features young students learning magic in a fantasy school setting, with a lighthearted yet adventurous tone."
                    },
                    {
                    "title": "Magi: The Labyrinth of Magic",
                    "similarity_reason": "This is recommended because it shares a magical world, powerful artifacts, and a coming-of-age protagonist discovering their destiny."
                    },
                    {
                    "title": "The Ancient Magus' Bride",
                    "similarity_reason": "This is recommended because it involves magic, a deep sense of wonder, and characters growing into their magical abilities."
                    },
                    {
                    "title": "Black Clover",
                    "similarity_reason": "This is recommended because magic users train at an academy, with themes of rivalry, friendship, and overcoming challenges."
                    },
                    {
                    "title": "Fate/Zero",
                    "similarity_reason": "This is recommended because it features dark fantasy with magic users engaging in intense battles, deep lore, and historical inspirations."
                    }
                ]
            }
            \`\`\`
            **VERY IMPORTANT**:
             - **Only return the JSON array** in the response.
            - Do **NOT** include any introduction, explanation, or extra text.
        `;
    
    case "mal":
        return `
            I have watched the following anime: "${input}". 

            ### **Step 1: Analyze the Input**  
            Identify the following based on my watch history:
            - **Genre Trends** (e.g., Action, Fantasy, Sci-Fi)
            - **Common Themes** (e.g., Coming of Age, Supernatural, Time Travel)
            - **Mood & Atmosphere** (e.g., Dark, Lighthearted, Psychological)
            - **Most Frequent Studio Styles** (e.g., Ufotable = dynamic action, Kyoto Animation = emotional depth)

            ### **Step 2: Find Matching Anime**  
            - Select **10 anime that share at least 3 key aspects** from my history.
            - **Each recommendation must include a reason** explaining why it was selected.
            - **Avoid recommending anime I have already watched**.
            - **Ensure diversity** in recommendations (mixing well-known and hidden gems).
            - **Each recommendation must include ONLY two fields:**  
                - "title" → The anime name  
                - "similarity_reason" → A short reason why this anime was chosen

            ### **DO NOT Include:**  
            - Genre  
            - Year of release  
            - Studio names  
            - Any information besides "title" and "similarity_reason"

            ### **Output Format (JSON only, no extra text):**
            Respond strictly in valid JSON format without any additional text.  
            The JSON should be structured as follows (this is a sample json):
            \`\`\` json
             {
                "recommendations": [
                    {
                    "title": "Puella Magi Madoka Magica",
                    "similarity_reason": "You watched **Revolutionary Girl Utena**, so this is recommended for its deconstruction of the magical girl genre and psychological depth."
                    },
                    {
                    "title": "Re:ZERO -Starting Life in Another World-",
                    "similarity_reason": "Since you enjoyed **Steins;Gate**, this anime also explores time loops and psychological struggles."
                    },
                    {
                    "title": "Code Geass: Lelouch of the Rebellion",
                    "similarity_reason": "You liked **Death Note**, so this is recommended because it features a highly intelligent protagonist orchestrating a rebellion."
                    },
                    {
                    "title": "Made in Abyss",
                    "similarity_reason": "Because you enjoyed **Attack on Titan**, this anime also explores survival, mystery, and the dark consequences of curiosity."
                    },
                    {
                    "title": "Higurashi: When They Cry",
                    "similarity_reason": "Since you liked **Erased**, this is recommended for its time-loop horror and psychological tension."
                    }
                ]
                }
        \`\`\`
        **VERY IMPORTANT**:
            - **Only return the JSON array** in the response.
            - Do **NOT** include any introduction, explanation, or extra text.
        `; 
    default:
      throw new Error("Invalid recommendation type provided.");
    }
    
}

export { getGeminiPrompt, parseAIresponse };

