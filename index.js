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

const app = new Koa();
const router = new Router();

const stripFields = data => {
  return {
    title: data.title,
    artist: data.artist,
    album: data.album,
  };
}

router.get('/', async ctx => {
  const data = await models.library.find({}, { limit: 50 });
  ctx.body = JSON.stringify(data.map(song => stripFields(song)));
});

router.get('/artist/:artist', async ctx => {
  const artist = ctx.params.artist;
  utils.info(`Querying for artist "${artist}".`)
  const data = await models.library.findOne({
    artist,
  });
  ctx.body = JSON.stringify(stripFields(data));
});

router.get('/title/:title', async ctx => {
  const title = ctx.params.title;
  utils.info(`Querying for title "${title}".`)
  const data = await models.library.findOne({
    title,
  });
  ctx.body = JSON.stringify(stripFields(data));
});

router.get('/album/:album', async ctx => {
  const album = ctx.params.album;
  utils.info(`Querying for album "${album}".`)
  const data = await models.library.findOne({
    album,
  });
  ctx.body = JSON.stringify(stripFields(data));
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

const start = async () => {
  await parser.run();
  watcher();

  app
  .use(limit({
    /* One query per second */
    limit: 1,
    interval: 1000, // ms,
    message: JSON.stringify({
      error: 'Throttled',
    })
  }))
  .use(router.routes())
  .listen(process.env.HOST);

  console.log(`Music server API listening at http://${process.env.HOST}.`);
}

start();