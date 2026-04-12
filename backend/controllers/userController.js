import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

const generateTokenInCookie = (res, id) => {
    const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "3d" });
    res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "none",
        maxAge: 3 * 24 * 60 * 60 * 1000,
    });
};

const registerUser = asyncHandler(async (req, res) => {
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
        generateTokenInCookie(res, user._id);
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

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400);
        throw new Error("Please provide all fields");
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        generateTokenInCookie(res, user._id);
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

const googleLogin = asyncHandler(async (req, res) => {
    const { token } = req.body;
    if (!token) {
        res.status(400);
        throw new Error("Please provide token");
    }

    const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email_verified, name, email, sub: googleId } = payload;

    if (!email_verified) {
        res.status(400);
        throw new Error("Email not verified");
    }

    let user = await User.findOne({ email });

    if (user) {
        if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }
        generateTokenInCookie(res, user._id);
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
            password: null,
        });

        if (user) {
            generateTokenInCookie(res, user._id);
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

const getUserProfile = asyncHandler(async (req, res) => {
    if (req.user) {
        res.status(200).json({
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            preferredRole: req.user.preferredRole,
        });
    } else {
        res.status(401);
        throw new Error("User not found");
    }
});

const updateUserProfile = asyncHandler(async (req, res) => {
    if (req.user) {
        const user = await User.findById(req.user._id);
        if (!user) {
            res.status(401);
            throw new Error("User not found");
        }

        user.name = req.body?.name || user.name;
        user.email = req.body?.email || user.email;
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

const logoutUser = asyncHandler(async (req, res) => {
    res.cookie("jwt", "", {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: "Logged out successfully" });
});

export { registerUser, loginUser, googleLogin, logoutUser, getUserProfile, updateUserProfile };