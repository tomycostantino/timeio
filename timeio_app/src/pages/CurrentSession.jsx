import React from "react";
import { TimeTracker } from "../components/time_tracker/TimeTracker.jsx";
import "./Pages.css";

export const CurrentSession = () => {
  return (
    <div className="page">
      <h1 className="page-title">Current Session</h1>
      <TimeTracker />
    </div>
  )
}
