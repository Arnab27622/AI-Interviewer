interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    token: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isError: boolean;
    message: string;
    isSuccess: boolean;
    isLoading: boolean;
}

export type { User, AuthState };