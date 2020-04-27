
//For learning testing


exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loginUser;
    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                const error = new Error('User not found with that email');
                error.statusCode = 401;
                throw error;
            }
            loginUser = user;
            return bcrypt.compare(password, user.password);
        })
        .then((result) => {
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
                token: token, userId: loginUser._id.toString()
            })
            return;
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
            return err;
        });
};
