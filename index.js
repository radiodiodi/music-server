require('dotenv').config();

const path = require('path');
const util = require('util');
const models = require('./models');
const parser = require('./parser');
const watcher = require('./watcher');
const utils = require('./utils');
const Koa = require('koa');
const Router = require('koa-router');
const limit = require('koa-limit');
const cors = require('koa-cors');

const app = new Koa();
const router = new Router();

const FRONTEND_URL = process.env.FRONTEND_URL;

const stripFields = data => {
  return {
    title: data.title,
    artist: data.artist,
    album: data.album,
  };
}

router.get('/', async ctx => {
  const data = await models.library.find({}, { limit: 50 });
  ctx.body = JSON.stringify({
    results: data.map(song => stripFields(song))
  });
  ctx.type = 'application/json';
});

router.get('/artist/:artist', async ctx => {
  const artist = ctx.params.artist;
  utils.info(`Querying for artist "${artist}".`)
  const data = await models.library.find({
    artist: new RegExp(artist, 'i')
  }, { limit: 50 });
  ctx.body = JSON.stringify({
    results: data.map(song => stripFields(song))
  });  
  ctx.type = 'application/json';
});

router.get('/title/:title', async ctx => {
  const title = ctx.params.title;
  utils.info(`Querying for title "${title}".`)
  const data = await models.library.find({
    title: new RegExp(title, 'i')
  }, { limit: 50 });
  ctx.body = JSON.stringify({
    results: data.map(song => stripFields(song))
  });  
  ctx.type = 'application/json';
});

router.get('/album/:album', async ctx => {
  const album = ctx.params.album;
  utils.info(`Querying for album "${album}".`)
  const data = await models.library.find({
    album: new RegExp(album, 'i'),
  }, { limit: 50 });
  ctx.body = JSON.stringify({
    results: data.map(song => stripFields(song))
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

parser.run();
watcher();

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
