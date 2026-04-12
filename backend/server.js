import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cors from "cors";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import cookieParser from "cookie-parser";

connectDB();

const app = express();
const server = http.createServer(app);
const allowOrigin = process.env.FRONTEND_URL || "http://localhost:3000";
const io = new Server(server, {
    cors: {
        origin: allowOrigin,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
    },
});

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowOrigin === origin || allowOrigin.split(',').map(o => o.trim()).includes(origin)) {
            callback(null, true);
        } else {
            if (process.env.NODE_ENV === "development") {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("io", io);

app.get("/", (req, res) => {
    res.send("API is running...");
});


app.use("/api/user", userRoutes);
app.use("/api/sessions", sessionRoutes);

app.use(notFound);
app.use(errorHandler);

io.use((socket, next) => {
    let token = socket.handshake.auth.token || socket.handshake.query.token;
    
    // Supplement missing auth header bindings by reading raw HTTPOnly cookie layer context
    if (socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';').reduce((acc, c) => {
            const [k, v] = c.trim().split('=');
            acc[k] = v;
            return acc;
        }, {});
        if (cookies.jwt) token = cookies.jwt;
    }

    if (!token) {
        return next(new Error("Authentication error: No token provided"));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded; // Store decoded user info in socket
        next();
    } catch (err) {
        return next(new Error("Authentication error: Invalid token"));
    }
});

io.on("connection", (socket) => {
    console.log("An authenticated user connected");
    const userId = socket.handshake.query.userId;
    
    // Ensure the decoded user ID matches the requested room ID
    if (userId && socket.user && (socket.user.id === userId || socket.user._id === userId)) {
        socket.join(userId);
        console.log(`User ${userId} joined room securely`);
    } else if (userId) {
        console.warn(`Unauthorized room join attempt for ${userId} by ${socket.user?.id}`);
        socket.emit("error", "Unauthorized access to this room");
    }

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});