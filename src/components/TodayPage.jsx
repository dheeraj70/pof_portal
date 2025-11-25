import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Nav from "./Nav";

export default function TodayPage() {
  const habitOrder = ["middle", "index", "thumb", "ring", "pinky"];
  const defaultChecks = {
    middle: false,
    index: false,
    thumb: false,
    ring: false,
    pinky: false,
  };

  const [user, setUser] = useState(null);
  const [checks, setChecks] = useState(defaultChecks);
  const [tasksData, setTasksData] = useState({});
  const [tasksChecked, setTasksChecked] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Load top-level checks and tasks
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        // Load top-level checks (day document under users/{uid}/days/{today})
        const dayRef = doc(db, `users/${user.uid}/days/${today}`);
        const daySnap = await getDoc(dayRef);
        const dayData = daySnap.exists() ? daySnap.data() : {};

        // Load habit metadata (stored on users/{uid} doc as habitMetadata)
        const metaRef = doc(db, `users/${user.uid}`);
        const metaSnap = await getDoc(metaRef);

        let metaData = {};
        if (metaSnap.exists()) {
          metaData = metaSnap.data()?.habitMetadata || {};
        } else {
          // initialize if missing
          habitOrder.forEach((h) => {
            metaData[h] = { tasks: [], principles: [], challenges: [] };
          });
          await setDoc(metaRef, { habitMetadata: metaData });
        }

        // set tasksData from metadata
        setTasksData(
          habitOrder.reduce(
            (acc, h) => ({ ...acc, [h]: metaData[h]?.tasks || [] }),
            {}
          )
        );

        // Initialize top-level checks from dayData
        const initialChecks = {};
        habitOrder.forEach((h) => {
          initialChecks[h] = !!dayData[h];
        });
        setChecks(initialChecks);

        // Initialize tasksChecked from localStorage OR fallback to top-level check
        const storedTasks = JSON.parse(localStorage.getItem(today)) || {};
        const initialTasksChecked = {};
        habitOrder.forEach((h) => {
          const tasks = metaData[h]?.tasks || [];
          if (tasks.length === 0) {
            initialTasksChecked[h] = [];
          } else {
            initialTasksChecked[h] = tasks.map((_, idx) =>
              // preserve false if present in storedTasks
              storedTasks[h] && storedTasks[h][idx] !== undefined
                ? storedTasks[h][idx]
                : initialChecks[h] // if no saved value, default to top-level check
            );
          }
        });
        setTasksChecked(initialTasksChecked);

        setLoading(false);
      } catch (err) {
        console.error("TodayPage load error:", err);
      }
    };

    load();
  }, [user]);

  // Helper: write tasks object to localStorage (atomic)
  const persistTasksToLocal = (tasksObj) => {
    try {
      localStorage.setItem(today, JSON.stringify(tasksObj));
    } catch (e) {
      console.warn("Failed to save tasks to localStorage", e);
    }
  };

  // Update top-level habit (checkbox on header) — toggles all subtasks and writes Firestore + localStorage
  const updateHabitCheck = async (habitKey, value) => {
    // update checks locally
    setChecks((prev) => ({ ...prev, [habitKey]: value }));

    // update tasksChecked locally and persist
    setTasksChecked((prev) => {
      // ensure array exists
      const prevArr = prev[habitKey] || [];
      const newArr = prevArr.map(() => value);
      const updated = { ...prev, [habitKey]: newArr };

      // persist to localStorage
      const stored = JSON.parse(localStorage.getItem(today)) || {};
      stored[habitKey] = newArr;
      persistTasksToLocal(stored);

      return updated;
    });

    // write to Firestore
    if (!user) return;
    try {
      const ref = doc(db, `users/${user.uid}/days/${today}`);
      await setDoc(ref, { [habitKey]: value }, { merge: true });
    } catch (e) {
      console.error("Failed writing habit to Firestore:", e);
    }
  };

  // Update a single task checkbox: update state, persist localStorage, compute top-level and write Firestore for top-level
  const updateTaskCheck = (habitKey, idx, value) => {
    // Use functional update so we always use latest prev state
    setTasksChecked((prev) => {
      const prevArr = prev[habitKey] || [];
      const newArr = [...prevArr];
      newArr[idx] = value;

      // persist immediately
      const stored = JSON.parse(localStorage.getItem(today)) || {};
      stored[habitKey] = newArr;
      persistTasksToLocal(stored);

      // compute new top-level value
      const allChecked = newArr.length > 0 ? newArr.every(Boolean) : value;

      // update checks state
      setChecks((prevChecks) => ({ ...prevChecks, [habitKey]: allChecked }));

      // write top-level change to Firestore (fire-and-forget)
      if (user) {
        const ref = doc(db, `users/${user.uid}/days/${today}`);
        setDoc(ref, { [habitKey]: allChecked }, { merge: true }).catch((e) =>
          console.error("Failed writing task-derived top-level to Firestore:", e)
        );
      }

      return { ...prev, [habitKey]: newArr };
    });
  };

  const getColor = (habitKey) => {
    const tasks = tasksChecked[habitKey] || [];
    const total = tasks.length;
    const done = tasks.filter(Boolean).length;
    const percent = total === 0 ? (checks[habitKey] ? 100 : 0) : (done / total) * 100;

    if (percent === 100) return "bg-green-600 text-white";
    if (percent >= 60) return "bg-green-400 text-white";
    if (percent >= 30) return "bg-yellow-300 text-black";
    return "bg-red-200 text-black";
  };

  if (loading)
    return (
      <>
        <Nav />
        <div className="p-4 text-center">Loading...</div>
      </>
    );

  return (
    <>
      <Nav />
      <div className="p-4 max-w-md mx-auto space-y-3">
        <h1 className="text-2xl font-bold mb-4">Today</h1>

        {habitOrder.map((habitKey) => (
          <div key={habitKey} className="rounded-xl overflow-hidden shadow-sm border">
            {/* Habit header */}
            <div
              className={`w-full flex justify-between items-center p-4 cursor-pointer transition-colors duration-300 ${getColor(
                habitKey
              )}`}
              onClick={() =>
                setExpanded((prev) => ({
                  ...prev,
                  [habitKey]: !prev[habitKey],
                }))
              }
            >
              <span className="capitalize font-semibold">{habitKey}</span>
              <input
                type="checkbox"
                checked={checks[habitKey] || false}
                onChange={(e) => updateHabitCheck(habitKey, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5"
              />
            </div>

            {/* Tasks */}
            <div
              style={{
                maxHeight: expanded[habitKey] ? "999px" : "0",
                transition: "max-height 0.28s ease",
                overflow: "hidden",
              }}
            >
              <div className="p-2 space-y-2 bg-gray-50">
                {tasksData[habitKey]?.length === 0 && (
                  <p className="text-gray-400 text-sm">No tasks for today.</p>
                )}
                {tasksData[habitKey]?.map((task, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-white rounded-lg shadow-sm px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() =>
                      updateTaskCheck(habitKey, idx, !(tasksChecked[habitKey]?.[idx] || false))
                    }
                  >
                    <span>{task}</span>
                    <input
                      type="checkbox"
                      checked={tasksChecked[habitKey]?.[idx] || false}
                      readOnly
                      className="w-5 h-5"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}