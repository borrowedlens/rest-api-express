const expect = require('chai').expect;
const sinon = require('sinon');
const mongoose = require('mongoose');

const User = require('../models/user');
const feedController = require('../controllers/feedController');
const io = require('../socket');

describe('Feed Controller', () => {
    before((done) => {
        mongoose
            .connect(
                'mongodb+srv://VivekPrasad:wengerknows@cluster0-ulb7d.mongodb.net/test-messages?retryWrites=true&w=majority',
                {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                }
            )
            .then(() => {
                const user = new User({
                    email: 'test@test.com',
                    password: 'tester',
                    name: 'TestUser',
                    posts: [],
                    _id: '5e9d3bdddf8452171827077d',
                });
                return user.save();
            })
            .then(() => {
                done();
            });
    });
    it('should throw an error with status 500 if finding a user fails', (done) => {
        sinon.stub(io, 'getIo').callsFake(() => {
            return {
                emit: () => {}
            }
        });
        const req = {
            body: {
                title: 'TestTitle',
                content: 'TestContent',
            },
            file: {
                path: 'Testpath',
            },
            userId: '5e9d3bdddf8452171827077d',
        };
        const res = {
            status: function (code) {
                return this;
            },
            json: function () {},
        };
        feedController
            .createPost(req, res, () => {})
            .then((savedUser) => {
                console.log('savedUser', savedUser);
                expect(savedUser).to.have.property('posts');
                expect(savedUser.posts).to.have.length(1);
                done();
            });
    });

    after((done) => {
        User.deleteMany({})
            .then(() => {
                return mongoose.disconnect();
            })
            .then(() => {
                done();
            });
    });
});
