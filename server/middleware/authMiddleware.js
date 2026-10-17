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

    const match = typeof authHeader === "string" && /^Bearer +([^\s]+)$/i.exec(authHeader);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
    }

    const token = match[1];

    /* -----------------------------
       VERIFY TOKEN
    ----------------------------- */

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    if (!decoded || typeof decoded !== "object" ||
        !Number.isFinite(decoded.exp) ||
        typeof decoded.id !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded.id)) {
      throw new Error("Invalid session claims");
    }

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
