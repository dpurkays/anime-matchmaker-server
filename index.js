import cors from "cors";
import "dotenv/config";
import express from "express";
import moodsRoutes from "./routes/moods.js";

const app = express();
const PORT = process.env.PORT || 5050;

app.use(express.json());
app.use(cors());

app.use("/api/moods", moodsRoutes);

app.listen(PORT, () => {
    console.log(`Server started and listening to PORT: ${PORT}`)
});