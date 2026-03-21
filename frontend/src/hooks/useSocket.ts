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

    useEffect(() => {
        if (user && (user._id || user.id)) {
            const socket: Socket = io(BACKEND_URL, {
                query: { userId: user._id || user.id },
                transports: ["websocket"]
            });

            socketRef.current = socket;
            
            socket.on('connect', () => {
                console.log('Connected to socket');
            });
            
            socket.on('disconnect', () => {
                console.log('Disconnected from socket');
            });
            
            socket.on('sessionUpdate', (data: SocketUpdatePayload) => {
                console.log('Session updated', data);
                dispatch(socketUpdateSession(data));
                
                if (data.status === 'session completed') {
                    navigate(`/interview/${data.sessionId}`);
                }
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [user, dispatch, navigate]);

    return socketRef;
};

export default useSocket;