const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const JWT_SECRET = 'your_jwt_secret';

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Connect to local MongoDB
mongoose.connect('mongodb://localhost:27017/')
.then(() => console.log('MongoDB connected...'))
.catch(err => console.log(err));

// User schema and model
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: String,
    gender: String
});``

const User = mongoose.model('User', userSchema);



// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//Middleware to protect routes
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    console.log('Token:', token);
    if (!token) {
        return res.status(401).redirect('/login.html'); // Redirect to login if no token
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach decoded token data to request object
        next();
    } catch (err) {
        console.error(err);
        return res.status(403).redirect('/login.html'); // Token is invalid or expired
    }
};
// Signup route
app.post('/auth/signup', async (req, res) => {
    const { name, email, password, phone, gender } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return (res.status(400).send("User already Exists!! Please Signup again"))
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            gender
        });

        await newUser.save();
        return res.status(200).send("Signup successful!! Please login to continue");;
    } catch (err) {
        console.error(err);
        res.status(500).redirect('/servererror.html');
    }
});

// Login route
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).redirect('/invalidcredentials.html');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).redirect('/invalidcredentials.html');
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: false }).status(200).send("Login successful");
    } catch (err) {
        console.error(err);
        res.status(500).redirect('/servererror.html');
    }
});
// Protected route for books.html
app.get('/books.html', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'books.html'));
});

// Logout route
app.get('/auth/logout', (req, res) => {
    res.clearCookie('token').redirect('/login.html'); // Clear the token cookie and redirect to login
});
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
