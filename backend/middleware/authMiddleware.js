import jwt from "jsonwebtoken";

const extractToken = (req) => {
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) return header.slice(7);
    if (req.query?.token) return req.query.token;
    return null;
};

export const requireAuth = (req, res, next) => {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: "Authentication required" });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { userID: payload.userID, role: payload.role, email: payload.email };
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

export const isAdmin = (req, res, next) => {
    if (req.user && String(req.user.role).toLowerCase() === "admin") {
        next();
    } else {
        res.status(403).json({ error: "Access denied." });
    }
};