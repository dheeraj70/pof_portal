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
        // Load top-level checks
        const dayRef = doc(db, `users/${user.uid}/days/${today}`);
        const daySnap = await getDoc(dayRef);
        const dayData = daySnap.exists() ? daySnap.data() : {};

        // Load habit metadata
        const metaRef = doc(db, `users/${user.uid}`);
        const metaSnap = await getDoc(metaRef);

        let metaData = {};
        if (metaSnap.exists()) {
          metaData = metaSnap.data()?.habitMetadata || {};
        } else {
          habitOrder.forEach((h) => {
            metaData[h] = { tasks: [], principles: [], challenges: [] };
          });
          await setDoc(metaRef, { habitMetadata: metaData });
        }

        setTasksData(
          habitOrder.reduce((acc, h) => ({ ...acc, [h]: metaData[h]?.tasks || [] }), {})
        );

        // Initialize top-level checks
        const initialChecks = {};
        habitOrder.forEach((h) => {
          initialChecks[h] = !!dayData[h];
        });
        setChecks(initialChecks);

        // Initialize tasksChecked from localStorage or top-level
        const storedTasks = JSON.parse(localStorage.getItem(today)) || {};
        const initialTasksChecked = {};
        habitOrder.forEach((h) => {
          const tasks = metaData[h]?.tasks || [];
          initialTasksChecked[h] = tasks.map((_, idx) =>
            storedTasks[h]?.[idx] ?? initialChecks[h]
          );
        });
        setTasksChecked(initialTasksChecked);

        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, [user]);

  // Persist task-level state to localStorage
  useEffect(() => {
    const saveTasks = {};
    habitOrder.forEach((h) => {
      saveTasks[h] = tasksChecked[h] || [];
    });
    localStorage.setItem(today, JSON.stringify(saveTasks));
  }, [tasksChecked]);

  const updateHabitCheck = async (habitKey, value) => {
    // Update top-level check
    setChecks((prev) => ({ ...prev, [habitKey]: value }));
    // Update all subtasks
    setTasksChecked((prev) => ({
      ...prev,
      [habitKey]: prev[habitKey].map(() => value),
    }));

    if (!user) return;
    const ref = doc(db, `users/${user.uid}/days/${today}`);
    await setDoc(ref, { [habitKey]: value }, { merge: true });
  };

  const updateTaskCheck = (habitKey, idx, value) => {
    setTasksChecked((prev) => {
      const newArr = [...prev[habitKey]];
      newArr[idx] = value;

      // Persist immediately
      const storedTasks = JSON.parse(localStorage.getItem(today)) || {};
      storedTasks[habitKey] = newArr;
      localStorage.setItem(today, JSON.stringify(storedTasks));

      // Update top-level check based on all tasks
      setChecks((prevChecks) => ({
        ...prevChecks,
        [habitKey]: newArr.every(Boolean),
      }));

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
                transition: "max-height 0.3s ease",
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
                      updateTaskCheck(
                        habitKey,
                        idx,
                        !(tasksChecked[habitKey]?.[idx] || false)
                      )
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
