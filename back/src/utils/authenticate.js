const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: 'Токен отсутствует.', error: 'Токен отсутствует.' });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        return next();
    } catch (error) {
        const isExpired = error.name === 'TokenExpiredError';
        return res.status(401).json({
            message: isExpired ? 'Срок действия токена истёк.' : 'Недействительный токен.',
            error: isExpired ? 'Токен истёк.' : 'Недействительный токен.',
            code: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
        });
    }
};

module.exports = authenticate;
