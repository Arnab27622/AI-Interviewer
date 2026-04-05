import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

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
app.set("io", io);

app.get("/", (req, res) => {
    res.send("API is running...");
});


app.use("/api/user", userRoutes);
app.use("/api/sessions", sessionRoutes);

app.use(notFound);
app.use(errorHandler);

io.on("connection", (socket) => {
    console.log("A user connected");
    const userId = socket.handshake.query.userId;
    if (userId) {
        socket.join(userId);
        console.log(`User ${userId} joined room`);
    }

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});