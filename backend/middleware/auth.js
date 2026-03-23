const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        console.log(`[Auth Middleware] No Authorization header for ${req.method} ${req.url}`);
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log(`[Auth Middleware] Token verified for user: ${decoded.userId} on ${req.method} ${req.url}`);
        next();
    } catch (err) {
        console.error(`[Auth Middleware] Token verification failed for ${req.method} ${req.url}:`, err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};
