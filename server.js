// server.js
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const USERS_FILE = path.join(__dirname, 'connect', 'users.json');

// Simple logger
function log(message, data = null) {
    const time = new Date().toISOString();
    console.log(`[${time}] ${message}`);
    if (data !== null) console.log(data);
}

// Load users from file
function loadUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE);
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// Save users to file
function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// 🟢 Register
app.post('/register', (req, res) => {
    const { email, password, name, bio } = req.body;
    const users = loadUsers();

    if (users.find(u => u.email === email)) {
        log(`Failed registration: ${email} already exists`);
        return res.status(400).json({ error: 'Email already registered' });
    }

    const newUser = {
        email,
        password,
        name,
        bio,
        bals: 0
    };
    users.push(newUser);
    saveUsers(users);

    log(`New user registered: ${email}`);
    res.json({ message: 'User registered successfully' });
});

// 🟢 Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const users = loadUsers();

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        log(`Login success: ${email}`);
        res.json(user);
    } else {
        log(`Login failed for: ${email}`);
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// 🟢 Get profile
app.get('/profile/:email', (req, res) => {
    const users = loadUsers();
    const user = users.find(u => u.email === req.params.email);
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// 🟢 Update profile
app.put('/profile/:email', (req, res) => {
    const users = loadUsers();
    const index = users.findIndex(u => u.email === req.params.email);
    if (index === -1) {
        return res.status(404).json({ error: 'User not found' });
    }

    users[index] = { ...users[index], ...req.body };
    saveUsers(users);

    log(`Profile updated for: ${req.params.email}`);
    res.json(users[index]);
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    log(`Server started on port ${PORT}`);
});