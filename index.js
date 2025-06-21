// Simple Node.js server using Express
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const USERS_FILE = path.join(__dirname, 'users.json');
const PROJECTS_FILE = path.join(__dirname, 'projects.json');
const money = 1000;

app.use(cors());
app.use(express.json());

// Helper to load users from file
function loadUsers() {
    try {
        if (!fs.existsSync(USERS_FILE)) {
            fs.writeFileSync(USERS_FILE, JSON.stringify([]));
        }
        const data = fs.readFileSync(USERS_FILE, 'utf-8');
        return data.trim() ? JSON.parse(data) : [];
    } catch (err) {
        console.error('Error reading users.json:', err);
        return [];
    }
}

// Helper to save users to file
function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}


// Load projects from file
function loadProjects() {
    try {
        if (!fs.existsSync(PROJECTS_FILE)) {
            fs.writeFileSync(PROJECTS_FILE, JSON.stringify([]));
        }
        const data = fs.readFileSync(PROJECTS_FILE, 'utf-8');
        return data.trim() ? JSON.parse(data) : [];
    } catch (err) {
        console.error('Error reading projects.json:', err);
        return [];
    }
}

// Save projects to file
function saveProjects(projects) {
    try {
        fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
    } catch (err) {
        console.error('Error saving projects.json:', err);
    }
}


// Register endpoint
app.post('/register', (req, res) => {
    const { email, password } = req.body;
    const users = loadUsers();

    if (users.find(user => user.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    users.push({ email, password, money: money });
    saveUsers(users);
    res.json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const users = loadUsers();

    const user = users.find(user => user.email === email && user.password === password);

    if (user) {
        res.json({ message: 'Login successful', email: user.email, money: user.money });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Get user by email (used after login)
app.post('/getUser', (req, res) => {
    const { email } = req.body;
    const users = loadUsers();

    const user = users.find(u => u.email === email);
    if (user) {
        res.json({ email: user.email, money: user.money });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// Update user's money
app.post('/updateMoney', (req, res) => {
    const { email, amount, projectId } = req.body;
    const { type } = req.query;

    const users = loadUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
        return res.status(400).json({ message: 'Invalid amount' });
    }

    // Load projects if needed
    const projects = loadProjects();
    let updatedProject = null;

    if (type === 'invest') {
        // Subtract from user
        if (user.money < numericAmount) {
            return res.status(400).json({ message: 'Insufficient funds' });
        }
        user.money -= numericAmount;

        // Update project
        const project = projects.find(p => p.id === projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        project.investedAmount += numericAmount;
        updatedProject = project;

        saveProjects(projects);
    } else {
        // Add to user
        user.money += numericAmount;
    }

    saveUsers(users);

    const response = {
        message: type === 'invest' ? 'Investment successful' : 'Money added',
        money: user.money
    };

    if (updatedProject) {
        response.project = updatedProject;
    }

    res.json(response);
});

// Get user profile by email
app.get('/profile', (req, res) => {
    console.log(req.query);
    const { email } = req.query;
    const users = loadUsers();

    const user = users.find(user => user.email === email);

    if (user) {
        res.json({ email: user.email, money: user.money });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

app.get('/projects', (req, res) => {
    const projects = loadProjects();
    res.json(projects);
});

app.post('/invest', (req, res) => {
    console.log(req.body);
    const { email, amount, projectId } = req.body;
    const users = loadUsers();
    const projects = loadProjects(); // Make sure you have this function

    const user = users.find(u => u.email === email);
    const project = projects.find(p => p.id === projectId);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    if (!project) {
        return res.status(404).json({ message: 'Project not found' });
    }

    const investAmount = parseFloat(amount);

    if (user.money < investAmount) {
        return res.status(400).json({ message: 'Insufficient funds' });
    }

    // Update user balance and project investment
    user.money -= investAmount;
    project.investedAmount += investAmount;

    saveUsers(users);
    saveProjects(projects); // You should have this too

    res.json({
        message: 'Investment successful',
        remainingMoney: user.money,
        newProjectInvestment: project.investedAmount
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});