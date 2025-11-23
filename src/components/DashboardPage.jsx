import React, {
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
} from "react";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  query,
} from "firebase/firestore";
import Nav from "./Nav";

export default function DashboardPage() {
  const habits = ["pinky", "ring", "middle", "index", "thumb"];

  const user = auth.currentUser;
  const [daysData, setDaysData] = useState({}); // { "2025-02-18": { ..checks.. } }

  // ------------------------------------------
  // FIREBASE LOAD
  // ------------------------------------------

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const q = query(collection(db, `users/${user.uid}/days`));
      const snap = await getDocs(q);

      const tmp = {};
      snap.forEach((doc) => {
        tmp[doc.id] = doc.data(); // doc.id === "YYYY-MM-DD"
      });
      setDaysData(tmp);
    };

    load();
  }, [user]);

  // ------------------------------------------

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  const getDayData = (day) => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    return daysData[key] || null;
  };

  // ------------------------------------------
  // STATS from Firestore daysData
  // ------------------------------------------

  const stats = useMemo(() => {
    const result = {};
    habits.forEach((h) => (result[h] = { total: 0, done: 0 }));

    Object.values(daysData).forEach((dayObj) => {
      habits.forEach((h) => {
        result[h].total += 1;
        if (dayObj[h]) result[h].done += 1;
      });
    });

    return result;
  }, [daysData]);

  const percentage = (h) => {
    const { total, done } = stats[h];
    if (total === 0) return 0;
    return Math.round((done / total) * 100);
  };

  const getColor = (checks) => {
    const count = Object.values(checks).filter(Boolean).length;

    switch (count) {
      case 5:
        return "bg-green-600";
      case 4:
        return "bg-green-400";
      case 3:
        return "bg-yellow-400";
      case 2:
        return "bg-amber-400";
      case 1:
        return "bg-amber-600";
      default:
        return "bg-red-600";
    }
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const previousMonth = () => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else setMonth(month + 1);
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  // ------------------------------------------
  // Tooltip system (same as before)
  // ------------------------------------------

  const tooltipRef = useRef(null);
  const [anchorRect, setAnchorRect] = useState(null);
  const [tooltipState, setTooltipState] = useState({
    visible: false,
    left: 0,
    top: 0,
    day: null,
    data: null,
  });

  const openTooltip = (e, day, data) => {
    setAnchorRect(e.currentTarget.getBoundingClientRect());
    setTooltipState((s) => ({
      ...s,
      visible: true,
      day,
      data,
    }));
  };

  const closeTooltip = () => {
    setTooltipState((s) => ({ ...s, visible: false }));
    setAnchorRect(null);
  };

  useLayoutEffect(() => {
    if (!tooltipState.visible || !anchorRect || !tooltipRef.current) return;

    const tipRect = tooltipRef.current.getBoundingClientRect();
    const spacing = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const topAbove = anchorRect.top - spacing - tipRect.height;
    const below = anchorRect.bottom + spacing;

    const centeredLeft =
      anchorRect.left + anchorRect.width / 2 - tipRect.width / 2;

    const left = Math.min(
      viewportWidth - tipRect.width - 8,
      Math.max(8, centeredLeft)
    );

    let top;
    if (topAbove >= 8) top = topAbove;
    else if (below + tipRect.height <= viewportHeight - 8) top = below;
    else
      top = Math.min(
        Math.max(8, anchorRect.top - tipRect.height / 2),
        viewportHeight - tipRect.height - 8
      );

    setTooltipState((s) => ({
      ...s,
      left,
      top,
    }));
  }, [tooltipState.visible, anchorRect]);

  useEffect(() => {
    const handler = () => closeTooltip();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, []);

  useEffect(() => {
    const onDocClick = (ev) => {
      if (!tooltipState.visible) return;
      if (tooltipRef.current && !tooltipRef.current.contains(ev.target)) {
        closeTooltip();
      }
    };
    document.addEventListener("pointerdown", onDocClick);
    return () => document.removeEventListener("pointerdown", onDocClick);
  }, [tooltipState.visible]);

  // ------------------------------------------

  return (
    <>
      <Nav />

      <div className="p-4 space-y-10 relative">
        <h1 className="text-xl font-bold mb-3">Dashboard</h1>

        <div className="grid grid-cols-2 gap-4">
          {habits.map((h) => (
            <div
              key={h}
              className="p-4 bg-gray-100 rounded-xl shadow-md border"
            >
              <p className="capitalize font-semibold">{h}</p>
              <p className="text-xl font-bold">{percentage(h)}%</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={previousMonth}
            className="px-4 py-2 border rounded shadow bg-white"
          >
            Prev
          </button>

          <h2 className="text-lg font-bold">
            {monthNames[month]} {year}
          </h2>

          <button
            onClick={nextMonth}
            className="px-4 py-2 border rounded shadow bg-white"
          >
            Next
          </button>
        </div>

        <div className="grid grid-cols-7 text-center font-semibold py-2">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div className="grid grid-cols-7 gap-2 bg-white p-4 rounded-xl shadow-lg border">
          {calendarCells.map((day, index) => {
            if (day === null)
              return <div key={index} className="h-14 border rounded" />;

            const data = getDayData(day);

            return (
              <div
                key={index}
                className={`h-14 flex items-center justify-center rounded text-white font-semibold border shadow ${
                  data ? getColor(data) : "bg-gray-400"
                }`}
                onClick={(e) => openTooltip(e, day, data)}
                onMouseEnter={(e) => openTooltip(e, day, data)}
                onMouseLeave={closeTooltip}
              >
                {day}
              </div>
            );
          })}
        </div>

        {tooltipState.visible && tooltipState.data && (
          <div
            ref={tooltipRef}
            style={{
              position: "fixed",
              top: tooltipState.top,
              left: tooltipState.left,
              zIndex: 9999,
              maxWidth: "90vw",
            }}
            className="bg-white border shadow-xl p-4 rounded-xl text-black"
          >
            <p className="font-bold mb-2">
              {year}-{String(month + 1).padStart(2, "0")}-{String(
                tooltipState.day
              ).padStart(2, "0")}
            </p>

            {habits.map((h) => (
              <div key={h} className="flex justify-between border-b py-1">
                <span className="capitalize">{h}</span>
                <span>{tooltipState.data[h] ? "✔️" : "✖️"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
