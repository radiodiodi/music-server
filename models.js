const mysql = require('promise-mysql');
const utils = require('./utils');

const connect = async () => {
  return await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
  });
}

const initialize = async () => {
  const connection = await connect();
  utils.info('DB connection test OK.');

  try {
    const { results, fields } = await connection.query('CREATE TABLE IF NOT EXISTS songs (id MEDIUMINT NOT NULL AUTO_INCREMENT, title VARCHAR(255), artist VARCHAR(255), album VARCHAR(255), PRIMARY KEY (id))');
    utils.info('Table "songs" OK.');
  } catch (error) {
    throw error;
  }

  try {
    const { results, fields } = await connection.query('SELECT 1 + 1 FROM songs');
    utils.info('Query test OK.');
  } catch (error) {
    throw error;
  }
  
  connection.end();
}

initialize();

class Song {

  /**
   * Get song by title.
   * @param {String} value 
   */
  static async byTitle(value) {
    const conn = await connect();
    try {
      const results = await conn.query('SELECT title, artist, album FROM songs WHERE title LIKE ? LIMIT 50', `%${value}%`);
      return results.map(r => ({
        title: r.title,
        artist: [ r.artist ],
        album: r.album,
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get song by artist.
   * @param {String} value 
   */
  static async byArtist(value) {
    const conn = await connect();
    try {
      const results = await conn.query('SELECT title, artist, album FROM songs WHERE artist LIKE ? LIMIT 50', `%${value}%`);
      return results.map(r => ({
        title: r.title,
        artist: [ r.artist ],
        album: r.album,
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get song by album.
   * @param {String} value 
   */
  static async byAlbum(value) {
    const conn = await connect();
    try {
      const results = await conn.query('SELECT title, artist, album FROM songs WHERE album LIKE ? LIMIT 50', `%${value}%`);
      return results.map(r => ({
        title: r.title,
        artist: [ r.artist ],
        album: r.album,
      }));
    } catch (error) {
      throw error;
    }
  }
}

module.exports = {
  Song,
}