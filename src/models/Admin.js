// Модель администратора для SQLite
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../data/pcmuseum.sqlite');
const db = new sqlite3.Database(dbPath);


// Создание таблицы админов, если не существует, и создание дефолтного админа
const initAdmin = () => {
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`, () => {
    // Проверяем, есть ли админ
    db.get('SELECT * FROM admins WHERE username = ?', ['admin'], (err, row) => {
      if (!row) {
        // Если нет, создаём дефолтного админа: admin/admin
        bcrypt.hash('admin', 10, (err, hash) => {
          if (!err) {
            db.run('INSERT INTO admins (username, password) VALUES (?, ?)', ['admin', hash]);
            console.log('Создан дефолтный админ: admin/admin');
          }
        });
      }
    });
  });
};

// Проверить логин и пароль
const checkAdmin = (username, password, cb) => {
  db.get('SELECT * FROM admins WHERE username = ?', [username], (err, admin) => {
    if (err || !admin) return cb(null, false);
    bcrypt.compare(password, admin.password, (err, res) => {
      cb(err, res ? admin : false);
    });
  });
};

module.exports = { db, initAdmin, checkAdmin };
