/**
 * @module UserModel
 * @description Mongoose schema and model for User entities.
 * Supports standard email/password authentication as well as Google OAuth.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: function () { return !this.googleId }
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    preferredRole: {
        type: String,
        default: "Full Stack Developer"
    }
}, {
    timestamps: true
});

/**
 * Hash password before saving to the database.
 */
userSchema.pre("save", async function () {
    if (!this.isModified("password") || !this.password) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Compare entered password with the hashed password in the database.
 * @param {string} password - The plain text password to check.
 * @returns {Promise<boolean>}
 */
userSchema.methods.matchPassword = async function (password) {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
};

export default mongoose.model("User", userSchema);