import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

/**
 * Middleware to protect routes by verifying standard HttpOnly JWT cookies.
 * Attaches the authenticated user to the request object (req.user).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @throws {Error} 401 If token is missing, expired, or invalid.
 */
const protect = asyncHandler(async (req, res, next) => {
    let token = req.cookies.jwt;
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select("-password");
            if (!req.user) {
                res.status(401);
                throw new Error("Not authorized, no user found");
            }
            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error("Not authorized, token failed");
        }
    } else {
        res.status(401);
        throw new Error("Not authorized, no token");
    }
});

export { protect };