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

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (password) {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
};

export default mongoose.model("User", userSchema);