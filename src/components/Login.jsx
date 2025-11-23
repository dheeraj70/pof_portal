// src/pages/Login.jsx
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // if logged in already → go home
  if (user) {
    navigate("/today");
  }

  const handleGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    navigate("/today"); // FORCE redirect after login
  };

  return (
    <div className="p-6 text-center">
      <h2>Welcome to</h2>
      <h1 className="text-4xl font-bold mb-6">Path of Five</h1>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded-xl"
        onClick={handleGoogle}
      >
        Sign in with Google
      </button>
    </div>
  );
}
