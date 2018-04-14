require('dotenv').config();

const path = require('path');
const util = require('util');
const Song = require('./models').Song;
const utils = require('./utils');
const Koa = require('koa');
const Router = require('koa-router');
const limit = require('koa-limit');
const cors = require('koa-cors');

const app = new Koa();
const router = new Router();

const FRONTEND_URL = process.env.FRONTEND_URL;

router.get('/', async ctx => {
  const data = await Song.byTitle('');
  ctx.body = JSON.stringify({
    results: data,
  });
  ctx.type = 'application/json';
});

router.get('/artist/:artist', async ctx => {
  const artist = ctx.params.artist;
  utils.info(`Querying for artist "${artist}".`)
  const data = await Song.byArtist(artist);
  ctx.body = JSON.stringify({
    results: [data],
  });  
  ctx.type = 'application/json';
});

router.get('/title/:title', async ctx => {
  const title = ctx.params.title;
  utils.info(`Querying for title "${title}".`)
  const data = await Song.byTitle(title);
  ctx.body = JSON.stringify({
    results: data,
  });  
  ctx.type = 'application/json';
});

router.get('/album/:album', async ctx => {
  const album = ctx.params.album;
  utils.info(`Querying for album "${album}".`)
  const data = await Song.byAlbum(album);
  ctx.body = JSON.stringify({
    results: data,
  });
  ctx.type = 'application/json';
});

// x-response-time
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

// logger
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  if (ctx.status < 400) {
    utils.info(`${ctx.status} ${ctx.method} ${ctx.url} - ${ms}ms`);
  } else {
    utils.error(`${ctx.status} ${ctx.method} ${ctx.url} - ${ms}ms`);
  }
});

app
  .use(cors({
    origin: FRONTEND_URL,
  }))
  .use(limit({
    /* One query per second */
    limit: 5,
    interval: 5000, // ms,
    message: JSON.stringify({
      error: 'Throttled',
    })
  }))
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(process.env.PORT, process.env.HOST);

console.log(`Music server API listening at http:\/\/${process.env.HOST}:${process.env.PORT}.`);
