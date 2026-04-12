import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { socketUpdateSession } from "../features/session/sessionSlice";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import type { RootState } from "../app/store";
import type { SocketUpdatePayload } from "../types/session";

const BACKEND_URL = import.meta.env.VITE_API_URL.replace("/api", "");

const useSocket = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const socketRef = useRef<Socket | null>(null);
    const user = useSelector((state: RootState) => state.auth.user);

    // Store dispatch and navigate in refs so they don't cause socket effect re-runs
    const dispatchRef = useRef(dispatch);
    const navigateRef = useRef(navigate);

    // Update refs in a separate effect (React 19 disallows ref updates during render)
    useEffect(() => {
        dispatchRef.current = dispatch;
        navigateRef.current = navigate;
    }, [dispatch, navigate]);

    const userId = user?._id || user?.id;

    useEffect(() => {
        if (!userId) return;

        // Don't create a new socket if one already exists for this user
        if (socketRef.current?.connected) return;

        const socket: Socket = io(BACKEND_URL, {
            query: { userId },
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to socket');
        });

        socket.on('disconnect', (reason) => {
            console.log('Disconnected from socket:', reason);
        });

        socket.on('sessionUpdate', (data: SocketUpdatePayload) => {
            console.log('Session updated', data);
            dispatchRef.current(socketUpdateSession(data));

            const status = (data.status || "").toUpperCase();
            if (status.includes("COMPLETED") || status === "QUESTIONS_READY") {
                navigateRef.current(`/interview/${data.sessionId}`);
            }
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [userId]);  // Only re-run when the user ID changes

    return socketRef;
};

export default useSocket;