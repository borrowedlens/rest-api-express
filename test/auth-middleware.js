const expect = require('chai').expect;
const sinon = require('sinon');
const jwt = require('jsonwebtoken');

const authMiddleware = require('../middleware/is-auth');

describe('Auth Middleware', () => {
    it('should throw an error if authentication header is not present', () => {
        const req = {
            get: () => {
                return null;
            },
        };
        expect(() => authMiddleware.authToken(req, {}, () => {})).to.throw(
            'Not Authenticated.'
        );
    });

    it('should throw an error if authentication header is a single string', () => {
        const req = {
            get: () => {
                return 'abafoljlkdf';
            },
        };
        expect(() => authMiddleware.authToken(req, {}, () => {})).to.throw();
    });
    it('should confirm req object has userId is jwt token is verified', () => {
        const req = {
            get: () => {
                return 'Bearer afdsgfdsg'
            }
        }
        sinon.stub(jwt, 'verify');
        jwt.verify.returns({ userId: 'sadfgsdg'});
        authMiddleware.authToken(req, {}, () => {});
        expect(req).to.have.property('userId');
        expect(req).to.have.property('userId', 'sadfgsdg'); // for checking the value
        expect(jwt.verify.called).to.be.true;
        jwt.verify.restore();
    })
});
