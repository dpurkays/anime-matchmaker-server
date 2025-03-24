# Anime Matchmaker 💖

## Overview

Anime Matchmaker is a web application that helps users discover new anime based on their mood, watch history and personalized preference. By leveraging AI-powered recommendations. the app suggests anime titles tailored to each user's taste.

### Problem Space

Finding the right anime can be overwhelming due to the large volume of anime. While most recommendations rely on basic genre filtering, google searches or even just watching the latest hotest anime, leaving many undiscovered.

### User Profile

- **Anime Enthusiasts:** Users who would want better recommendations beyond simple genre-based filtering
- **Casual Viewers:** Users looking for animes that matches their mood, whether its action-packed, romcom, or wholesome romance.
- **New to Anime**: Users who are unfamiliar to anime and need guidance based on their favorite movies or tv shows.

### Features

- **Mood-Based Anime Search:** Users select a mood (e.g. "Chill & Relaxing", "High-Energy Action Packed") to get anime suggestions.
- **AI powered recommendations:** Uses Gemini AI to analyse a user's watch list history and suggest relevant anime suggestions.
- **Movie/TV show-based recommendations:** New users can enter a favorite Movie or TV show, and the app suggests similar anime.

## Implementation

### Tech Stack

- React
- Sass
- Node
- Client Libraries:
  - react
  - react-router
  - react-spinners
  - react-scroll
  - axios
- Server Libraries:
  - express
  - dotenv
  - axios
  - node-cache
  - bottleneck

### APIs

- Gemini API - https://ai.google.dev/api?lang=node
- Jikan API - https://docs.api.jikan.moe/
  - unofficial api for MyAnimeList (MAL)

### Sitemap

- **Home Page:** Entry point with options to search anime by mood, based on TV show/movie, based on user's watch history or season's hottest.
  - Recommendations Selection
    - **Mood Based Search:** Users selects a mood and genre to get anime recommendations
      - **Anime Details Page**
    - **Based TV series or Movie:** User inputs a TV show or movie to get similar animes.
      - **Anime Details Page**
    - **Based on MAL user:** User gets recommendations based on their MAL's favorites or watch history.
      - **Anime Details Page**
    - **Season's Hottest Anime:** User gets the most popular anime from the current season.
      - **Anime Details Page**
- **Anime Details Page:** Displays anime metadata such as title, genre, synopsis, trailer and other metadata.
- **Not Found Page:** For non existing pages.

### Data

**data/moods.json**

- stores general moods and genres.

```
[
  {
    "id": 1,
    "name": "Chill & Relaxed",
    "color": "#4fc3f7",
    "emoji": "🌴",
    "description": "Calm and peaceful anime that bring a sense of relaxation.",
    "genres": [
      { "id": 1, "name": "Slice of Life", "description": "Everyday life stories with a calming pace.", "jikan_genre_ids": [36] },
      { "id": 2, "name": "Romance", "description": "Sweet love stories filled with warmth.", "jikan_genre_ids": [22, 74] },
      { "id": 3, "name": "Iyashikei", "description": "Soothing, healing anime that bring comfort.", "jikan_genre_ids": [63] }
    ]
  },
  ...
]
```

### Endpoints

## Roadmap

### Week 1

- Setup backend infrastructure (Node, Express, MySQL)
- Research and intergrate APIs
- Implement core API endpoints
- Implement the basic UI structures
  - Home Page
  - Mood based search
- Fetching data from API

### Week 2

- Anime Details Page
- User Profile page
- Implement AI powered reecommentation using Gemini API
- Final testing and bug fixes

## Future Implementation

- Manga Recommendations
  - extend the app to suggest mangas
- JWT login
