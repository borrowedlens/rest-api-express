const express = require('express');
const { body } = require('express-validator');

const User = require('../models/user');
const authController = require('../controllers/authController');
const isAuth = require('../middleware/is-auth');


const router = express.Router();

router.put('/signup', [
    body('email')
        .isEmail()
        .custom((value, { req }) => {
            return User.findOne({ email: value }).then((user) => {
                if (user) {
                    return Promise.reject(
                        'User already exists for that email address'
                    );
                }
            });
        })
        .normalizeEmail(),
    body('name').trim().not().isEmpty(),
    body('password').trim().isLength({ min: 5 }),
], authController.signup);

router.post('/login', authController.login);

router.get('/status', isAuth.authToken, authController.getUserStatus);

router.patch(
  '/status',
  isAuth.authToken,
  [
    body('status')
      .trim()
      .not()
      .isEmpty()
  ],
  authController.updateUserStatus
);

module.exports = router;
