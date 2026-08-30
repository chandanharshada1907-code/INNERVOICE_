const jwt = require("jsonwebtoken");

// ======================================
// JWT AUTHENTICATION MIDDLEWARE
// Verifies the Bearer token in the
// Authorization header before allowing
// access to any protected route.
// ======================================

function verifyToken(req, res, next) {

    const authHeader = req.headers["authorization"];

    // Expect header: "Authorization: Bearer <token>"
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Access denied. No token provided."
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const uid = decoded.id || decoded.user_id;
        decoded.id = uid;
        decoded.user_id = uid;

        // Attach the decoded user payload to req.user
        req.user = decoded;

        next();

    } catch (err) {

        return res.status(403).json({
            success: false,
            message: "Invalid or expired token. Please login again."
        });

    }
}

module.exports = verifyToken;
