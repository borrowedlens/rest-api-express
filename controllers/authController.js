const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    bcrypt
        .hash(password, 12)
        .then((hashed) => {
            const user = new User({
                email: email,
                password: hashed,
                name: name,
            });
            return user.save();
        })
        .then((user) => {
            res.status(200).json({
                message: 'User created successfully',
                userId: user._id,
            });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.login = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loginUser;
    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            const error = new Error('User not found with that email');
            error.statusCode = 401;
            throw error;
        }
        loginUser = user;
        const result = await bcrypt.compare(password, user.password);
        if (!result) {
            const error = new Error('Wrong Password');
            error.statusCode = 401;
            throw error;
        }
        const token = jwt.sign(
            {
                email: loginUser.email,
                userId: loginUser._id.toString(),
            },
            'somesupersupersecret',
            {
                expiresIn: '1h',
            }
        );
        res.status(200).json({
            token: token,
            userId: loginUser._id.toString(),
        });
        return;
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
        return err;
    }
};

exports.getUserStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        console.log("exports.getUserStatus -> user", user)
        if (!user) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ status: user.status });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.updateUserStatus = async (req, res, next) => {
    const newStatus = req.body.status;
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }
        user.status = newStatus;
        await user.save();
        res.status(200).json({ message: 'User updated.' });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
