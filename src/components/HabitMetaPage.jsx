import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Nav from "./Nav";

export default function HabitMetaPage() {
  const defaultJson = {
    pinky: { tasks: [], principles: [], challenges: [] },
    ring: { tasks: [], principles: [], challenges: [] },
    middle: { tasks: [], principles: [], challenges: [] },
    index: { tasks: [], principles: [], challenges: [] },
    thumb: { tasks: [], principles: [], challenges: [] },
  };

  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  // Load JSON from Firestore on mount
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const ref = doc(db, `users/${user.uid}`);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const habitData = snap.data()?.habitMetadata || defaultJson;
        setJsonText(JSON.stringify(habitData, null, 2));
      } else {
        await setDoc(ref, { habitMetadata: defaultJson });
        setJsonText(JSON.stringify(defaultJson, null, 2));
      }

      setLoading(false);
    };

    load();
  }, [user]);

  const saveJson = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!user) return;

      const ref = doc(db, `users/${user.uid}`);
      await setDoc(ref, { habitMetadata: parsed }, { merge: true });
      alert("Saved successfully");
    } catch (e) {
      alert("Invalid JSON. Fix it and try again.");
    }
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
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold mb-4">
          Update your Path of Five (JSON)
        </h1>

        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          className="w-full h-96 border p-3 font-mono text-sm rounded"
        />

        <button
          onClick={saveJson}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Save
        </button>
      </div>
    </>
  );
}
