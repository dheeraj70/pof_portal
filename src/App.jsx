import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import TodayPage from "./components/TodayPage";
import DashboardPage from "./components/DashboardPage";
import HabitMetaPage from "./components/HabitMetaPage";
import HabitMetaViewPage from "./components/HabitMetaViewPage";
import HabitDetailPage from "./components/HabitDetailPage";
import LoginPage from "./components/Login";
import Nav from "./components/Nav";
import ProtectedRoute from "./ProtectedRoute";


export default function App() {
  return (
    <BrowserRouter>
      <div className="p-4 pt-0 max-w-xl mx-auto">
        <Routes>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/today" element={<ProtectedRoute><TodayPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/cyourpath" element={<ProtectedRoute><HabitMetaPage /></ProtectedRoute>} />
          <Route path="/yourpath" element={<ProtectedRoute><HabitMetaViewPage /></ProtectedRoute>} />
          <Route path="/yourpath/:habit" element={<ProtectedRoute><HabitDetailPage /></ProtectedRoute>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
