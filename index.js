// imports
const sqlite3 = require("sqlite3");
const crawler = require("./crawler");
const config = require("./config");
const query = require("./db/query");

// starting point
let startingPoint;
const db = new sqlite3.Database(config.db.URL, err => {
  if (err) return console.error(err.message);
  console.log("Connected to the database.");
});

// use producers count to set starting point
db.all(query.GET_PRODUCERS_COUNT, [], (err, rows) => {
  if (err) return console.error(err);
  startingPoint = parseInt(rows[0].count);
  // create tables if not exist
  db.parallelize(() => {
    db.run(query.CREATE_PRODUCERS, err => {
      if (err) return console.error(err.message);
    });
  });
  run();
});

function run() {
  crawler(config.URL, db, startingPoint);
}
