import "dotenv/config";
import fs from "fs";

const { MOODS_PATH } = process.env;

const readFile = () => {
    return JSON.parse(fs.readFileSync(MOODS_PATH));
}

const getAllMoods = (req, res) => {
    try {
        const moods = readFile().map(({id, name, color, emoji, description})  => ({
            id,
            name,
            color,
            emoji,
            description
        }));
        res.status(200).json(moods);
    } catch(error) {
        res.status(500).json({error: "Error retrieving moods."});
    }
}

const getAllGenresByMood = (req, res) => {
    try {
        const { id } = req.params;
        const moods = readFile();

        const mood = moods.find(m => m.id === parseInt(id));
        if(!mood) {
            return res.status(404).json({error: "Mood not found"});
        }
        const genres = mood.genres;
        res.json({genres});
    } catch(error){
        res.status(500).json({error: "Error retrieving genres by mood"});
    }
}

const getOneGenre = (req, res) => {
    try {
        const { id, genreId } = req.params;
        const moods = readFile();

        const mood = moods.find(m => m.id === parseInt(id));
        if(!mood) {
            return res.status(404).json({error: "Mood not found"});
        }

        const genre = mood.genres.find(g => g.id === parseInt(genreId));
        if(!genre) {
           return res.status(404).json({error: "Genre not found"});
        }

        res.status(200).json(genre);

    } catch(error){
        res.status(500).json({error: "Error retrieving genres by mood"});
    }
}

export { getAllGenresByMood, getAllMoods, getOneGenre };

