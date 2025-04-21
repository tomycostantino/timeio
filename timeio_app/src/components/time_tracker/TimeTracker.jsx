import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, AlertCircle } from "lucide-react";
import "./TimeTracker.css";

export const TimeTracker = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [description, setDescription] = useState("");
  const [appUsage, setAppUsage] = useState(null);
  const [processStatus, setProcessStatus] = useState(null);
  const [error, setError] = useState(null);
  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      if (!timerIntervalRef.current) {
        startTimer();
      }
    } else {
      stopTimer();
    }

    return () => {
      stopTimer();
    };
  }, [isRunning]);

  useEffect(() => {
    const handleTrackerUsage = (data) => {
      if (data && data.usage_data) {
        setAppUsage(data.usage_data);
        setError(null);
      }
    }

    const handleTrackerStatus = (status) => {
      setProcessStatus(status.status);
      if (status.status === 'started' && !isRunning) {
        setIsRunning(true);
      } else if (status.status === 'stopped') {
        setIsRunning(false);
      } else if (status.status === 'error') {
        setError( status.message || "An unknown Python error occurred.");
        setAppUsage(null);
      }
    }

    window.time_tracker.onTrackerUsageStatus(handleTrackerUsage);
    window.time_tracker.onTrackerStatus(handleTrackerStatus);

    const statusInterval = setInterval(() => {
      if (isRunning) {
        sendTrackerCommand('status');
      }
    }, 1000);

    return () => {
      window.time_tracker.removeAllListeners();
      clearInterval(statusInterval);
    }
  }, [isRunning]);

  const sendTrackerCommand = (command) => {
    if (window.time_tracker) {
      window.time_tracker.sendTrackerCommand(command);
    }
  }

  const startTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    startTimeRef.current = Date.now() - elapsedTime * 1000;

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current) / 1000);
      setElapsedTime(elapsed);
    }, 500);
  }

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":");
  };

  const handleStartStop = async () => {
    if (!isRunning) {
      sendTrackerCommand('start');
      setIsRunning(true);
      setError(null);
    } else {
      sendTrackerCommand('stop');
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    sendTrackerCommand('reset');
    stopTimer();
    setIsRunning(false);
    setElapsedTime(0);
    setDescription("");
    setAppUsage(null);
    setProcessStatus(null);
    setError(null);
  };

  const sortedAppUsage = appUsage
    ? Object.entries(appUsage)
        .sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="time-tracker">
      <div className="timer-display">{formatTime(elapsedTime)}</div>

      {error && (
        <div className="error-message">
          <AlertCircle className="error-icon" />
          {error}
        </div>
      )}

      <div className="timer-controls">
        <button
          className={`control-button ${isRunning ? "stop" : "start"}`}
          onClick={handleStartStop}
          disabled={processStatus === "error"}
        >
          {isRunning ? <Pause /> : <Play />}
          {isRunning ? "Pause" : "Start"}
        </button>

        <button className="control-button reset" onClick={handleReset} disabled={elapsedTime === 0 && !isRunning}>
          <Square />
          Reset
        </button>
      </div>

      {/*
        <div className="timer-description">
          <label htmlFor="description">What are you working on?</label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter task description"
            disabled={!isRunning && elapsedTime === 0}
          />
        </div>
       */}

      {appUsage && Object.keys(appUsage).length > 0 && (
        <div className="app-usage">
          <h3>Application Usage</h3>
          <div className="app-usage-list">
            {sortedAppUsage.map(([app, time]) => (
              <div key={app} className="app-usage-item">
                <span className="app-name">{app}</span>
                <span className="app-time">{time} seconds</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
