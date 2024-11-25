const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Render login page
router.get('/login', (req, res) => {
    res.render('login');
});

// Render register page
router.get('/register', (req, res) => {
    res.render('register');
});

// Handle login POST request
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).render('login', { 
                error: 'Invalid credentials' 
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).render('login', { 
                error: 'Invalid credentials' 
            });
        }

        // Create token
        const token = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Set cookie and redirect
        res.cookie('token', token, { httpOnly: true });
        res.redirect(user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).render('login', { 
            error: 'Server error, please try again' 
        });
    }
});

// Handle register POST request
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).render('register', { 
                error: 'Username already exists' 
            });
        }

        // Create new user
        user = new User({
            username,
            password,
            role: 'user' // Default role
        });

        await user.save();

        // Create token
        const token = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Set cookie and redirect
        res.cookie('token', token, { httpOnly: true });
        res.redirect('/user/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).render('register', { 
            error: 'Server error, please try again' 
        });
    }
});

// Logout route
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/auth/login');
});

module.exports = router; 