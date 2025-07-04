// mergedServer.js
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 8080; // Unified port

app.use(cors());
app.use(express.json());

// === Common helpers ===
function log(source, message, data = null) {
    const time = new Date().toISOString();
    console.log(`[${source}] [${time}] ${message}`);
    if (data !== null) console.log(data);
}

function loadJSON(file, fallback = []) {
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
    const data = fs.readFileSync(file, 'utf-8');
    return data.trim() ? JSON.parse(data) : fallback;
}

function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// === Paths ===
const hackatonPaths = {
    USERS_FILE: path.join(__dirname, 'hackaton', 'users.json'),
    PROJECTS_FILE: path.join(__dirname, 'hackaton', 'projects.json'),
    CHATS_FILE: path.join(__dirname, 'hackaton', 'chats.json')
};

const connectPaths = {
    USERS_FILE: path.join(__dirname, 'connect', 'users.json')
};

const START_MONEY = 1000;

// === Routes ===
app.post('/register', (req, res) => {
    const {email, password, type, name, bio} = req.body;

    if (type == 1) {
        // Hackaton logic
        const users = loadJSON(hackatonPaths.USERS_FILE);
        if (users.find(u => u.email === email)) {
            log('Hackaton', 'Registration failed: User already exists', email);
            return res.status(400).json({message: 'User already exists'});
        }

        users.push({email, password, money: START_MONEY});
        saveJSON(hackatonPaths.USERS_FILE, users);
        log('Hackaton', 'User registered', email);
        return res.json({message: 'User registered successfully'});

    } else if (type == 2) {
        // Connect logic
        const users = loadJSON(connectPaths.USERS_FILE);
        if (users.find(u => u.email === email)) {
            log('Connect', 'Email already registered', email);
            return res.status(400).json({error: 'Email already registered'});
        }

        // Fallback values if fields are missing
        const name = req.body.name || "";
        const bio = req.body.bio || "";
        const bals = req.body.bals != null ? req.body.bals : 1000;

        const newUser = { email, password, name, bio, bals };
        users.push(newUser);
        saveJSON(connectPaths.USERS_FILE, users);
        log('Connect', 'User registered', email);
        return res.json({message: 'User registered successfully', user: newUser});
    }

    res.status(400).json({error: 'Invalid type'});
});

app.post('/login', (req, res) => {
    const {email, password, type} = req.body;

    if (type == 1) {
        const users = loadJSON(hackatonPaths.USERS_FILE);
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            log('Hackaton', 'Login success', email);
            return res.json({message: 'Login successful', email: user.email, money: user.money});
        } else {
            log('Hackaton', 'Login failed', email);
            return res.status(401).json({message: 'Invalid credentials'});
        }
    } else if (type == 2) {
        const users = loadJSON(connectPaths.USERS_FILE);
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            log('Connect', 'Login success', email);
            return res.json({user});
        } else {
            log('Connect', 'Login failed', email);
            return res.status(401).json({error: 'Invalid credentials'});
        }
    }

    res.status(400).json({error: 'Invalid type'});
});

app.post('/getUser', (req, res) => {
    const {email, type} = req.body;

    if (type == 1) {
        const users = loadJSON(hackatonPaths.USERS_FILE);
        const user = users.find(u => u.email === email);
        if (user) return res.json({email: user.email, money: user.money});
        log('Hackaton', 'User not found', email);
        return res.status(404).json({message: 'User not found'});
    }

    res.status(400).json({error: 'Invalid or unsupported type'});
});

app.get('/profile', (req, res) => {
    const {email, type} = req.query;

    if (type == 1) {
        const users = loadJSON(hackatonPaths.USERS_FILE);
        const user = users.find(u => u.email === email);
        if (user) return res.json({email: user.email, money: user.money});
        log('Hackaton', 'Profile not found', email);
        return res.status(404).json({message: 'User not found'});
    }

    res.status(400).json({error: 'Invalid or unsupported type'});
});

app.get('/connect/profile/:email', (req, res) => {
    const users = loadJSON(connectPaths.USERS_FILE);
    const user = users.find(u => u.email === req.params.email);
    if (user) return res.json(user);
    return res.status(404).json({error: 'User not found'});
});

app.put('/connect/profile/:email', (req, res) => {
    const users = loadJSON(connectPaths.USERS_FILE);
    const index = users.findIndex(u => u.email === req.params.email);
    if (index === -1) return res.status(404).json({error: 'User not found'});

    users[index] = {...users[index], ...req.body};
    saveJSON(connectPaths.USERS_FILE, users);

    log('Connect', `Profile updated for ${req.params.email}`);
    return res.json(users[index]);
});

app.get('/projects', (req, res) => {
    const {type} = req.query;
    if (type == 1) {
        log('Hackaton', 'Project list requested');
        return res.json(loadJSON(hackatonPaths.PROJECTS_FILE));
    }

    res.status(400).json({error: 'Invalid or unsupported type'});
});

app.post('/updateMoney', (req, res) => {
    const {email, amount, projectId, type} = req.body;
    const {type: actionType} = req.query;

    if (type == 1) {
        const users = loadJSON(hackatonPaths.USERS_FILE);
        const projects = loadJSON(hackatonPaths.PROJECTS_FILE);
        const user = users.find(u => u.email === email);

        if (!user) return res.status(404).json({message: 'User not found'});

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount)) return res.status(400).json({message: 'Invalid amount'});

        let updatedProject = null;

        if (actionType === 'invest') {
            if (user.money < numericAmount) return res.status(400).json({message: 'Insufficient funds'});
            const project = projects.find(p => p.id === projectId);
            if (!project) return res.status(404).json({message: 'Project not found'});

            user.money -= numericAmount;
            project.investedAmount += numericAmount;
            updatedProject = project;

            saveJSON(hackatonPaths.PROJECTS_FILE, projects);
        } else {
            user.money += numericAmount;
        }

        saveJSON(hackatonPaths.USERS_FILE, users);

        const response = {
            message: actionType === 'invest' ? 'Investment successful' : 'Money added',
            money: user.money
        };
        if (updatedProject) response.project = updatedProject;

        return res.json(response);
    }

    res.status(400).json({error: 'Invalid or unsupported type'});
});

app.get('/chats', (req, res) => {
    const {email, type} = req.query;
    if (type == 1) {
        const chats = loadJSON(hackatonPaths.CHATS_FILE).filter(c => c.participants.includes(email));
        return res.json(chats);
    }

    res.status(400).json({error: 'Invalid or unsupported type'});
});

app.post('/chats/send', (req, res) => {
    const {from, to, message, type} = req.body;
    if (type == 1) {
        const chats = loadJSON(hackatonPaths.CHATS_FILE);
        let chat = chats.find(c => c.participants.includes(from) && c.participants.includes(to));
        if (!chat) {
            chat = {
                chatId: `chat_${Date.now()}`,
                participants: [from, to],
                messages: []
            };
            chats.push(chat);
        }

        chat.messages.push({from, message, timestamp: new Date().toISOString()});
        saveJSON(hackatonPaths.CHATS_FILE, chats);
        return res.json({success: true});
    }

    res.status(400).json({error: 'Invalid or unsupported type'});
});

app.post('/chats/create', (req, res) => {
    const {from, to, type} = req.body;
    if (type == 1) {
        const chats = loadJSON(hackatonPaths.CHATS_FILE);
        if (!from || !to || from === to) return res.status(400).json({message: 'Invalid participants'});

        let existing = chats.find(c => c.participants.includes(from) && c.participants.includes(to));
        if (existing) return res.json({message: 'Chat already exists', chat: existing});

        const newChat = {
            chatId: `chat_${Date.now()}`,
            participants: [from, to],
            messages: []
        };

        chats.push(newChat);
        saveJSON(hackatonPaths.CHATS_FILE, chats);
        return res.json({message: 'Chat created', chat: newChat});
    }

    res.status(400).json({error: 'Invalid or unsupported type'});
});

app.post('/chats/group/create', (req, res) => {
    const {groupName, participants, creator, type} = req.body;

    if (type == 1) {
        if (!groupName || !Array.isArray(participants) || participants.length < 2) {
            return res.status(400).json({message: 'Invalid group data'});
        }

        const chats = loadJSON(hackatonPaths.CHATS_FILE);

        const newGroupChat = {
            chatId: `group_${Date.now()}`,
            isGroup: true,
            groupName,
            participants: [...new Set(participants)],
            messages: []
        };

        chats.push(newGroupChat);
        saveJSON(hackatonPaths.CHATS_FILE, chats);
        return res.json({message: 'Group chat created', chat: newGroupChat});
    }

    res.status(400).json({error: 'Invalid or unsupported type'});
});

app.post('/chats/group/send', (req, res) => {
    const {chatId, from, message, type} = req.body;

    if (type == 1) {
        const chats = loadJSON(hackatonPaths.CHATS_FILE);
        const chat = chats.find(c => c.chatId === chatId && c.isGroup);

        if (!chat) return res.status(404).json({message: 'Group chat not found'});

        chat.messages.push({from, message, timestamp: new Date().toISOString()});
        saveJSON(hackatonPaths.CHATS_FILE, chats);
        return res.json({success: true});
    }

    res.status(400).json({error: 'Invalid or unsupported type'});
});

app.listen(PORT, () => {
    console.log(`🚀 Unified server running at http://localhost:${PORT}`);
});