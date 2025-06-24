// Updated Node.js server with chat support
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

const USERS_FILE = path.join(__dirname, 'users.json');
const PROJECTS_FILE = path.join(__dirname, 'projects.json');
const CHATS_FILE = path.join(__dirname, 'chats.json');
const money = 1000;

app.use(cors());
app.use(express.json());

// Helper functions
function loadJSON(file, fallback = []) {
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
    const data = fs.readFileSync(file, 'utf-8');
    return data.trim() ? JSON.parse(data) : fallback;
}

function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// USERS
function loadUsers() {
    return loadJSON(USERS_FILE);
}

function saveUsers(users) {
    saveJSON(USERS_FILE, users);
}

// PROJECTS
function loadProjects() {
    return loadJSON(PROJECTS_FILE);
}

function saveProjects(projects) {
    saveJSON(PROJECTS_FILE, projects);
}

// CHATS
function loadChats() {
    return loadJSON(CHATS_FILE);
}

function saveChats(chats) {
    saveJSON(CHATS_FILE, chats);
}

// Auth
app.post('/register', (req, res) => {
    const { email, password } = req.body;
    const users = loadUsers();

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    users.push({ email, password, money });
    saveUsers(users);
    res.json({ message: 'User registered successfully' });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const users = loadUsers();

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        res.json({ message: 'Login successful', email: user.email, money: user.money });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

app.post('/getUser', (req, res) => {
    const { email } = req.body;
    const users = loadUsers();
    const user = users.find(u => u.email === email);
    if (user) res.json({ email: user.email, money: user.money });
    else res.status(404).json({ message: 'User not found' });
});

// Money & Projects
app.post('/updateMoney', (req, res) => {
    const { email, amount, projectId } = req.body;
    const { type } = req.query;
    const users = loadUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return res.status(400).json({ message: 'Invalid amount' });

    const projects = loadProjects();
    let updatedProject = null;

    if (type === 'invest') {
        if (user.money < numericAmount) return res.status(400).json({ message: 'Insufficient funds' });
        user.money -= numericAmount;
        const project = projects.find(p => p.id === projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        project.investedAmount += numericAmount;
        updatedProject = project;
        saveProjects(projects);
    } else {
        user.money += numericAmount;
    }

    saveUsers(users);

    const response = { message: type === 'invest' ? 'Investment successful' : 'Money added', money: user.money };
    if (updatedProject) response.project = updatedProject;
    res.json(response);
});

app.get('/profile', (req, res) => {
    const { email } = req.query;
    const users = loadUsers();
    const user = users.find(u => u.email === email);
    if (user) res.json({ email: user.email, money: user.money });
    else res.status(404).json({ message: 'User not found' });
});

app.get('/projects', (req, res) => {
    res.json(loadProjects());
});

app.post('/invest', (req, res) => {
    const { email, amount, projectId } = req.body;
    const users = loadUsers();
    const projects = loadProjects();
    const user = users.find(u => u.email === email);
    const project = projects.find(p => p.id === projectId);

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const investAmount = parseFloat(amount);
    if (user.money < investAmount) return res.status(400).json({ message: 'Insufficient funds' });

    user.money -= investAmount;
    project.investedAmount += investAmount;

    saveUsers(users);
    saveProjects(projects);

    res.json({
        message: 'Investment successful',
        remainingMoney: user.money,
        newProjectInvestment: project.investedAmount
    });
});

// CHAT endpoints
app.get('/chats', (req, res) => {
    const { email } = req.query;
    const chats = loadChats().filter(c => c.participants.includes(email));
    res.json(chats);
});

app.post('/chats/send', (req, res) => {
    const { from, to, message } = req.body;
    const chats = loadChats();


    let chat = chats.find(c => c.participants.includes(from) && c.participants.includes(to));
    if (!chat) {
        chat = {
            chatId: `chat_${Date.now()}`,
            participants: [from, to],
            messages: []
        };
        chats.push(chat);
    }

    chat.messages.push({ from, message, timestamp: new Date().toISOString() });
    saveChats(chats);
    res.json({ success: true });
});

// Create a new empty chat if it doesn't exist
app.post('/chats/create', (req, res) => {
    const { from, to } = req.body;
    if (!from || !to || from === to) {
        return res.status(400).json({ message: 'Invalid participants' });
    }

    const chats = loadChats();
    let existing = chats.find(c => c.participants.includes(from) && c.participants.includes(to));

    if (existing) {
        return res.json({ message: 'Chat already exists', chat: existing });
    }

    const newChat = {
        chatId: `chat_${Date.now()}`,
        participants: [from, to],
        messages: []
    };

    chats.push(newChat);
    saveChats(chats);
    res.json({ message: 'Chat created', chat: newChat });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});