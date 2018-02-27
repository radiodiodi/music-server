require('dotenv').config();

const fs = require('fs');
const path = require('path');
const util = require('util');
const models = require('./models');
const Koa = require('koa');
const Router = require('koa-router');
const limit = require('koa-limit');
var mm = require('musicmetadata');

const app = new Koa();
const router = new Router();


const dir = process.env.MUSIC_DIRECTORY;

const saveMetadataToCollection = async (data, pathToFile) => {
  const query = {
    title: data.title,
    album: data.album,
  };

  const { albumartist, ...value } = 
  await models.library.update(query, {
    ...data,
    filePath: pathToFile,
  }, { upsert: true });
}

const parseAndSaveMetadata = async p => {
  const existing = await models.library.findOne({ filePath: p });
  if (existing) {
    console.log(`File "${p}" already in DB. Skipping...`);
    return;
  }

  const parser = mm(fs.createReadStream(p), (err, metadata) => {
    console.log(`Parsing data from: ${p}`)
    if (err) {
      console.log(`Error parsing file ${p}. Skipping...`);
      return;
    }
    
    const { albumartist, ...withoutAlbumArtist } = metadata;
    const data = { 
      ...withoutAlbumArtist,
      artist: [].concat(metadata.artist || [], metadata.albumartist || []),
    };
  
    saveMetadataToCollection(data, p);
  });
}

const parseSong = async song => {
  if (!fs.lstatSync(song).isFile()) {
    console.log(`Not a file: ${song}. Skipping...`);
    return;
  }

  parseAndSaveMetadata(`${song}`);
}

const traverseAlbumDir = async dir => {
  if (!fs.lstatSync(dir).isDirectory()) {
    console.log(`Not a directory: ${dir}. Skipping...`);
    return;
  }

  const songs = fs.readdirSync(dir).map(d => `${dir}/${d}`);

  for (song of songs) {
    parseSong(song);
  }
}

const traverseArtistDir = async dir => {
  if (!fs.lstatSync(dir).isDirectory()) {
    console.log(`Not a directory: ${dir}. Skipping...`);
    return;
  }

  const albumDirs = fs.readdirSync(dir).map(d => `${dir}/${d}`);

  for (albumDir of albumDirs) {
    traverseAlbumDir(albumDir);
  }
}

const traverseDirectoryAndSave = async p => {
  if (!fs.lstatSync(p).isDirectory()) {
    throw new Error(`Not a directory: ${p}`);
  }

  try {
    const artistDirs = fs.readdirSync(p).map(d => `${p}/${d}`);

    for (artistDir of artistDirs) {
      traverseArtistDir(artistDir);
    }
    
  } catch (err) {
    console.log('Error traversing directory.')
    console.log(err);
  }
};

traverseDirectoryAndSave(dir);


fs.watch(dir, { recursive: true }, function (event, filename) {
  if (filename) {
      console.log('filename provided: ' + filename);
      const fullPath = `${dir}/${filename}`;
      if (fs.existsSync(fullPath)) {
        console.log('file created or modified.');
      } else {
        console.log('file removed.');
      }

      const parts = filename.split('/');
      const depth = parts.length - 1;

      if (depth === 0) {
        console.log(`Refreshing artist directory "${fullPath}"...`);
        traverseArtistDir(fullPath);
      } else if (depth === 1) {
        console.log(`Refreshing album directory "${fullPath}"...`);
        traverseAlbumDir(fullPath);
      } else if (depth === 2) {
        console.log(`Refreshing song "${fullPath}"...`);
        parseSong(fullPath);
      }

  } else {
      console.log('filename not provided');
  }
});

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
  console.log(`Querying for artist "${artist}".`)
  const data = await models.library.findOne({
    artist,
  });
  ctx.body = JSON.stringify(stripFields(data));
});

router.get('/title/:title', async ctx => {
  const title = ctx.params.title;
  console.log(`Querying for title "${title}".`)
  const data = await models.library.findOne({
    title,
  });
  ctx.body = JSON.stringify(stripFields(data));
});

router.get('/album/:album', async ctx => {
  const album = ctx.params.album;
  console.log(`Querying for album "${album}".`)
  const data = await models.library.findOne({
    album,
  });
  ctx.body = JSON.stringify(stripFields(data));
});

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
  .listen(8888);