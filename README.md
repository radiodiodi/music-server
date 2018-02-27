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