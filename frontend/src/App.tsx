import { Routes, Route } from "react-router-dom";
import useSocket from "./hooks/useSocket";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from "./components/Header";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import InterviewRunner from "./pages/InterviewRunner";
import SessionReview from "./pages/SessionReview";
import Profile from "./pages/Profile";
import PrivateRoute from "./components/PrivateRoute";
import NotFound from "./pages/NotFound";

function App() {
  useSocket();
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <ToastContainer position="top-right" autoClose={1800} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        <Header />
        <main className="container mx-auto p-4">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateRoute />} >
              <Route path="/" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/interview/:sessionId" element={<InterviewRunner />} />
              <Route path="/review/:sessionId" element={<SessionReview />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </>
  )
}

export default App
