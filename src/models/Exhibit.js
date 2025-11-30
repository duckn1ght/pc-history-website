// Модель экспоната для музея ПК (SQLite)
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/pcmuseum.sqlite');
const db = new sqlite3.Database(dbPath);

// Создание таблицы экспонатов, если не существует
const init = () => {
  db.run(`CREATE TABLE IF NOT EXISTS exhibits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    year INTEGER,
    description TEXT,
    image TEXT
  )`);
};

module.exports = { db, init };