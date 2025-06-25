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

function log(message, data = null) {
    const time = new Date().toISOString();
    console.log(`Index.js: [${time}] ${message}`);
    if (data !== null) console.log(data);
}

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

// AUTH
app.post('/register', (req, res) => {
    const { email, password } = req.body;
    log('Register attempt', { email });

    const users = loadUsers();
    if (users.find(u => u.email === email)) {
        log('Registration failed: User already exists', email);
        return res.status(400).json({ message: 'User already exists' });
    }

    users.push({ email, password, money });
    saveUsers(users);
    log('User registered successfully', { email });
    res.json({ message: 'User registered successfully' });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    log('Login attempt', { email });

    const users = loadUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        log('Login successful', { email });
        res.json({ message: 'Login successful', email: user.email, money: user.money });
    } else {
        log('Login failed: Invalid credentials', { email });
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

app.post('/getUser', (req, res) => {
    const { email } = req.body;
    log('Fetching user data', { email });

    const users = loadUsers();
    const user = users.find(u => u.email === email);
    if (user) res.json({ email: user.email, money: user.money });
    else {
        log('User not found', { email });
        res.status(404).json({ message: 'User not found' });
    }
});

// MONEY & PROJECTS
app.post('/updateMoney', (req, res) => {
    const { email, amount, projectId } = req.body;
    const { type } = req.query;
    log('Money update requested', { email, amount, type, projectId });

    const users = loadUsers();
    const user = users.find(u => u.email === email);
    if (!user) {
        log('Money update failed: User not found', { email });
        return res.status(404).json({ message: 'User not found' });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
        log('Invalid amount input', { amount });
        return res.status(400).json({ message: 'Invalid amount' });
    }

    const projects = loadProjects();
    let updatedProject = null;

    if (type === 'invest') {
        if (user.money < numericAmount) {
            log('Investment failed: Insufficient funds', { email, balance: user.money });
            return res.status(400).json({ message: 'Insufficient funds' });
        }
        user.money -= numericAmount;
        const project = projects.find(p => p.id === projectId);
        if (!project) {
            log('Investment failed: Project not found', { projectId });
            return res.status(404).json({ message: 'Project not found' });
        }
        project.investedAmount += numericAmount;
        updatedProject = project;
        saveProjects(projects);
        log('Investment successful', { email, projectId, amount: numericAmount });
    } else {
        user.money += numericAmount;
        log('Money added successfully', { email, newBalance: user.money });
    }

    saveUsers(users);
    const response = { message: type === 'invest' ? 'Investment successful' : 'Money added', money: user.money };
    if (updatedProject) response.project = updatedProject;
    res.json(response);
});

app.get('/profile', (req, res) => {
    const { email } = req.query;
    log('Profile requested', { email });

    const users = loadUsers();
    const user = users.find(u => u.email === email);
    if (user) res.json({ email: user.email, money: user.money });
    else {
        log('Profile fetch failed: User not found', { email });
        res.status(404).json({ message: 'User not found' });
    }
});

app.get('/projects', (req, res) => {
    log('Project list requested');
    res.json(loadProjects());
});

app.post('/invest', (req, res) => {
    const { email, amount, projectId } = req.body;
    log('Invest endpoint called', { email, amount, projectId });

    const users = loadUsers();
    const projects = loadProjects();
    const user = users.find(u => u.email === email);
    const project = projects.find(p => p.id === projectId);

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const investAmount = parseFloat(amount);
    if (user.money < investAmount) {
        log('Investment failed: Insufficient funds');
        return res.status(400).json({ message: 'Insufficient funds' });
    }

    user.money -= investAmount;
    project.investedAmount += investAmount;

    saveUsers(users);
    saveProjects(projects);

    log('Investment processed', { email, projectId, invested: investAmount });
    res.json({
        message: 'Investment successful',
        remainingMoney: user.money,
        newProjectInvestment: project.investedAmount
    });
});

// CHAT
app.get('/chats', (req, res) => {
    const { email } = req.query;
    log('Chat list requested', { email });

    const chats = loadChats().filter(c => c.participants.includes(email));
    res.json(chats);
});

app.post('/chats/send', (req, res) => {
    const { from, to, message } = req.body;
    log('Sending chat message', { from, to, message });

    const chats = loadChats();
    let chat = chats.find(c => c.participants.includes(from) && c.participants.includes(to));
    if (!chat) {
        chat = {
            chatId: `chat_${Date.now()}`,
            participants: [from, to],
            messages: []
        };
        chats.push(chat);
        log('Created new chat', chat);
    }

    chat.messages.push({ from, message, timestamp: new Date().toISOString() });
    saveChats(chats);
    log('Message saved to chat', { chatId: chat.chatId });
    res.json({ success: true });
});

app.post('/chats/create', (req, res) => {
    const { from, to } = req.body;
    log('Creating new chat (manual)', { from, to });

    if (!from || !to || from === to) {
        log('Chat creation failed: Invalid participants');
        return res.status(400).json({ message: 'Invalid participants' });
    }

    const chats = loadChats();
    let existing = chats.find(c => c.participants.includes(from) && c.participants.includes(to));

    if (existing) {
        log('Chat already exists', { chatId: existing.chatId });
        return res.json({ message: 'Chat already exists', chat: existing });
    }

    const newChat = {
        chatId: `chat_${Date.now()}`,
        participants: [from, to],
        messages: []
    };

    chats.push(newChat);
    saveChats(chats);
    log('Chat created', newChat);
    res.json({ message: 'Chat created', chat: newChat });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});