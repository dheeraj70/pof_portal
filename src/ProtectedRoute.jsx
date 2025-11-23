import { auth } from "./firebase";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  return auth.currentUser ? children : <Navigate to="/login" />;
}
