import React from 'react';
import { Link } from 'react-router-dom';
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";


export default function Nav() {
    const navigate = useNavigate();

  return (
    <div>
        <div className="text-center pb-4 pt-4 text-lg font-bold relative">Path of Five
          <Link className="text-4xl absolute right-1 bottom-3.5" to="/cyourpath"><img className="w-9 h-9" src="gear.svg" alt="Change" /></Link>
        </div>
        <nav className="flex justify-between mb-4">
          <Link className="px-3 py-1 border rounded" to="/today">Today</Link>
          
          <Link className="px-3 py-1 border rounded" to="/yourpath">Your Path</Link>
          <Link className="px-3 py-1 border rounded" to="/dashboard">Dashboard</Link>
          <button
  onClick={() => { 
    signOut(auth);
    navigate("/");
  }}
>
  Logout
</button>
        </nav>
</div>
  )
}
