import "dotenv/config";
import fs from "fs";

const {MOODS_PATH} = process.env;

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
        console.log(moods);
        res.status(200).json(moods);
    } catch(error) {
        res.status(500).json({error: "Error retrieving moods."});
    }
}

export { getAllMoods };
