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
- **Users Watch List & History:** Tracks what the users have watched or what they plan on watching

## Implementation

### Tech Stack

- React
- Node
- MySQL
- Client Libraries:
  - react
  - react-router
  - axios
  - Material UI
- Server Libraries:
  - knex
  - express
  - bcrypt
  - dotenv
  - uuid

### APIs

- Gemini API - https://ai.google.dev/api?lang=node
- Jikan API - https://docs.api.jikan.moe/

### Sitemap

- **Home Page:** Entry point with options to search anime by mood, AI input
  - **Mood Based Search:** Users selects a mood and AI generated recommendations appears
  - **AI powered Search:** Users enter a desscription
- **Anime Details Page:** Displays anime metadata such as Title, genre, synopsis,
- **User Profile:** shows users watch history and watch list

### Data

| Table Name    | Columns                           |
| ------------- | --------------------------------- |
| users         | id, email, password, created_at   |
| anime         | id, title, genre, synopsis, image |
| watch_history | id, user_id (fk), anime_id (fk)   |
| watch_list    | id, user_id (fk), anime_id (fk)   |

### Endpoints

**GET :id/watch-list**

- Gets users' watch list

example request: `GET /1/watch-list`

- response 404 if user id is not found
- response 200 if successful

example response:

```
[
    {
      "anime_id": e3a45678-12d3-4f56-b789-0a12b3c4d5e6,
      "title": "One Punch Man",
      "image_url": "https://cdn.myanimelist.net/images/anime/12/76049.jpg"
    },
    {
      "anime_id": 9f1c2b34-5678-4abc-def0-123456789abc,
      "title": "Naruto",
      "image_url": "https://cdn.myanimelist.net/images/anime/1141/142503.jpg"
    }
]
```

**GET :id/watch-history**

- Gets users' watch history

example request: `GET /1/watch-history`

- response 404 if user id is not found
- response 200 if successful

example response:

```
[
    {
      "anime_id": a12b3c4d-5e6f-7g89-0123-4h5i6789j0kl,
      "title": "Shinseiki Evangelion",
      "image_url": "https://cdn.myanimelist.net/images/anime/1314/108941.jpg"
    },
    {
      "anime_id": 5d4c3b2a-1e0f-9876-5432-1a2b3c4d5e6f,
      "title": "Cowboy Bebop",
      "image_url": "https://cdn.myanimelist.net/images/anime/4/19644.jpg"
    }
]
```

**POST :id/watch-list**

- add anime to watch list
  - list that the user would like to watch

example request: `POST /1/watch-list`

- response 400 if unsuccessful
- response 201 if successful

```
{
    "anime_id": 789abc12-34de-567f-8901-23456789abcd,
    "title": "Witch Hunter Robin",
    "image_url": "https://cdn.myanimelist.net/images/anime/10/19969.jpg"
}
```

**POST :id/watch-history**

- add anime to watch history
  - list where users already watched the anime

example request: `POST /1/watch-history`

- response 400 if unsuccessful
- response 201 if successful

```
{
    "anime_id": b7c9d2e4-1f34-4a67-9b80-2c5d6e7f8a91,
    "title": "Jing: King of Bandits - Seventh Heaven",
    "image_url": "https://cdn.myanimelist.net/images/anime/1325/94741.jpg"
}
```

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
