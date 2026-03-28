// ============================================================
//  Placement Cell — Backend Server
//  Express + built-in Node.js JSON file store (no native deps)
//  Runs on: http://localhost:5000
// ============================================================

const express  = require('express');
const cors     = require('cors');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const fs       = require('fs');
const path     = require('path');

const app        = express();
const PORT       = 5000;
const JWT_SECRET = 'placement_cell_secret_2024';
const DB_FILE    = path.join(__dirname, 'db.json');

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Simple JSON File Database ─────────────────────────────────
const readDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    const initial = { students: [], coordinators: [], companies: [], applications: [], nextId: { students: 1, coordinators: 1, companies: 1, applications: 1 } };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
};

const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

const nextId = (db, table) => {
  const id = db.nextId[table]++;
  writeDB(db);
  return id;
};

// ── Seed Default Coordinator ──────────────────────────────────
const seedCoordinator = () => {
  const db = readDB();
  if (!db.coordinators.find(c => c.email === 'admin@placement.com')) {
    const hashed = bcrypt.hashSync('admin123', 10);
    db.coordinators.push({
      id: nextId(db, 'coordinators'),
      name: 'Admin Coordinator',
      email: 'admin@placement.com',
      password: hashed,
      created_at: new Date().toISOString()
    });
    writeDB(db);
    console.log('✅ Default coordinator: admin@placement.com / admin123');
  }
};
seedCoordinator();

// ── Auth Middleware ────────────────────────────────────────────
const authMiddleware = (role) => (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ message: 'No token provided.' });
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (role && decoded.role !== role) return res.status(403).json({ message: 'Forbidden.' });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// ============================================================
//  STUDENT ROUTES
// ============================================================

// POST /api/students/register
app.post('/api/students/register', async (req, res) => {
  try {
    const { name, email, password, department, year, resumeLink } = req.body;
    if (!name || !email || !password || !department || !year)
      return res.status(400).json({ message: 'All required fields must be filled.' });

    const db = readDB();
    if (db.students.find(s => s.email === email))
      return res.status(409).json({ message: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    const student = {
      id: nextId(db, 'students'), name, email,
      password: hashed, department, year: parseInt(year),
      resumeLink: resumeLink || '', created_at: new Date().toISOString()
    };
    db.students.push(student);
    writeDB(db);

    const { password: _, ...studentData } = student;
    studentData.role = 'student';
    const token = jwt.sign({ id: student.id, name, email, role: 'student' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, student: studentData });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// POST /api/students/login
app.post('/api/students/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required.' });

    const db      = readDB();
    const student = db.students.find(s => s.email === email);
    if (!student) return res.status(401).json({ message: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, student.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

    const { password: _, ...studentData } = student;
    studentData.role = 'student';
    const token = jwt.sign({ id: student.id, name: student.name, email, role: 'student' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, student: studentData });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// GET /api/students/companies
app.get('/api/students/companies', authMiddleware('student'), (req, res) => {
  try {
    const db         = readDB();
    const appliedIds = new Set(db.applications.filter(a => a.studentId === req.user.id).map(a => a.companyId));
    const result     = db.companies.map(c => ({ ...c, hasApplied: appliedIds.has(c.id) }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// POST /api/students/apply/:companyId
app.post('/api/students/apply/:companyId', authMiddleware('student'), (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const db        = readDB();

    if (!db.companies.find(c => c.id === companyId))
      return res.status(404).json({ message: 'Company not found.' });

    if (db.applications.find(a => a.studentId === req.user.id && a.companyId === companyId))
      return res.status(409).json({ message: 'Already applied to this company.' });

    db.applications.push({
      id: nextId(db, 'applications'),
      studentId: req.user.id, companyId,
      applied_at: new Date().toISOString()
    });
    writeDB(db);
    res.status(201).json({ message: 'Application submitted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// GET /api/students/profile
app.get('/api/students/profile', authMiddleware('student'), (req, res) => {
  const db      = readDB();
  const student = db.students.find(s => s.id === req.user.id);
  if (!student) return res.status(404).json({ message: 'Student not found.' });
  const { password: _, ...data } = student;
  res.json(data);
});

// ============================================================
//  COORDINATOR ROUTES
// ============================================================

// POST /api/coordinators/login
app.post('/api/coordinators/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required.' });

    const db    = readDB();
    const coord = db.coordinators.find(c => c.email === email);
    if (!coord) return res.status(401).json({ message: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, coord.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

    const { password: _, ...coordData } = coord;
    coordData.role = 'coordinator';
    const token = jwt.sign({ id: coord.id, name: coord.name, email, role: 'coordinator' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, coordinator: coordData });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// GET /api/coordinators/companies
app.get('/api/coordinators/companies', authMiddleware('coordinator'), (req, res) => {
  try {
    const db = readDB();
    // Attach live application count to every company
    const result = db.companies.map(c => ({
      ...c,
      applicationCount: db.applications.filter(a => a.companyId === c.id).length
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// POST /api/coordinators/companies
app.post('/api/coordinators/companies', authMiddleware('coordinator'), (req, res) => {
  try {
    const { companyName, role, lpa, requirements } = req.body;
    if (!companyName || !role || !lpa)
      return res.status(400).json({ message: 'Company name, role and LPA are required.' });

    const db      = readDB();
    const company = {
      id: nextId(db, 'companies'), companyName, role, lpa,
      requirements: requirements || '', created_at: new Date().toISOString()
    };
    db.companies.push(company);
    writeDB(db);
    res.status(201).json(company);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// GET /api/coordinators/companies/:id/applications
app.get('/api/coordinators/companies/:id/applications', authMiddleware('coordinator'), (req, res) => {
  try {
    const companyId = parseInt(req.params.id);
    const db        = readDB();
    const apps      = db.applications.filter(a => a.companyId === companyId);
    const result    = apps.map(a => {
      const student = db.students.find(s => s.id === a.studentId);
      if (!student) return null;
      const { password: _, ...sData } = student;
      return { ...sData, applied_at: a.applied_at };
    }).filter(Boolean);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// DELETE /api/coordinators/companies/:id
app.delete('/api/coordinators/companies/:id', authMiddleware('coordinator'), (req, res) => {
  try {
    const companyId = parseInt(req.params.id);
    const db        = readDB();
    const idx       = db.companies.findIndex(c => c.id === companyId);
    if (idx === -1) return res.status(404).json({ message: 'Company not found.' });

    db.companies.splice(idx, 1);
    db.applications = db.applications.filter(a => a.companyId !== companyId);
    writeDB(db);
    res.json({ message: 'Company deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// GET /api/coordinators/profile
app.get('/api/coordinators/profile', authMiddleware('coordinator'), (req, res) => {
  const db    = readDB();
  const coord = db.coordinators.find(c => c.id === req.user.id);
  if (!coord) return res.status(404).json({ message: 'Coordinator not found.' });
  const { password: _, ...data } = coord;
  res.json(data);
});

// ── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Placement Cell backend → http://localhost:${PORT}`);
  console.log(`📋 Coordinator login:  admin@placement.com / admin123`);
  console.log(`💾 Data stored in:     ${DB_FILE}\n`);
});
