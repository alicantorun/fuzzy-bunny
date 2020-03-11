const table = {
  producers: "producers"
};

const CREATE_PRODUCERS = `
CREATE TABLE IF NOT EXISTS ${table.producers} (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT,
  date_of_registration TEXT,
  register_number TEXT NOT,
  postal_code TEXT,
  city TEXT,
  country TEXT,
  phone TEXT,
  street TEXT,
  fax TEXT,
  address_addition TEXT,
  email TEXT,
  created_at TEXT,
  updated_at TEXT
);`;

const GET_PRODUCERS_COUNT = `SELECT COUNT(id) AS count FROM ${table.producers};`;

module.exports = {
  table,
  CREATE_PRODUCERS,
  GET_PRODUCERS_COUNT
};
