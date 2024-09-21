const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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

        return res.status(200).send("Login successful");
    } catch (err) {
        console.error(err);
        res.status(500).redirect('/servererror.html');
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
