const monk = require('monk');

const mongo_db = `${process.env.MONGODB_HOST}/${process.env.MONGODB_DB}`;
console.log(`MongoDB DB: ${mongo_db}`);
const db = monk(mongo_db);
const library = db.get('library');

library.ensureIndex({
  title: 1,
  artist: 1,
  album: 1,
  filePath: 1,
});

module.exports = {
  library,
};