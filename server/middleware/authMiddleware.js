const jwt = require("jsonwebtoken");

/* =========================================================
   AUTHENTICATION MIDDLEWARE
   ========================================================= */

const authMiddleware = (req, res, next) => {
  try {
    /* -----------------------------
       GET TOKEN FROM HEADER
    ----------------------------- */

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
    }

    const token = authHeader.split(" ")[1];

    /* -----------------------------
       VERIFY TOKEN
    ----------------------------- */

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    /* -----------------------------
       ATTACH USER TO REQUEST
    ----------------------------- */

    req.user = decoded;

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};


/* =========================================================
   EXPORT
   ========================================================= */

module.exports = authMiddleware;