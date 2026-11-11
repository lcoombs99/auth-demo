// backend/server.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 8080;
const USERS_FILE = path.join(__dirname, 'users.json');

// Helper to ensure users.json exists
function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    return [];
  }
}

// Helper to save users array to users.json
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Helper to hash passwords using built-in crypto
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Helper for CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const server = http.createServer((req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    let parsedData = {};
    if (body) {
      try {
        parsedData = JSON.parse(body);
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid JSON payload.' }));
        return;
      }
    }

    const users = loadUsers();

    // -------------------------------------------------------------
    // SIGNUP: Save user credentials to users.json
    // -------------------------------------------------------------
    if (req.url === '/signup' && req.method === 'POST') {
      const { email, password } = parsedData;

      if (!email || !password || password.length < 6) {
        res.writeHead(422, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            message: 'Validation failed.',
            errors: { password: 'Password must be at least 6 characters long.' },
          })
        );
        return;
      }

      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        res.writeHead(422, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            message: 'Validation failed.',
            errors: { email: 'User email already exists.' },
          })
        );
        return;
      }

      // Hash password and store in JSON file
      const salt = crypto.randomBytes(16).toString('hex');
      const hashedPassword = hashPassword(password, salt);

      const newUser = { id: Date.now().toString(), email, salt, hash: hashedPassword };
      users.push(newUser);
      saveUsers(users);

      const token = `dummy-jwt-token-for-${email.replace(/[^a-zA-Z0-9]/g, '')}`;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'User created successfully.', token }));
      return;
    }

    // -------------------------------------------------------------
    // LOGIN: Authenticate against users stored in users.json
    // -------------------------------------------------------------
    if (req.url === '/login' && req.method === 'POST') {
      const { email, password } = parsedData;

      const user = users.find(u => u.email === email);
      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid email or password.' }));
        return;
      }

      const incomingHash = hashPassword(password, user.salt);
      if (incomingHash !== user.hash) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid email or password.' }));
        return;
      }

      const token = `dummy-jwt-token-for-${email.replace(/[^a-zA-Z0-9]/g, '')}`;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Login successful.', token }));
      return;
    }

    // -------------------------------------------------------------
    // PROTECTED ACTION: Endpoint requiring Authorization header
    // -------------------------------------------------------------
    if (req.url === '/secret-action' && req.method === 'POST') {
      const authHeader = req.headers['authorization'];

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Not authorized. Token missing.' }));
        return;
      }

      const token = authHeader.split(' ')[1];
      if (!token || token === 'undefined' || token === 'null') {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Not authorized. Invalid token.' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Success! You executed a protected backend action.' }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Route not found.' }));
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});