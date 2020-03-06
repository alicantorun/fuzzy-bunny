
// imports
const sqlite3 = require('sqlite3');
const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('chromedriver').path;
const crawler = require('./crawler')
const config = require('./config')
const query = require('./db/query');
// build service
const service = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);
// instantiate driver
const driver = new webdriver.Builder()
  .withCapabilities(webdriver.Capabilities.chrome())
  .build();
// starting point
let startingPoint
// connect/create to/the DB
const db = new sqlite3.Database(config.db.URL, (err) => {
  if (err) return console.error(err.message);
  console.log('Connected to the database.');
});

// use producers count to set starting point
db.all(query.GET_PRODUCERS_COUNT, [], (err, rows) => {
  if (err) return console.error(err);
  startingPoint = parseInt(rows[0].count);
  // create tables if not exist
  db.parallelize(() => {
    db.run(query.CREATE_PRODUCERS, (err) => {
      if (err) return console.error(err.message);
    })
    db.run(query.CREATE_BRANDS, err => {
      if (err) return console.error(err.message);
    })
  });
  run()
});

function run() {
  crawler(
    config.timeout,
    config.URL,
    config.country,
    db,
    startingPoint,
    driver
  )
}
