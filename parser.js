require('dotenv').config();
const mm = require('musicmetadata');
const fs = require('fs');

const models = require('./models');
const utils = require('./utils');

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
    return;
  }

  const parser = mm(fs.createReadStream(p), async (err, metadata) => {
    utils.info(`Parsing data from: ${p}`)
    if (err) {
      utils.warning(`Error parsing file ${p}. Skipping...`);
      return;
    }
    
    const { albumartist, ...withoutAlbumArtist } = metadata;

    const artist = metadata.artist === metadata.albumartist 
      ? metadata.artist
      : [].concat(metadata.artist || [], metadata.albumartist || []);

    const data = { 
      ...withoutAlbumArtist,
      artist,
    };
  
    saveMetadataToCollection(data, p);
  });
}

const parseSong = async song => {
  if (!fs.lstatSync(song).isFile()) {
    utils.warning(`Not a file: ${song}. Skipping...`);
    return;
  }

  parseAndSaveMetadata(`${song}`);
}

const traverseAlbumDir = async dir => {
  if (!fs.lstatSync(dir).isDirectory()) {
    utils.warning(`Not a directory: ${dir}. Skipping...`);
    return;
  }

  const songs = fs.readdirSync(dir).map(d => `${dir}/${d}`);

  for (song of songs) {
    parseSong(song);
  }
}

const traverseArtistDir = async dir => {
  if (!fs.lstatSync(dir).isDirectory()) {
    utils.warning(`Not a directory: ${dir}. Skipping...`);
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
    utils.error('Error traversing directory.')
    utils.error(err);
  }
};

const run = async () => {
  await traverseDirectoryAndSave(dir);
}

module.exports = {
  run,
  traverseAlbumDir,
  traverseArtistDir,
  parseSong,
};