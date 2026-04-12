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
import PublicRoute from "./components/PublicRoute";
import NotFound from "./pages/NotFound";

import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";

function App() {
  useSocket();
  const location = useLocation();

  return (
    <>
    <div className="relative min-h-screen bg-surface-950 text-surface-200 overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="bg-glow w-125 h-125 bg-primary-500 -top-48 -left-48 opacity-10"></div>
      <div className="bg-glow w-100 h-100 bg-indigo-500 bottom-0 -right-24 opacity-10"></div>
      
      <ToastContainer 
        position="top-right" 
        autoClose={1800} 
        newestOnTop={false} 
        closeOnClick 
        rtl={false} 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
        theme="dark"
      />
      <Header />
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <AnimatePresence mode="wait">
          <motion.div 
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="w-full"
          >
              <Routes location={location} key={location.pathname}>
                <Route element={<PublicRoute />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Route>
                
                <Route path="/" element={<PrivateRoute />} >
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/interview/:sessionId" element={<InterviewRunner />} />
                  <Route path="/review/:sessionId" element={<SessionReview />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </>
  )
}

export default App
