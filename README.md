# Anime Matchmaker 💖

A personalized anime recommender connecting you to shows you'll love through tailored suggestions.

## Overview

Anime Matchmaker is a web application that helps users discover new anime based on their mood, watch history, and personal preferences. The app suggests anime titles tailored to each user's taste by leveraging AI-powered recommendations.

Client-side code can be found here: [https://github.com/dpurkays/anime-matchmaker](https://github.com/dpurkays/anime-matchmaker) 

### Problem Space

Finding the right anime can be overwhelming due to the large volume of anime. While most recommendations rely on basic genre filtering, google searches or even just watching the latest hottest anime, leaving many undiscovered.

### User Profile

- **Anime Enthusiasts:** Users who would want better recommendations beyond simple genre-based filtering
- **Casual Viewers:** Users looking for animes that match their mood, whether it's action-packed, romcom, or wholesome romance.
- **New to Anime**: Users who are unfamiliar with anime and need guidance based on their favorite movies or TV shows.

### Features

- **Mood-Based Anime Search:** Users select a mood (e.g. "Chill & Relaxing", "High-Energy Action Packed") to get anime suggestions.
- **AI-powered recommendations:** Uses Gemini AI to analyse a user's watch list history and suggest relevant anime suggestions.

  > _Note: "Watch list history" refers to the user’s public favorites or watch history list visible on their MyAnimeList profile._

- **Movie/TV show-based recommendations:** New users can enter a favorite Movie or TV show, and the app suggests similar anime.

## Getting Started

To run this project locally, follow these steps:

1. Clone this repo and client-side repo: [Anime Matchmaker Client Repo](https://github.com/dpurkays/anime-matchmaker)

Do the following in both folders (anime-matchmaker and anime-matchmaker-server):

2. Install dependencies and create env

   i. npm install

   ii. Create an `env` file. Look at `.sample.env` for details on what env variables you'll need

3. Run the app by doing `npm run dev`

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
  - Gemini API is used to generate anime recommendations based on natural language input such as a user’s favorites/watch-history list, or favorite tv shows/movies.
- Jikan API - https://docs.api.jikan.moe/
  - unofficial API for MyAnimeList (MAL)

### Sitemap

- **Home Page:** Entry point with options to search anime by mood, based on TV show/movie, based on the user's watch history or season's hottest.
  - Recommendations Selection
    - **Mood-Based Search:** Users select a mood and genre to get anime recommendations
      - **Anime Details Page**
    - **Based TV series or Movie:** Users input a TV show or movie to get similar animes.
      - **Anime Details Page**
    - **Based on MAL user:** Users get recommendations based on their MAL favorites or watch history.
      - **Anime Details Page**
    - **Season's Hottest Anime:** Users get the most popular anime from the current season.
      - **Anime Details Page**
- **Anime Details Page:** Displays anime metadata such as title, genre, synopsis, trailer and other metadata.
- **Not Found Page:** For non existing pages.

### Data

**data/moods.json** ➡️ stores general moods and genres.

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

#### **GET api/moods/**

- Gets all moods
- Will return 500 for error retrieving moods
- If successful, returns a 200 status code

**Response Body Example**

```
[
  {
      "id": 1,
      "name": "Chill & Relaxed",
      "color": "#4fc3f7",
      "emoji": "🌴",
      "description": "Calm and peaceful anime that bring a sense of relaxation."
  },
  ...
]
```

#### **GET api/moods/:id/genres**

- Gets all genres based on mood
- Will return 404 if mood doesn't exist
- Will return 500 for error retrieving genres
- If successful, returns a 200 status code

**Response Body Example**

```
{
  "genres": [
      {
          "id": 1,
          "name": "Slice of Life",
          "description": "Everyday life stories with a calming pace.",
          "jikan_genre_ids": [
              36
          ]
      },
  ...
  ]
}
```

#### **GET api/moods/:id/genres/:id**

- Gets one genre based on mood
- Will return 404 if mood doesn't exist
- Will return 404 if genre doesn't exist
- Will return 500 for error retrieving genre
- If successful, returns a 200 status code

**Response Body Example**

```
{
  "genres": [
      {
          "id": 1,
          "name": "Slice of Life",
          "description": "Everyday life stories with a calming pace.",
          "jikan_genre_ids": [
              36
          ]
      },
  ...
  ]
}
```

#### **GET api/recommendations/anime-mood/:genreIds**

- Gets animes based on selected genre(s)
  - Can have multiple genre ids separated by a comma
- Will return 404 if genre doesn't exist
- Will return 500 for error retrieving animes
- If successful, returns a 200 status code

**Sample Call:** http://localhost:5050/api/recommendations/mood/22,74

**Response Body Example**

```
[
    {
        "mal_id": 42361,
        "image": "https://cdn.myanimelist.net/images/anime/1900/110097.jpg",
        "rating": "PG-13",
        "title_english": "Don't Toy with Me, Miss Nagatoro",
        "year": 2021
    },
    ...
]
```

#### **GET api/recommendations/tv**

- Gets animes based on tv series or movies
- A query is required.
- Will return 400 if there are no query parameters
- Will return 500 for error retrieving animes
- If successful, returns a 200 status code

**Sample Call:** http://localhost:5050/api/recommendations/tv?tvShow=The%20Matrix

**Response Body Example**

```
[
      {
        "mal_id": 790,
        "image": "https://cdn.myanimelist.net/images/anime/1183/136187.jpg",
        "rating": "17+",
        "title_english": "Ergo Proxy",
        "year": 2006,
        "similarity_reason": "This is recommended because it deals with existential questions, a dystopian future, artificial intelligence, and questioning reality, sharing the dark and philosophical atmosphere of 'The Matrix'."
    },
    ...
]
```

#### **GET api/recommendations/mal/:username**

- Gets animes based on the user's MAL favorite list or watch list
- A query is required.
- Will return 404 if the MAL username doesn't exist or if there are no animes in their favorite or watch list.
- Will return 500 for error retrieving animes
- If successful, returns a 200 status code

**Response Body Example**

```
[
    {
        "mal_id": 35968,
        "image": "https://cdn.myanimelist.net/images/anime/1864/93518.jpg",
        "rating": "PG-13",
        "title_english": "Wotakoi: Love is Hard for Otaku",
        "year": 2018,
        "similarity_reason": "Shares the romance and workplace setting aspects of *Kaichou wa Maid-sama!* and *Horimiya*, with a focus on relatable adult characters."
    },
    ...
]
```

#### **GET api/recommendations/clear-cache**

- Clear cached data

**Response Body Example**

```
{
    "message": "✅ Cache cleared successfully."
}
```

#### **GET api/anime/seasons/hottest**

- Gets seasons' hottest animes
- Will return 500 for error retrieving animes
- If successful, returns a 200 status code

**Response Body Example**

```
[
    {
        "mal_id": 58567,
        "image": "https://cdn.myanimelist.net/images/anime/1448/147351l.jpg",
        "rating": "17+",
        "title_english": "Solo Leveling Season 2: Arise from the Shadow",
        "year": 2025
    },
    ...
]
```

#### **GET api/recommendations/anime/:animeId**

- Gets information about one anime
- Will return 404 if anime with animeId is not found.
- Will return 500 for error retrieving the anime
- If successful, returns a 200 status code

**Response Body Example**

```
{
    "mal_id": 490,
    "image": "https://cdn.myanimelist.net/images/anime/1581/138842.jpg",
    "rating": "PG-13 - Teens 13 or older",
    "title_english": "Pani Poni Dash!",
    "title_japanese": "ぱにぽにだっしゅ！",
    "type": "TV",
    "episodes": 26,
    "duration": "24 min",
    "favorites": 459,
    "synopsis": "The girls of Momotsuki Academy's Class 1-C are starting their tenth-grade year with a brand-new instructor. The good news? The teacher is an MIT grad. The bad news? She's only 11 years old! So, while Becky Miyamoto may be an intellectual titan, this child prodigy is painfully ill-equipped to deal with the group of temperamental teens—and idiotic aliens—that await her instructions!\n\n(Source: Funimation)",
    "genres": [
        {
            "mal_id": 4,
            "type": "anime",
            "name": "Comedy",
            "url": "https://myanimelist.net/anime/genre/4/Comedy"
        }
    ],
    "themes": [
        {
            "mal_id": 57,
            "type": "anime",
            "name": "Gag Humor",
            "url": "https://myanimelist.net/anime/genre/57/Gag_Humor"
        },
        {
            "mal_id": 20,
            "type": "anime",
            "name": "Parody",
            "url": "https://myanimelist.net/anime/genre/20/Parody"
        },
        {
            "mal_id": 23,
            "type": "anime",
            "name": "School",
            "url": "https://myanimelist.net/anime/genre/23/School"
        }
    ],
    "status": "Completed",
    "studio": "Shaft",
    "year": 2005,
    "aired": "Jul 4, 2005 to Dec 26, 2005",
    "youtube_id": "onlEbMVWRF0"
}
```

## Roadmap

### Week 1

- Setup backend infrastructure (Node, Express)
- Research and integrate APIs
- Implement core API endpoints
- Implement the basic UI structures
  - Home Page
  - Mood based search
- Fetching data from API

### Week 2

- Anime Details Page
- Implement AI-powered recommendations using Gemini API
- Final testing and bug fixes

## Future Implementation

- Manga Recommendations
  - extend the app to suggest mangas
- Experiment with AniList API for more generous rate limits
- Use Official MyAnimeList API so users can bookmark animes to their watch list directly from Anime Matchmaker
