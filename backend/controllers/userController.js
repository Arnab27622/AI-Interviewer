import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    // process.env.GOOGLE_REDIRECT_URI
);

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "3d" });
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
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id),
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
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            preferredRole: user.preferredRole,
            token: generateToken(user._id),
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
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            preferredRole: user.preferredRole,
            token: generateToken(user._id),
        });
    } else {
        user = await User.create({
            name,
            email,
            googleId,
            password: null,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                preferredRole: user.preferredRole,
                token: generateToken(user._id),
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
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.preferredRole = req.body.preferredRole || user.preferredRole;

        if (req.body.password) {
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

export { registerUser, loginUser, googleLogin, getUserProfile, updateUserProfile };