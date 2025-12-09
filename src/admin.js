// Маршруты для админ-панели
const express = require('express');
const session = require('express-session');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { checkAdmin } = require('./models/Admin');

// Настройка multer для загрузки изображений
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public/uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// Настройка сессий (лучше вынести в index.js, но для простоты здесь)
router.use(session({
  secret: 'museum_secret',
  resave: false,
  saveUninitialized: false
}));

// Middleware для защиты маршрутов
function requireAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.redirect('/admin/login');
}



// Страница входа
router.get('/login', (req, res) => {
  res.render('admin_login');
});
// Обработка входа
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  checkAdmin(username, password, (err, admin) => {
    if (admin) {
      req.session.admin = admin.username;
      res.redirect('/admin');
    } else {
      res.render('admin_login', { error: 'Неверный логин или пароль' });
    }
  });
});

// Выход
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});


// Импортируем модель экспоната
const { db } = require('./models/Exhibit');

// Главная страница админки: список экспонатов (требует авторизации)
router.get('/', requireAuth, (req, res) => {
  db.all('SELECT * FROM exhibits', [], (err, exhibits) => {
    if (err) return res.status(500).send('Ошибка БД');
    res.render('admin_list', { exhibits });
  });
});

// Форма добавления экспоната (требует авторизации)
router.get('/add', requireAuth, (req, res) => {
  res.render('admin_add');
});

// Обработка добавления экспоната (требует авторизации)
router.post('/add', requireAuth, upload.any(), (req, res) => {
  const { name, year, description } = req.body;
  let imagePath = '';
  let modelPath = '';

  const imageFile = (req.files || []).find(f => f.fieldname === 'image');
  const modelFile = (req.files || []).find(f => f.fieldname === 'model3d');

  if (imageFile) imagePath = '/uploads/' + imageFile.filename;
  if (modelFile) modelPath = '/uploads/' + modelFile.filename;

  db.run('INSERT INTO exhibits (name, year, description, image, model3d) VALUES (?, ?, ?, ?, ?)', [name, year, description, imagePath, modelPath], function(err) {
    if (err) return res.status(500).send('Ошибка при добавлении');
    res.redirect('/admin');
  });
});

// Форма редактирования экспоната (требует авторизации)
router.get('/edit/:id', requireAuth, (req, res) => {
  db.get('SELECT * FROM exhibits WHERE id = ?', [req.params.id], (err, exhibit) => {
    if (err || !exhibit) return res.status(404).send('Экспонат не найден');
    res.render('admin_edit', { exhibit });
  });
});

// Обработка редактирования экспоната (требует авторизации)
router.post('/edit/:id', requireAuth, upload.any(), (req, res) => {
  const { name, year, description } = req.body;
  db.get('SELECT * FROM exhibits WHERE id = ?', [req.params.id], (err, ex) => {
    if (err || !ex) return res.status(404).send('Экспонат не найден');
    let imagePath = ex.image;
    let modelPath = ex.model3d;
    const fs = require('fs');

    const imageFile = (req.files || []).find(f => f.fieldname === 'image');
    const modelFile = (req.files || []).find(f => f.fieldname === 'model3d');

    if (imageFile) {
      if (ex.image && ex.image.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, 'public', ex.image);
        fs.unlink(oldPath, err => {});
      }
      imagePath = '/uploads/' + imageFile.filename;
    }

    if (modelFile) {
      if (ex.model3d && ex.model3d.startsWith('/uploads/')) {
        const oldModel = path.join(__dirname, 'public', ex.model3d);
        fs.unlink(oldModel, err => {});
      }
      modelPath = '/uploads/' + modelFile.filename;
    }

    db.run('UPDATE exhibits SET name=?, year=?, description=?, image=?, model3d=? WHERE id=?', [name, year, description, imagePath, modelPath, req.params.id], function(err) {
      if (err) return res.status(500).send('Ошибка при обновлении');
      res.redirect('/admin');
    });
  });
});

// Удаление экспоната (требует авторизации)
router.get('/delete/:id', requireAuth, (req, res) => {
  db.run('DELETE FROM exhibits WHERE id=?', [req.params.id], function(err) {
    if (err) return res.status(500).send('Ошибка при удалении');
    res.redirect('/admin');
  });
});

module.exports = router;
