// Отдаём public как статическую папку для стилей, скриптов и загрузок
const express = require('express');
const app = express();
require('dotenv').config();
const path = require('path');
const port = process.env.PORT || 3000;

// Делаем папку uploads статичной
app.use(express.static(path.join(__dirname, 'public')));

// Инициализация таблицы админов
const { initAdmin } = require('./models/Admin');
initAdmin();

// Инициализация SQLite
const { init: initDb } = require('./models/Exhibit');
initDb();

// Настройка EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Подключаем маршруты админ-панели
const adminRoutes = require('./admin');
app.use('/admin', adminRoutes);

// Подключаем публичные маршруты
const publicRoutes = require('./routes');
app.use('/', publicRoutes);

app.listen(port, () => {
  console.log(`🚀 Сервер запущен! http://localhost:${port}`);
});