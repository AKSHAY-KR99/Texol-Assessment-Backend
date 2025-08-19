const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const { verifyAuthToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/testing', (req, res) => {
    return res.status(200).send({ success: true, message: "API runs" })
});

router.post('/create', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const insertQuery = `
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
        `;
        pool.query(insertQuery, [name, email, hashedPassword], (err, results) => {
            if (err) {
                console.error('DB Error:', err);
                return res.status(500).send({ error: err.message });
            }
            return res.status(201).send({ success: true, message: 'User created successfully.' });
        });
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).send({ error: err.message });
    }
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required',
        });
    }

    const query = 'SELECT user_id, name, email, password, role FROM users WHERE email = ?';

    pool.query(query, [email], (err, results) => {
        if (err) {
            console.error('DB Error:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err,
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Bcrypt Error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Internal error during password comparison',
                });
            }

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password',
                });
            }


            const token = jwt.sign(
                {
                    user_id: user.user_id,
                    email: user.email,
                    role: user.role,
                },
                process.env.JWT_SECRET,
                { expiresIn: '5h' }
            );
            return res.status(200).json({
                success: true, message: 'Login successful', token
            });
        });
    });
});

router.get('/current_user', verifyAuthToken, (req, res) => {
    return res.status(200).send({ id: req.user.id, email: req.user.email, role: req.user.role })
});

module.exports = router;




