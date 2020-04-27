const expect = require('chai').expect;
const sinon = require('sinon');
const mongoose = require('mongoose');

const User = require('../models/user');
const authController = require('../controllers/authController');

describe('Auth Controller', () => {
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
        sinon.stub(User, 'findOne');
        User.findOne.throws();

        const req = {
            body: {
                email: 'test@test.com',
                password: 'tester',
            },
        };
        authController
            .login(req, {}, () => {})
            .then((result) => {
                expect(result).to.be.an('error');
                expect(result).to.have.property('statusCode', 500);
                done();
            });
        User.findOne.restore();
    });

    it('should send back valid user response for an existing user', (done) => {
        const req = {
            userId: '5e9d3bdddf8452171827077d',
        };
        const res = {
            statusCode: 0,
            userStatus: null,
            status: function (code) {
                this.statusCode = code;
                return this;
            },
            json: function (data) {
                this.userStatus = data.status;
            },
        };
        authController
            .getUserStatus(req, res, () => {})
            .then(() => {
                expect(res.statusCode).to.be.equal(200);
                expect(res.userStatus).to.be.equal('New');
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
