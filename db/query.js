
const table = {
  producers: 'producers',
  brands: 'brands'
}

const CREATE_PRODUCERS = `
CREATE TABLE IF NOT EXISTS ${table.producers} (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT,
  date_of_registration TEXT,
  register_number TEXT NOT NULL UNIQUE,
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
);`

const GET_PRODUCERS_COUNT = `SELECT COUNT(id) AS count FROM ${table.producers};`

const CREATE_BRANDS = `
CREATE TABLE IF NOT EXISTS ${table.brands} (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_name TEXT,
  date_of_registration TEXT,
  end_date TEXT,
  producer_id INTEGER NOT NULL,
  created_at TEXT,
  updated_at TEXT
);`

module.exports = {
  table,
  CREATE_PRODUCERS,
  CREATE_BRANDS,
  GET_PRODUCERS_COUNT
}
