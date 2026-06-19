import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { User } from "../models/User.js";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { RefreshToken } from "../models/RefreshToken.js";

// Augment Express Request interface to include the user
import { AuthenticatedRequest } from "../types/express.js";

/**
 * Generates a JWT access token and a refresh token, saves the refresh token to DB,
 * and sets them as HttpOnly cookies in the response.
 * @param {Response} res - Express response object.
 * @param {string} id - User ID to sign the token for.
 */
const generateTokenInCookie = async (res: Response, id: string) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error("JWT_SECRET is not defined");

    // Short-lived access token
    const accessToken = jwt.sign({ id }, jwtSecret, { expiresIn: "15m" });

    // Long-lived refresh token
    const refreshTokenString = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await RefreshToken.create({
        userId: id,
        token: refreshTokenString,
        expiresAt,
    });

    res.cookie("jwt", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: process.env.NODE_ENV !== "development" ? "none" : "lax",
        maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie("refresh_jwt", refreshTokenString, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: process.env.NODE_ENV !== "development" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};

/**
 * @desc Register a new user with name, email, and password.
 * @route POST /api/user/register
 * @access Public
 */
const registerUser = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        res.status(400);
        throw new Error("Please provide all fields");
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error("User already exists");
    }

    const user = await User.create({
        name,
        email,
        password,
    });

    if (user) {
        await generateTokenInCookie(res, (user._id as any).toString());
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
        });
    } else {
        res.status(400);
        throw new Error("Invalid user data");
    }
});

/**
 * @desc Authenticate user and get token.
 * @route POST /api/user/login
 * @access Public
 */
const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400);
        throw new Error("Please provide all fields");
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        await generateTokenInCookie(res, (user._id as any).toString());
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            preferredRole: user.preferredRole,
        });
    } else {
        res.status(401);
        throw new Error("Invalid email or password");
    }
});

/**
 * @desc Google OAuth Login / Registration.
 * @route POST /api/user/google-login
 * @access Public
 */
const googleLogin = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
    if (!token) {
        res.status(400);
        throw new Error("Please provide token");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId) {
        res.status(500);
        throw new Error("Google Client ID not configured");
    }

    const client = new OAuth2Client(clientId, clientSecret);

    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
        res.status(400);
        throw new Error("Invalid Google token");
    }

    const { email_verified, name, email, sub: googleId } = payload;

    if (!email_verified || !email) {
        res.status(400);
        throw new Error("Email not verified by Google");
    }

    let user: any = await User.findOne({ email });

    if (user) {
        if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }
        await generateTokenInCookie(res, (user._id as any).toString());
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            preferredRole: user.preferredRole,
        });
    } else {
        user = await User.create({
            name,
            email,
            googleId,
        });

        if (user) {
            await generateTokenInCookie(res, (user._id as any).toString());
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                preferredRole: user.preferredRole,
            });
        } else {
            res.status(400);
            throw new Error("Invalid user data");
        }
    }
});

/**
 * @desc Get user profile data.
 * @route GET /api/user/profile
 * @access Private
 */
const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (authReq.user) {
        res.status(200).json({
            _id: authReq.user._id || authReq.user.id,
            name: authReq.user.name,
            email: authReq.user.email,
            preferredRole: authReq.user.preferredRole,
        });
    } else {
        res.status(401);
        throw new Error("User not found");
    }
});

/**
 * @desc Update user profile data.
 * @route PUT /api/user/profile
 * @access Private
 */
const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (authReq.user) {
        const user = await User.findById(authReq.user._id || authReq.user.id);
        if (!user) {
            res.status(401);
            throw new Error("User not found");
        }

        if (req.body?.email && req.body.email !== user.email) {
            const emailTaken = await User.findOne({ email: req.body.email });
            if (emailTaken) {
                res.status(400);
                throw new Error("Email is already in use");
            }
            user.email = req.body.email;
        }

        user.name = req.body?.name || user.name;
        user.preferredRole = req.body?.preferredRole || user.preferredRole;

        if (req.body?.password) {
            user.password = req.body.password;
        }

        await user.save();
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            preferredRole: user.preferredRole,
        });
    } else {
        res.status(401);
        throw new Error("User not found");
    }
});

/**
 * @desc Refresh access token using refresh token.
 * @route POST /api/user/refresh
 * @access Public
 */
const refreshUserToken = asyncHandler(async (req: Request, res: Response) => {
    const incomingRefreshToken = req.cookies.refresh_jwt;

    if (!incomingRefreshToken) {
        res.status(401);
        throw new Error("Refresh token not found");
    }

    // Validate refresh token in DB
    const storedToken = await RefreshToken.findOne({ token: incomingRefreshToken });

    if (!storedToken) {
        // Token was not found. For security, we just clear the cookies.
        res.cookie("jwt", "", { maxAge: 0 });
        res.cookie("refresh_jwt", "", { maxAge: 0 });
        res.status(401);
        throw new Error("Invalid refresh token");
    }

    // Token exists, is it expired?
    if (new Date() > storedToken.expiresAt) {
        await RefreshToken.deleteOne({ _id: storedToken._id });
        res.cookie("jwt", "", { maxAge: 0 });
        res.cookie("refresh_jwt", "", { maxAge: 0 });
        res.status(401);
        throw new Error("Refresh token expired");
    }

    // Valid. Delete the old refresh token (rotation) and issue a new pair
    await RefreshToken.deleteOne({ _id: storedToken._id });

    // Generate new pair
    await generateTokenInCookie(res, storedToken.userId.toString());

    res.status(200).json({ message: "Token refreshed successfully" });
});

/**
 * @desc Logout user by clearing HTTP-only JWT cookie.
 * @route POST /api/user/logout
 * @access Private
 */
const logoutUser = asyncHandler(async (req: Request, res: Response) => {
    const incomingRefreshToken = req.cookies.refresh_jwt;
    if (incomingRefreshToken) {
        // Remove token from database to prevent reuse
        await RefreshToken.deleteOne({ token: incomingRefreshToken });
    }

    res.cookie("jwt", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: process.env.NODE_ENV !== "development" ? "none" : "lax",
        expires: new Date(0),
    });

    res.cookie("refresh_jwt", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: process.env.NODE_ENV !== "development" ? "none" : "lax",
        expires: new Date(0),
    });

    res.status(200).json({ message: "Logged out successfully" });
});

export { registerUser, loginUser, googleLogin, logoutUser, getUserProfile, updateUserProfile, refreshUserToken };
