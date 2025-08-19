const jwt = require('jsonwebtoken');
const pool = require('../config/db')

function verifyAuthToken(req, res, next) {
    let authHeader = req.headers.authorization;
    if (authHeader == undefined || authHeader === "") {
        return res.status(401).send({
            status: false,
            message: "No token provided"
        });
    }
    let token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
        if (err) {
            return res.status(401).send({
                error: "Authentication failed"
            });
        }
        req.user = { id: decode.user_id, role: decode.role, email: decode.email };
        next();
    });
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to access this resource",
      });
    }
    next();
  };
}

module.exports = {
  verifyAuthToken,
  authorizeRoles
};