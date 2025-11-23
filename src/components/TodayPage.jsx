import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Nav from "./Nav";

export default function TodayPage() {
  const habitOrder = ["middle", "index", "thumb", "ring", "pinky"]; // fixed order
  const defaultState = {
    middle: false,
    index: false,
    thumb: false,
    ring: false,
    pinky: false,
  };

  const [user, setUser] = useState(null);
  const [checks, setChecks] = useState(defaultState);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);

  // Listen for login state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  // Load today's data once user is available
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const ref = doc(db, `users/${user.uid}/days/${today}`);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setChecks(snap.data());
      } else {
        await setDoc(ref, defaultState);
        setChecks(defaultState);
      }

      setLoading(false);
    };

    load();
  }, [user, today]);

  // Toggle habit
  const toggle = async (key) => {
    if (!user) return;

    const updated = { ...checks, [key]: !checks[key] };
    setChecks(updated);

    const ref = doc(db, `users/${user.uid}/days/${today}`);
    await setDoc(ref, updated, { merge: true });
  };

  if (loading) {
    return (
      <>
        <Nav />
        <div className="p-4 text-center">Loading...</div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="p-4 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Today</h1>

        <div className="space-y-3">
          {habitOrder.map((key) => (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border shadow-sm 
                transition-all active:scale-[0.98]
                ${checks[key] ? "bg-green-600 text-white border-green-700" : "bg-white"}`}
            >
              <span className="capitalize text-lg">{key}</span>

              <span
                className={`w-6 h-6 border-2 rounded-md flex items-center justify-center
                  ${checks[key] ? "bg-white text-green-700 border-white" : "border-gray-400"}`}
              >
                {checks[key] ? "✓" : ""}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
