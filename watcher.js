const fs = require('fs');
const parser = require('./parser');
const utils = require('./utils');

const dir = process.env.MUSIC_DIRECTORY;

const run = () => {
  fs.watch(dir, { recursive: true }, function (event, filename) {
    if (filename) {
        const fullPath = `${dir}/${filename}`;
        if (fs.existsSync(fullPath)) {
          utils.info('File created or modified.');
        } else {
          utils.info('File removed.');
        }
  
        const parts = filename.split('/');
        const depth = parts.length - 1;
  
        if (depth === 0) {
          utils.info(`Refreshing artist directory "${fullPath}"...`);
          parser.traverseArtistDir(fullPath);
        } else if (depth === 1) {
          utils.info(`Refreshing album directory "${fullPath}"...`);
          parser.traverseAlbumDir(fullPath);
        } else if (depth === 2) {
          utils.info(`Refreshing song "${fullPath}"...`);
          parser.parseSong(fullPath);
        }
  
    } else {
        utils.error('Filename not provided. Cannot parse path!');
    }
  });
}

module.exports = run;