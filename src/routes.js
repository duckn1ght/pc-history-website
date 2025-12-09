// Главные маршруты публичных страниц для Музея ПК
const express = require('express');
const router = express.Router();
const { db } = require('./models/Exhibit');


const path = require('path');

// Главная страница
router.get('/', (req, res) => {
  res.render('index');
});

// Список экспонатов
router.get('/exhibits', (req, res) => {
  db.all('SELECT * FROM exhibits', [], (err, exhibits) => {
    if (err) return res.status(500).send('Ошибка БД');
    res.render('exhibits', { exhibits });
  });
});

// Страница отдельного экспоната
router.get('/exhibits/:id', (req, res) => {
  db.get('SELECT * FROM exhibits WHERE id = ?', [req.params.id], (err, exhibit) => {
    if (err || !exhibit) return res.status(404).send('Экспонат не найден');
    res.render('exhibit', { exhibit });
  });
});

// Отдельный экран для 3D просмотра
router.get('/exhibits/:id/3d', (req, res) => {
  db.get('SELECT * FROM exhibits WHERE id = ?', [req.params.id], (err, exhibit) => {
    if (err || !exhibit) return res.status(404).send('Экспонат не найден');
    if (!exhibit.model3d) return res.redirect('/exhibits/' + req.params.id);
    res.render('exhibit_3d', { exhibit });
  });
});

// О музее
router.get('/about', (req, res) => {
  res.render('about');
});

// Контакты
router.get('/contacts', (req, res) => {
  res.render('contacts');
});

module.exports = router;
