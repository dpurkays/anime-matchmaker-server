import "dotenv/config";
import express from "express";

const app = express();
const PORT = process.env.PORT || 5050;

app.use(express.json());
app.use(cors());

app.listen(PORT, () => {
    console.log(`Server started and listening to PORT: ${PORT}`)
});