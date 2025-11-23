import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Nav from "./Nav";

export default function HabitMetaViewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  const defaultData = {
    middle: { tasks: [], principles: [], challenges: [] },
    index: { tasks: [], principles: [], challenges: [] },
    thumb: { tasks: [], principles: [], challenges: [] },
    ring: { tasks: [], principles: [], challenges: [] },
    pinky: { tasks: [], principles: [], challenges: [] },
  };

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const ref = doc(db, `users/${user.uid}`);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const habitData = snap.data()?.habitMetadata || defaultData;
        setData(habitData);
      } else {
        await setDoc(ref, { habitMetadata: defaultData });
        setData(defaultData);
      }

      setLoading(false);
    };

    load();
  }, [user]);

  if (loading) {
    return (
      <>
        <Nav />
        <p className="p-4 text-center">Loading...</p>
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="p-6 max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold mb-4">Your Path of Five</h1>

        {Object.keys(data).map((key) => (
          <Link
            to={`/yourpath/${key}`}
            key={key}
            className="block p-4 rounded-xl bg-white shadow border hover:bg-gray-100 transition"
          >
            <p className="text-xl font-semibold capitalize">{key}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
