// Express + SQLite backend for Responsive Library Inventory App
// Persists data in server/library.db (created/seeded on first run)
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'library.db');
const PORT = process.env.PORT || 4000;

if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

const db = new Database(DB_PATH);

// Initialize schema and seed data if empty
db.exec(`
CREATE TABLE IF NOT EXISTS auth_users (
  email TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS authors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT UNIQUE,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  location TEXT NOT NULL,
  barcode TEXT UNIQUE NOT NULL,
  synopsis TEXT DEFAULT '',
  coverUrl TEXT,
  loanCount INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL,
  sanctions INTEGER DEFAULT 0,
  activeLoans INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bookId INTEGER NOT NULL,
  bookTitle TEXT NOT NULL,
  userId INTEGER NOT NULL,
  userName TEXT NOT NULL,
  loanDate TEXT NOT NULL,
  dueDate TEXT NOT NULL,
  returnDate TEXT,
  status TEXT NOT NULL
);
`);

const hasData = db.prepare('SELECT COUNT(*) as c FROM books').get().c > 0;
if (!hasData) {
  const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
  ['Literatura', 'Historia', 'Ciencia Ficcion', 'Infantil', 'Clasicos'].forEach(c => insertCat.run(c));

  const insertAuthor = db.prepare('INSERT OR IGNORE INTO authors (name) VALUES (?)');
  ['Gabriel Garcia Marquez', 'Yuval Noah Harari', 'Miguel de Cervantes', 'George Orwell'].forEach(a => insertAuthor.run(a));

  const insertLocation = db.prepare('INSERT OR IGNORE INTO locations (name) VALUES (?)');
  ['Estante A-1', 'Estante A-2', 'Estante B-1', 'Estante C-1', 'Estante D-1'].forEach(l => insertLocation.run(l));

  const insertBook = db.prepare(`
    INSERT INTO books (title, author, isbn, category, status, location, barcode, synopsis, coverUrl, loanCount)
    VALUES (@title, @author, @isbn, @category, @status, @location, @barcode, @synopsis, @coverUrl, @loanCount)
  `);
  insertBook.run({
    title: 'Cien anos de soledad',
    author: 'Gabriel Garcia Marquez',
    isbn: '978-0307474728',
    category: 'Literatura',
    status: 'disponible',
    location: 'Estante A-1',
    barcode: 'LIB001',
    synopsis: 'Historia de la familia Buendia en Macondo.',
    coverUrl: null,
    loanCount: 45,
  });
  insertBook.run({
    title: 'Sapiens: De animales a dioses',
    author: 'Yuval Noah Harari',
    isbn: '978-0062316097',
    category: 'Historia',
    status: 'prestado',
    location: 'Estante D-1',
    barcode: 'LIB005',
    synopsis: 'Breve historia de la humanidad.',
    coverUrl: null,
    loanCount: 41,
  });

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, type, phone, status, sanctions, activeLoans)
    VALUES (@name, @email, @type, @phone, @status, @sanctions, @activeLoans)
  `);
  insertUser.run({
    name: 'Ana Garcia',
    email: 'ana.garcia@example.com',
    type: 'estudiante',
    phone: '+34 600 123 456',
    status: 'activo',
    sanctions: 0,
    activeLoans: 1,
  });
  insertUser.run({
    name: 'Carlos Rodriguez',
    email: 'carlos.rodriguez@example.com',
    type: 'estudiante',
    phone: '+34 600 234 567',
    status: 'activo',
    sanctions: 0,
    activeLoans: 1,
  });

  db.prepare(`
    INSERT INTO loans (bookId, bookTitle, userId, userName, loanDate, dueDate, status)
    VALUES (@bookId, @bookTitle, @userId, @userName, @loanDate, @dueDate, @status)
  `).run({
    bookId: 2,
    bookTitle: 'Sapiens: De animales a dioses',
    userId: 1,
    userName: 'Ana Garcia',
    loanDate: '2025-11-01',
    dueDate: '2025-11-20',
    status: 'activo',
  });

  const insertAuthUser = db.prepare('INSERT OR IGNORE INTO auth_users (email, password, name, role) VALUES (?, ?, ?, ?)');
  insertAuthUser.run('admin@biblioteca.com', 'admin123', 'Administrador', 'Bibliotecario');
  insertAuthUser.run('bibliotecario@biblioteca.com', 'biblio123', 'Juan Perez', 'Bibliotecario');
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const todayISO = () => new Date().toISOString().slice(0, 10);
const clamp = (val, min) => (val < min ? min : val);
const generateBarcode = () => {
  const rows = db.prepare("SELECT barcode FROM books WHERE barcode LIKE 'LIB%'").all();
  let maxNum = 0;
  rows.forEach(r => {
    const match = String(r.barcode).match(/LIB(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });
  const next = maxNum + 1;
  return `LIB${String(next).padStart(3, '0')}`;
};

// Auth
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT name, role, email FROM auth_users WHERE email=? AND password=?').get(email, password);
  if (!user) return res.status(401).json({ message: 'Credenciales incorrectas' });
  return res.json({ token: 'jwt-token-placeholder', user });
});

// Books
app.get('/books', (req, res) => {
  const { search = '', category, status, page = 1, pageSize = 10 } = req.query;
  const p = clamp(parseInt(page, 10) || 1, 1);
  const size = clamp(parseInt(pageSize, 10) || 10, 1);
  const term = `%${String(search).toLowerCase()}%`;

  let where = 'WHERE 1=1';
  const params = [];
  if (search) {
    where += ' AND (LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(isbn) LIKE ? OR LOWER(barcode) LIKE ?)';
    params.push(term, term, term, term);
  }
  if (category) {
    where += ' AND category = ?';
    params.push(category);
  }
  if (status) {
    where += ' AND status = ?';
    params.push(status);
  }

  const total = db.prepare(`SELECT COUNT(*) as c FROM books ${where}`).get(...params).c;
  const items = db
    .prepare(`SELECT * FROM books ${where} LIMIT ? OFFSET ?`)
    .all(...params, size, (p - 1) * size);
  res.json({ items, total, page: p, pageSize: size });
});

app.get('/books/:id', (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id=?').get(req.params.id);
  if (!book) return res.status(404).json({ message: 'Libro no encontrado' });
  res.json(book);
});

app.post('/books', (req, res) => {
  const payload = req.body || {};
  if (!payload.title || !payload.author) {
    return res.status(400).json({ message: 'Campos obligatorios: title, author' });
  }
  try {
    const barcode = payload.barcode && payload.barcode.trim() !== '' ? payload.barcode : generateBarcode();
    const isbn = payload.isbn && payload.isbn.trim() !== '' ? payload.isbn : `AUTO-${Date.now()}`;
    const stmt = db.prepare(`
      INSERT INTO books (title, author, isbn, category, status, location, barcode, synopsis, coverUrl, loanCount)
      VALUES (@title, @author, @isbn, @category, @status, @location, @barcode, @synopsis, @coverUrl, 0)
    `);
    const result = stmt.run({
      title: payload.title,
      author: payload.author,
      isbn,
      category: payload.category || 'General',
      status: payload.status || 'disponible',
      location: payload.location || 'Sin ubicar',
      barcode,
      synopsis: payload.synopsis || '',
      coverUrl: payload.coverUrl || null,
    });
    const book = db.prepare('SELECT * FROM books WHERE id=?').get(result.lastInsertRowid);
    res.status(201).json(book);
  } catch (err) {
    if (String(err).includes('UNIQUE constraint failed')) {
      return res.status(409).json({ message: 'ISBN o barcode ya existe' });
    }
    return res.status(500).json({ message: 'Error al crear libro' });
  }
});

app.put('/books/:id', (req, res) => {
  const payload = req.body || {};
  const book = db.prepare('SELECT * FROM books WHERE id=?').get(req.params.id);
  if (!book) return res.status(404).json({ message: 'Libro no encontrado' });
  try {
    db.prepare(
      `UPDATE books SET
        title=@title,
        author=@author,
        isbn=@isbn,
        category=@category,
        status=@status,
        location=@location,
        barcode=@barcode,
        synopsis=@synopsis,
        coverUrl=@coverUrl
      WHERE id=@id`
    ).run({
      id: req.params.id,
      title: payload.title ?? book.title,
      author: payload.author ?? book.author,
      isbn: payload.isbn ?? book.isbn,
      category: payload.category ?? book.category,
      status: payload.status ?? book.status,
      location: payload.location ?? book.location,
      barcode: payload.barcode ?? book.barcode,
      synopsis: payload.synopsis ?? book.synopsis,
      coverUrl: payload.coverUrl ?? book.coverUrl,
    });
    const updated = db.prepare('SELECT * FROM books WHERE id=?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    if (String(err).includes('UNIQUE constraint failed')) {
      return res.status(409).json({ message: 'ISBN o barcode ya existe' });
    }
    return res.status(500).json({ message: 'Error al actualizar libro' });
  }
});

app.delete('/books/:id', (req, res) => {
  const result = db.prepare('DELETE FROM books WHERE id=?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Libro no encontrado' });
  res.status(204).end();
});

// Users
app.get('/users', (req, res) => {
  const term = `%${String(req.query.search || '').toLowerCase()}%`;
  const filtered = db
    .prepare('SELECT * FROM users WHERE LOWER(name) LIKE ? OR LOWER(email) LIKE ?')
    .all(term, term);
  res.json({ items: filtered, total: filtered.length });
});

app.post('/users', (req, res) => {
  const payload = req.body || {};
  if (!payload.name || !payload.email) {
    return res.status(400).json({ message: 'Campos obligatorios: name, email' });
  }
  try {
    const result = db.prepare(
      `INSERT INTO users (name, email, type, phone, status, sanctions, activeLoans)
       VALUES (@name, @email, @type, @phone, @status, @sanctions, @activeLoans)`
    ).run({
      name: payload.name,
      email: payload.email,
      type: payload.type || 'estudiante',
      phone: payload.phone || '',
      status: payload.status || 'activo',
      sanctions: payload.sanctions || 0,
      activeLoans: payload.activeLoans || 0,
    });
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(result.lastInsertRowid);
    res.status(201).json(user);
  } catch (err) {
    if (String(err).includes('UNIQUE constraint failed')) {
      return res.status(409).json({ message: 'Email ya existe' });
    }
    return res.status(500).json({ message: 'Error al crear usuario' });
  }
});

app.put('/users/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Usuario no encontrado' });
  const payload = req.body || {};
  try {
    db.prepare(
      `UPDATE users SET
        name=@name,
        email=@email,
        type=@type,
        phone=@phone,
        status=@status,
        sanctions=@sanctions,
        activeLoans=@activeLoans
      WHERE id=@id`
    ).run({
      id: req.params.id,
      name: payload.name ?? existing.name,
      email: payload.email ?? existing.email,
      type: payload.type ?? existing.type,
      phone: payload.phone ?? existing.phone,
      status: payload.status ?? existing.status,
      sanctions: payload.sanctions ?? existing.sanctions,
      activeLoans: payload.activeLoans ?? existing.activeLoans,
    });
    const updated = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    if (String(err).includes('UNIQUE constraint failed')) {
      return res.status(409).json({ message: 'Email ya existe' });
    }
    return res.status(500).json({ message: 'Error al actualizar usuario' });
  }
});

app.delete('/users/:id', (req, res) => {
  const result = db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
  res.status(204).end();
});

// Loans
app.get('/loans', (req, res) => {
  const { userId, bookId, status } = req.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (userId) { where += ' AND userId = ?'; params.push(userId); }
  if (bookId) { where += ' AND bookId = ?'; params.push(bookId); }
  if (status) { where += ' AND status = ?'; params.push(status); }
  const items = db.prepare(`SELECT * FROM loans ${where}`).all(...params);
  res.json({ items, total: items.length });
});

app.post('/loans', (req, res) => {
  const { bookId, userId, dueDate } = req.body || {};
  const book = db.prepare('SELECT * FROM books WHERE id=? OR barcode=?').get(bookId, bookId);
  const user = db.prepare('SELECT * FROM users WHERE id=? OR email=?').get(userId, userId);
  if (!book) return res.status(404).json({ message: 'Libro no encontrado' });
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  if (book.status !== 'disponible') return res.status(400).json({ message: 'Libro no disponible' });
  if (user.status !== 'activo') return res.status(400).json({ message: 'Usuario sancionado/no activo' });
  if (!dueDate) return res.status(400).json({ message: 'dueDate es obligatorio' });

  const loanDate = todayISO();
  const insert = db.prepare(`
    INSERT INTO loans (bookId, bookTitle, userId, userName, loanDate, dueDate, status)
    VALUES (@bookId, @bookTitle, @userId, @userName, @loanDate, @dueDate, 'activo')
  `);
  const result = insert.run({
    bookId: book.id,
    bookTitle: book.title,
    userId: user.id,
    userName: user.name,
    loanDate,
    dueDate,
  });
  db.prepare("UPDATE books SET status='prestado', loanCount=loanCount+1 WHERE id=?").run(book.id);
  db.prepare('UPDATE users SET activeLoans=activeLoans+1 WHERE id=?').run(user.id);
  const loan = db.prepare('SELECT * FROM loans WHERE id=?').get(result.lastInsertRowid);
  res.status(201).json(loan);
});

// Returns
app.post('/returns', (req, res) => {
  const { bookId } = req.body || {};
  const book = db.prepare('SELECT * FROM books WHERE id=? OR barcode=?').get(bookId, bookId);
  if (!book) return res.status(404).json({ message: 'Libro no encontrado' });
  const activeLoan = db
    .prepare("SELECT * FROM loans WHERE bookId=? AND status != 'devuelto' ORDER BY loanDate DESC LIMIT 1")
    .get(book.id);
  if (!activeLoan) return res.status(404).json({ message: 'No hay prestamo activo para este libro' });

  const today = new Date();
  const due = new Date(activeLoan.dueDate);
  const diffDays = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  const daysLate = diffDays > 0 ? diffDays : 0;
  const fine = daysLate * 0.5;

  db.prepare("UPDATE loans SET status='devuelto', returnDate=? WHERE id=?").run(todayISO(), activeLoan.id);
  db.prepare("UPDATE books SET status='disponible' WHERE id=?").run(book.id);
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(activeLoan.userId);
  if (user) {
    db.prepare('UPDATE users SET activeLoans=?, sanctions=? WHERE id=?').run(
      clamp(user.activeLoans - 1, 0),
      daysLate > 0 ? user.sanctions + 1 : user.sanctions,
      user.id
    );
  }

  const updatedLoan = db.prepare('SELECT * FROM loans WHERE id=?').get(activeLoan.id);
  res.json({ loan: updatedLoan, daysLate, fine });
});

// Catalogs
app.get('/catalogs/categories', (_req, res) => {
  const rows = db.prepare('SELECT name FROM categories').all().map(r => r.name);
  res.json(rows);
});
app.post('/catalogs/categories', (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ message: 'name es obligatorio' });
  try {
    const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
    res.status(201).json({ id: result.lastInsertRowid, name });
  } catch (err) {
    if (String(err).includes('UNIQUE')) return res.status(409).json({ message: 'Categoria duplicada' });
    return res.status(500).json({ message: 'Error al crear categoria' });
  }
});

app.get('/catalogs/authors', (_req, res) => {
  const rows = db.prepare('SELECT name FROM authors').all().map(r => r.name);
  res.json(rows);
});
app.post('/catalogs/authors', (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ message: 'name es obligatorio' });
  try {
    const result = db.prepare('INSERT INTO authors (name) VALUES (?)').run(name);
    res.status(201).json({ id: result.lastInsertRowid, name });
  } catch (err) {
    if (String(err).includes('UNIQUE')) return res.status(409).json({ message: 'Autor duplicado' });
    return res.status(500).json({ message: 'Error al crear autor' });
  }
});

app.get('/catalogs/locations', (_req, res) => {
  const rows = db.prepare('SELECT name FROM locations').all().map(r => r.name);
  res.json(rows);
});
app.post('/catalogs/locations', (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ message: 'name es obligatorio' });
  try {
    const result = db.prepare('INSERT INTO locations (name) VALUES (?)').run(name);
    res.status(201).json({ id: result.lastInsertRowid, name });
  } catch (err) {
    if (String(err).includes('UNIQUE')) return res.status(409).json({ message: 'Ubicacion duplicada' });
    return res.status(500).json({ message: 'Error al crear ubicacion' });
  }
});

// Reports
app.get('/reports/summary', (_req, res) => {
  try {
    const totalBooks = db.prepare('SELECT COUNT(*) as c FROM books').get().c;
    const availableBooks = db.prepare("SELECT COUNT(*) as c FROM books WHERE status='disponible'").get().c;
    const activeLoans = db.prepare("SELECT COUNT(*) as c FROM loans WHERE status IN ('activo','retrasado')").get().c;
    const dueTodayCount = db.prepare("SELECT COUNT(*) as c FROM loans WHERE dueDate=? AND status!='devuelto'").get(todayISO()).c;
    const overdueCount = db.prepare("SELECT COUNT(*) as c FROM loans WHERE status='retrasado'").get().c;
    const topBooks = db.prepare('SELECT title, loanCount FROM books ORDER BY loanCount DESC LIMIT 5').all();
    res.json({ totalBooks, availableBooks, activeLoans, dueTodayCount, overdueCount, topBooks });
  } catch (err) {
    console.error('Error /reports/summary', err);
    res.status(500).json({ message: 'Error al obtener summary', error: String(err) });
  }
});

app.get('/reports/inventory', (_req, res) => {
  try {
    const byStatus = [
      { name: 'Disponible', value: db.prepare("SELECT COUNT(*) as c FROM books WHERE status='disponible'").get().c },
      { name: 'Prestado', value: db.prepare("SELECT COUNT(*) as c FROM books WHERE status='prestado'").get().c },
    ];
    const categoriesCount = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
    const locationsCount = db.prepare('SELECT COUNT(*) as c FROM locations').get().c;
    res.json({ byStatus, categoriesCount, locationsCount });
  } catch (err) {
    console.error('Error /reports/inventory', err);
    res.status(500).json({ message: 'Error al obtener inventario', error: String(err) });
  }
});

app.get('/reports/loans', (req, res) => {
  try {
    const { from, to } = req.query;
    const hasRange = Boolean(from || to);
    const allLoans = db.prepare('SELECT loanDate, bookId FROM loans').all();
    const filteredLoans = hasRange
      ? allLoans.filter(l => {
          const d = l.loanDate;
          return (!from || d >= from) && (!to || d <= to);
        })
      : allLoans;

    const byMonthMap = {};
    filteredLoans.forEach(row => {
      const m = row.loanDate.slice(0, 7);
      byMonthMap[m] = (byMonthMap[m] || 0) + 1;
    });
    const loansByMonth = Object.keys(byMonthMap).map(month => ({ month, prestamos: byMonthMap[month] }));

    const byCategoryMap = {};
    db.prepare('SELECT l.bookId, b.category, l.loanDate FROM loans l JOIN books b ON l.bookId = b.id').all().forEach(row => {
      if (hasRange && ((from && row.loanDate < from) || (to && row.loanDate > to))) return;
      const cat = row.category || 'Otros';
      byCategoryMap[cat] = (byCategoryMap[cat] || 0) + 1;
    });
    const loansByCategory = Object.keys(byCategoryMap).map(category => ({ category, count: byCategoryMap[category] }));

    res.json({
      loansByMonth,
      loansByCategory,
      totals: { count: filteredLoans.length, returnRate: 0.94 },
    });
  } catch (err) {
    console.error('Error /reports/loans', err);
    res.status(500).json({ message: 'Error al obtener reportes de prestamos', error: String(err) });
  }
});

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Library Inventory API (SQLite)' });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
