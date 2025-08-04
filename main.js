// mergedServer.js
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const IMG_FOLDER = path.join(__dirname, 'connect', 'img');
const POSTS_FILE = path.join(__dirname, 'connect', 'posts.json');

// Ensure folders exist
if (!fs.existsSync(IMG_FOLDER)) fs.mkdirSync(IMG_FOLDER, { recursive: true });

const HACKATON_IMG_FOLDER = path.join(__dirname, 'hackaton', 'img');
if (!fs.existsSync(HACKATON_IMG_FOLDER)) fs.mkdirSync(HACKATON_IMG_FOLDER, { recursive: true });

const EVENT_IMG_FOLDER = path.join(__dirname, 'hackaton', 'event_images');
if (!fs.existsSync(EVENT_IMG_FOLDER)) fs.mkdirSync(EVENT_IMG_FOLDER, { recursive: true });

const CHAT_IMG_FOLDER = path.join(__dirname, 'hackaton', 'chat_images');
if (!fs.existsSync(CHAT_IMG_FOLDER)) fs.mkdirSync(CHAT_IMG_FOLDER, { recursive: true });

const CONNECT_CHATS_FILE = path.join(__dirname, 'connect', 'chats.json');

// Setup Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userEmail = req.body.email;
        const userFolder = path.join(IMG_FOLDER, userEmail);
        if (!fs.existsSync(userFolder)) fs.mkdirSync(userFolder, { recursive: true });
        cb(null, userFolder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});
const upload = multer({ storage });

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

// Static file routes
app.use('/connect/img', (req, res, next) => {
    console.log(`📸 Static image request: ${req.path}`);
    next();
}, express.static(IMG_FOLDER));

app.use('/hackaton/img', express.static(HACKATON_IMG_FOLDER));
app.use('/hackaton/event_images', express.static(EVENT_IMG_FOLDER));
app.use('/hackaton/chat_images', express.static(CHAT_IMG_FOLDER));

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


const hackatonStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userEmail = req.body.email;
        const eventId = req.body.eventId;
        if (!userEmail || !eventId) return cb(new Error('Missing email or eventId'));

        const targetFolder = path.join(HACKATON_IMG_FOLDER, userEmail, eventId);
        if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder, { recursive: true });

        cb(null, targetFolder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});
const hackatonUpload = multer({ storage: hackatonStorage });

// === Paths ===
const hackatonPaths = {
    USERS_FILE: path.join(__dirname, 'hackaton', 'users.json'),
    PROJECTS_FILE: path.join(__dirname, 'hackaton', 'projects.json'),
    CHATS_FILE: path.join(__dirname, 'hackaton', 'chats.json'),
    EVENTS_FILE: path.join(__dirname, 'hackaton', 'events.json')  // new

};

const connectPaths = {
    USERS_FILE: path.join(__dirname, 'connect', 'users.json')
};

const START_MONEY = 1000;

// === Routes ===

//register for the hackaton and connect apps.
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

        const newUser = {
            email,
            password,
            name,
            bio,
            bals,
            followers: [],
            following: []
        };

        users.push(newUser);
        saveJSON(connectPaths.USERS_FILE, users);
        log('Connect', 'User registered', email);
        return res.json({message: 'User registered successfully', user: newUser});
    }

    res.status(400).json({error: 'Invalid type'});
});


//login route for hackaton and connect app.
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

//Getting all users in hackaton app
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

//Getting profile of user in hackaton app.
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

//returns all projects in hackaton app.
app.get('/projects', (req, res) => {
    const {type} = req.query;
    if (type == 1) {
        log('Hackaton', 'Project list requested');
        return res.json(loadJSON(hackatonPaths.PROJECTS_FILE));
    }

    res.status(400).json({error: 'Invalid or unsupported type'});
});

//Chat logic in Hackaton
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

//updates users money in hackaton app.
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

app.post('/hackaton/upload', hackatonUpload.single('image'), (req, res) => {
    const { email, eventId } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const relativePath = `${email}/${eventId}/${req.file.filename}`;
    log('Hackaton', `Image uploaded by ${email} for event ${eventId}: ${relativePath}`);

    res.json({ message: 'Upload successful', imagePath: relativePath });
});

//connect profile gets
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



// Endpoint to follow a user
app.post('/connect/follow', (req, res) => {
    const {from, to} = req.body; // match the SwiftUI app
    const users = loadJSON(connectPaths.USERS_FILE);

    const fromUser = users.find(u => u.email === from);
    const toUser = users.find(u => u.email === to);

    if (!fromUser || !toUser) {
        return res.status(404).json({error: 'User not found'});
    }

    if (!fromUser.following) fromUser.following = [];
    if (!toUser.followers) toUser.followers = [];

    if (!fromUser.following.includes(to)) {
        fromUser.following.push(to);
    }

    if (!toUser.followers.includes(from)) {
        toUser.followers.push(from);
    }

    saveJSON(connectPaths.USERS_FILE, users);
    return res.json({message: 'Followed successfully'});
});

// Endpoint to unfollow a user
app.post('/connect/unfollow', (req, res) => {
    const {from, to} = req.body;
    const users = loadJSON(connectPaths.USERS_FILE);

    const fromUser = users.find(u => u.email === from);
    const toUser = users.find(u => u.email === to);

    if (!fromUser || !toUser) {
        return res.status(404).json({error: 'User not found'});
    }

    fromUser.following = (fromUser.following || []).filter(email => email !== to);
    toUser.followers = (toUser.followers || []).filter(email => email !== from);

    saveJSON(connectPaths.USERS_FILE, users);
    return res.json({message: 'Unfollowed successfully'});
});

// Endpoint to return all connect users (for search purposes)
app.get('/connect/users', (req, res) => {
    const users = loadJSON(connectPaths.USERS_FILE);
    // Return only minimal safe public info
    const publicUsers = users.map(u => ({
        email: u.email,
        name: u.name,
        bio: u.bio,
        followers: u.followers ? u.followers.length : 0,
        following: u.following ? u.following.length : 0
    }));
    return res.json(publicUsers);
});

//Endpoint to search users
app.get('/connect/search', (req, res) => {
    const query = (req.query.query || "").toLowerCase();
    const users = loadJSON(connectPaths.USERS_FILE);

    // Match by name or email (case-insensitive)
    const matched = users.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );

    res.json(matched);
});

app.post('/connect/upload', upload.single('image'), (req, res) => {
    const userEmail = req.body.email;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const relativePath = `${userEmail}/${req.file.filename}`;
    res.json({ message: 'Upload successful', imagePath: relativePath });
});

app.post('/connect/posts/create', (req, res) => {
    const { title, imagePath, creatorEmail } = req.body;
    if (!title || !imagePath || !creatorEmail) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const posts = loadJSON(POSTS_FILE);
    const newPost = {
        id: `post_${Date.now()}`,
        title,
        imagePath,
        creatorEmail,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString()
    };

    posts.push(newPost);
    saveJSON(POSTS_FILE, posts);
    res.json(newPost);
});

app.get('/connect/posts', (req, res) => {
    const posts = loadJSON(POSTS_FILE);
    res.json(posts);
});

app.put('/connect/posts/:id', (req, res) => {
    const posts = loadJSON(POSTS_FILE);
    const index = posts.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Post not found' });

    posts[index] = { ...posts[index], ...req.body };
    saveJSON(POSTS_FILE, posts);
    res.json(posts[index]);
});

app.delete('/connect/posts/:id', (req, res) => {
    let posts = loadJSON(POSTS_FILE);
    const initialLength = posts.length;
    posts = posts.filter(p => p.id !== req.params.id);

    if (posts.length === initialLength) return res.status(404).json({ message: 'Post not found' });

    saveJSON(POSTS_FILE, posts);
    res.json({ message: 'Post deleted' });
});

app.post('/connect/posts/:id/like', (req, res) => {
    const { userEmail } = req.body;
    const posts = loadJSON(POSTS_FILE);
    const post = posts.find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (!post.likes.includes(userEmail)) {
        post.likes.push(userEmail);
    } else {
        post.likes = post.likes.filter(e => e !== userEmail);
    }

    saveJSON(POSTS_FILE, posts);
    res.json({ likes: post.likes });
});

app.post('/connect/posts/:id/comment', (req, res) => {
    const { sender, text } = req.body;
    const posts = loadJSON(POSTS_FILE);
    const post = posts.find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = {
        id: `comment_${Date.now()}`,
        sender,
        text
    };

    post.comments.push(comment);
    saveJSON(POSTS_FILE, posts);
    res.json(comment);
});

app.put('/connect/posts/:id/comment/:commentId', (req, res) => {
    const posts = loadJSON(POSTS_FILE);
    const post = posts.find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.find(c => c.id === req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    comment.text = req.body.text || comment.text;
    saveJSON(POSTS_FILE, posts);
    res.json(comment);
});

app.delete('/connect/posts/:id/comment/:commentId', (req, res) => {
    const posts = loadJSON(POSTS_FILE);
    const post = posts.find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments = post.comments.filter(c => c.id !== req.params.commentId);
    saveJSON(POSTS_FILE, posts);
    res.json({ message: 'Comment deleted' });
});

// GET all chats for a user (1-on-1 and groups)
app.get('/connect/chats/:email', (req, res) => {
    const { email } = req.params;
    const { type } = req.query; // optional filter

    const chats = loadJSON(CONNECT_CHATS_FILE);

    const filtered = chats.filter(chat => chat.participants.includes(email));

    const result = filtered.map(chat => {
        const chatTitle = chat.isGroup
            ? chat.groupName
            : chat.participants.find(p => p !== email) || 'Chat';

        const messages = (chat.messages || []).map(msg => ({
            sender: msg.from,
            content: msg.message,
            timestamp: msg.timestamp
        }));

        return {
            chatId: chat.chatId,
            chatTitle,
            participants: chat.participants,
            isGroup: chat.isGroup || false,
            messages
        };
    });

    log('Connect', `Fetched ${result.length} chats for ${email}`);
    res.json(result);
});

app.post('/connect/chats/send', (req, res) => {
    const { from, to, message } = req.body;

    if (!from || !to || !message) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    const chats = loadJSON(CONNECT_CHATS_FILE);

    // Find the 1-on-1 chat between "from" and "to"
    let chat = chats.find(c =>
        !c.isGroup &&
        c.participants.includes(from) &&
        c.participants.includes(to) &&
        c.participants.length === 2
    );

    if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
    }

    // Append the new message
    chat.messages.push({
        from,
        message,
        timestamp: new Date().toISOString()
    });

    // Save updated chats
    saveJSON(CONNECT_CHATS_FILE, chats);

    log('Connect', `Message sent from ${from} to ${to} in chat ${chat.chatId}`);

    // Respond with success and the chat ID
    res.json({
        success: true,
        chatId: chat.chatId
    });
});

app.get('/connect/chats/debug', (req, res) => {
    const chats = loadJSON(CONNECT_CHATS_FILE);
    res.json(chats);
});

app.post('/connect/chats/create', (req, res) => {
    const { from, to } = req.body;
    if (!from || !to || from === to) {
        return res.status(400).json({ error: 'Invalid participants' });
    }

    const chats = loadJSON(CONNECT_CHATS_FILE);

    const existing = chats.find(c =>
        !c.isGroup &&
        c.participants.includes(from) &&
        c.participants.includes(to)
    );

    if (existing) return res.json({ message: 'Chat already exists', chat: existing });

    const newChat = {
        chatId: `chat_${Date.now()}`,
        participants: [from, to],
        messages: []
    };

    chats.push(newChat);
    saveJSON(CONNECT_CHATS_FILE, chats);

    log('Connect', `Created new chat between ${from} and ${to}`);
    res.json({ message: 'Chat created', chat: newChat });
});

app.post('/connect/chats/group/send', (req, res) => {
    const { chatId, from, message, type } = req.body;

    if (type == 1) {
        const chats = loadJSON(hackatonPaths.CHATS_FILE);
        const chat = chats.find(c => c.chatId === chatId && c.isGroup);

        if (!chat) return res.status(404).json({ message: 'Group chat not found' });

        chat.messages.push({ from, message, timestamp: new Date().toISOString() });
        saveJSON(hackatonPaths.CHATS_FILE, chats);
        return res.json({ success: true });
    }

    res.status(400).json({ error: 'Invalid or unsupported type' });
});

app.post('/connect/chats/group/create', (req, res) => {
    const { groupName, participants, creator, type } = req.body;

    if (type == 1) {
        if (!groupName || !Array.isArray(participants) || participants.length < 2) {
            return res.status(400).json({ message: 'Invalid group data' });
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
        return res.json({ message: 'Group chat created', chat: newGroupChat });
    }

    res.status(400).json({ error: 'Invalid or unsupported type' });
});


app.post('/events/create', (req, res) => {
    const { title, description, amount, isEmergency, imageName, uploadedImagePath, creatorEmail, groupId } = req.body;

    if (!title || !description || !creatorEmail) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    const eventImagePath = uploadedImagePath || `/default_events/${imageName}`;

    const events = loadJSON(hackatonPaths.EVENTS_FILE);

    const newEvent = {
        id: `event_${Date.now()}`,
        title,
        description,
        amount: amount || null,
        isEmergency,
        imagePath: eventImagePath,
        creatorEmail,
        createdAt: new Date().toISOString()
    };

    events.push(newEvent);
    saveJSON(hackatonPaths.EVENTS_FILE, events);
    log('Hackaton', 'Event created', newEvent);

    // If groupId provided, auto-send to group chat
    if (groupId) {
        const chats = loadJSON(hackatonPaths.CHATS_FILE);
        const groupChat = chats.find(c => c.chatId === groupId && c.isGroup);

        if (groupChat) {
            const eventMessage = {
                from: creatorEmail,
                message: `[Event Created] ${title}: ${description}`,
                eventId: newEvent.id,
                timestamp: new Date().toISOString()
            };
            groupChat.messages.push(eventMessage);
            saveJSON(hackatonPaths.CHATS_FILE, chats);
            log('Hackaton', `Event shared in group ${groupId}`, eventMessage);
        }
    }

    return res.json(newEvent);
});
app.get('/events', (req, res) => {
    const events = loadJSON(hackatonPaths.EVENTS_FILE);
    return res.json(events);
});
app.put('/events/:id', (req, res) => {
    const {id} = req.params;
    const updates = req.body;

    const events = loadJSON(hackatonPaths.EVENTS_FILE);
    const index = events.findIndex(e => e.id === id);
    if (index === -1) {
        return res.status(404).json({message: 'Event not found'});
    }

    events[index] = {...events[index], ...updates};
    saveJSON(hackatonPaths.EVENTS_FILE, events);
    log('Hackaton', `Event updated ${id}`, updates);
    return res.json(events[index]);
});



const chatImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, CHAT_IMG_FOLDER);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});
const chatImageUpload = multer({ storage: chatImageStorage });

app.post('/chats/sendImage', chatImageUpload.single('image'), (req, res) => {
    const { from, to, chatId, type } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    if (type == 1) {
        const chats = loadJSON(hackatonPaths.CHATS_FILE);
        const chat = chats.find(c => c.chatId === chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        const imagePath = `/hackaton/chat_images/${req.file.filename}`;
        chat.messages.push({
            from,
            imagePath,
            timestamp: new Date().toISOString()
        });

        saveJSON(hackatonPaths.CHATS_FILE, chats);
        return res.json({ message: 'Image sent', imagePath });
    }

    return res.status(400).json({ error: 'Invalid or unsupported type' });
});

app.listen(PORT, () => {
    console.log(`🚀 Unified server running at http://localhost:${PORT}`);
});