const express = require('express');
const { body } = require('express-validator');

const feedController = require('../controllers/feedController');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/posts', isAuth.authToken, feedController.getPosts);

router.get('/post/:postId', isAuth.authToken, feedController.getPost);

router.post(
    '/post',
    isAuth.authToken,
    [
        body('title').isString().trim().isLength({ min: 5 }),
        body('content').isString().trim().isLength({ min: 5 }),
    ],
    feedController.createPost
);

router.put(
    '/post/:postId',
    isAuth.authToken,
    [
        body('title').isString().trim().isLength({ min: 5 }),
        body('content').isString().trim().isLength({ min: 5 }),
    ],
    feedController.updatePost
);

router.delete('/post/:postId', isAuth.authToken, feedController.deletePost);

module.exports = router;
