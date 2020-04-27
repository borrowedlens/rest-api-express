const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');
const io = require('../socket');

exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page;
    const perPage = 2;
    let totalItems;
    try {
        totalItems = await Post.find().countDocuments();
        const posts = await Post.find()
            .populate('creator')
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPage)
            .limit(perPage);
        res.status(200).json({
            message: 'Posts fetched successfully',
            posts: posts,
            totalItems: totalItems,
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getPost = (req, res, next) => {
    const id = req.params.postId;
    Post.findById(id)
        .populate('creator')
        .then((post) => {
            if (!post) {
                const error = new Error();
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({
                message: 'Post fetched successfully',
                post: post,
            });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.createPost = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error();
        error.statusCode = 422;
        error.message = 'Please enter a valid input';
        throw error;
    }
    if (!req.file) {
        const error = new Error('No image provided');
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = req.file.path;
    const post = new Post({
        title: title,
        content: content,
        creator: req.userId,
        imageUrl: imageUrl,
    });
    try {
        await post.save();
        const user = await User.findById(req.userId);
        user.posts.push(post);
        const savedUser = await user.save();
        io.getIo().emit('post', {
            action: 'create',
            post: {
                ...post._doc,
                creator: { _id: req.userId, name: user.name },
            },
        });
        res.status(201).json({
            message: 'The post has been created!',
            post: post,
            creator: { name: user.name, _id: user._id },
        });
        console.log("exports.createPost -> savedUser", savedUser)
        return savedUser;
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.updatePost = (req, res, next) => {
    const id = req.params.postId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error();
        error.statusCode = 422;
        error.message = 'Please enter a valid input';
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image || null;
    console.log('exports.updatePost -> imageUrl', imageUrl);
    if (!imageUrl) {
        const error = new Error('Please upload an image');
        error.statusCode = 422;
        throw error;
    }
    if (req.file) {
        imageUrl = req.file.path.replace('\\', '/');
    }
    Post.findById(id)
        .populate('creator')
        .then((post) => {
            if (!post) {
                const error = new Error();
                error.statusCode = 404;
                throw error;
            }
            if (post.creator._id.toString() !== req.userId) {
                const error = new Error('Unauthorized');
                error.statusCode = 403;
                throw error;
            }
            if (imageUrl !== post.imageUrl && imageUrl !== 'undefined') {
                post.imageUrl = imageUrl;
                clearImage(post.imageUrl);
            }
            post.title = title;
            post.content = content;
            return post.save();
        })
        .then((result) => {
            io.getIo().emit('post', { action: 'update', post: result });
            res.status(200).json({
                message: 'Post updated!',
                post: result,
            });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.deletePost = (req, res, next) => {
    const id = req.params.postId;
    Post.findById(id)
        .then((post) => {
            if (!post) {
                const error = new Error();
                error.statusCode = 404;
                throw error;
            }
            if (post.creator.toString() !== req.userId) {
                const error = new Error('Unauthorized');
                error.statusCode = 403;
                throw error;
            }
            clearImage(post.imageUrl);
            return Post.findByIdAndRemove(id);
        })
        .then((result) => {
            return User.findById(req.userId);
        })
        .then((user) => {
            user.posts.pull(id);
            return user.save();
        })
        .then((result) => {
            io.getIo().emit('post', { action: 'delete', postId: id });
            res.status(200).json({
                message: 'Post deleted!',
            });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

const clearImage = (filePath) => {
    const localPath = path.join(__dirname, '..', filePath);
    fs.unlink(localPath, (err) => {
        console.log('clearImage -> err', err);
    });
};
