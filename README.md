# Music Server API

## Installation

Install mongodb locally or start one with docker.
````
docker-compose up mongodb
````

Install node dependencies with yarn.

```
yarn install
```

Configure the project with `.env`. Note: The FRONTEND_URL is there to add CORS headers.

## Running

Your music library has to have this structure.

```
root
  - artist
    - album
      - song1.mp3
      - song2.mp3
```

Specify the path to the root in `.env`.

Run with `yarn start` for development. Use `pm2` for production.

## API

All endpoints respond with an array of JSON objects with this structure. Queries are limited to a max of 50 results.

```
{
  title: <string>,
  artist: [<string>],
  album: <string>
}
```

### Endpoints

```
/
```

Get song records from the database. Pretty useless.

```
/title/:query
```

Get songs with title `query`. Fuzzy search. 

```
/artist/:query
```

Get songs with artist or album artist `query`. Fuzzy search.

```
/album/:query
```

Get songs with album `query`. Fuzzy search. 