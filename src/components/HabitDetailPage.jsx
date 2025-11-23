import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import Nav from "./Nav";

export default function HabitDetailPage() {
  const { habit } = useParams(); // pinky, ring, etc.
  const [data, setData] = useState({ tasks: [], principles: [], challenges: [] });
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        // Point to the main user document
        const ref = doc(db, `users/${user.uid}`);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const habitData = snap.data()?.habitMetadata?.[habit] || {
            tasks: [],
            principles: [],
            challenges: [],
          };
          setData(habitData);
        } else {
          setData({ tasks: [], principles: [], challenges: [] });
        }
      } catch (err) {
        console.error("Error loading habit data:", err);
        setData({ tasks: [], principles: [], challenges: [] });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, habit]);

  if (loading) {
    return (
      <>
        <Nav />
        <div className="p-4 text-center">Loading...</div>
      </>
    );
  }

  const sections = [
    { key: "tasks", label: "Daily Tasks" },
    { key: "principles", label: "Principles" },
    { key: "challenges", label: "Challenges" },
  ];

  return (
    <>
      <Nav />
      <div className="p-6 max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold capitalize">{habit}</h1>

        {sections.map((section) => (
          <div key={section.key}>
            <h2 className="text-lg font-semibold mb-1">{section.label}</h2>

            {data[section.key].length === 0 ? (
              <p className="text-gray-500 text-sm">No items added</p>
            ) : (
              <ul className="list-disc ml-5 space-y-1">
                {data[section.key].map((item, i) => (
                  <li key={i} className="text-gray-800">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
