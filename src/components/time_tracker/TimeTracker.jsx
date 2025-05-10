import React, { useState, useEffect, useRef } from "react";
import { AlertCircle, Pause, Play, Square } from "lucide-react";
import { formatApplicationTime, formatElapsedTime } from "../../utils.js";
import './TimeTracker.css';

export const TimeTracker = () => {
  const [running, setRunning] = useState(false);
  const [appUsage, setAppUsage] = useState({});
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [processStatus, setProcessStatus] = useState('');
  const [error, setError] = useState(null);
  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const mountComponent = async () => {
      try {
        const activeSession = await window.database.executeQuery('get-active-session');
        if (activeSession) {
          startTimeRef.current = activeSession.start_time * 1000;
          setSessionId(activeSession.id);
          setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
          setRunning(true);
        }
      } catch (err) {
        console.error('Failed to load active session:', err);
        setError('Failed to load active session data.');
      }
    };

    mountComponent();

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (running) {
      startTimer();

      window.time_tracker.onTrackerUsageStatus(handleTrackerUsage);
      window.time_tracker.onTrackerStatus(handleTrackerStatus);

      const statusInterval = setInterval(() => {
        if (running) {
          sendTrackerCommand('status');
        }
      }, 1000);

      return () => {
        clearInterval(statusInterval);
        window.time_tracker.removeAllListeners();
      };
    } else {
      stopTimer();
    }
  }, [running]);

  const sendTrackerCommand = (command) => {
    if (window.time_tracker) {
      try {
        window.time_tracker.sendTrackerCommand(command);
      } catch (err) {
        console.error(`Error sending tracker command "${command}":`, err);
        setError(`Failed to send command to tracker: ${err.message}`);
      }
    } else {
      setError('Time tracker service not available');
    }
  };

  const handleTrackerUsage = (data) => {
    if (data && data.usage_data) {
      setAppUsage(data.usage_data);
      setError(null);
    }
  };

  const handleTrackerStatus = (status) => {
    setProcessStatus(status.status);
    if (status.status === 'started' && !running) {
      setRunning(true);
    } else if (status.status === 'stopped') {
      setRunning(false);
    } else if (status.status === 'error') {
      setError(status.message || "An unknown Python error occurred.");
      setAppUsage(null);
    }
  };

  const startTimer = async () => {
    try {
      if (!startTimeRef.current) {
        const startTime = Date.now();
        startTimeRef.current = startTime;

        const session = await window.database.executeQuery('store-session', {
          start_time: Math.floor(startTime / 1000),
        });

        setSessionId(session.id);
      }

      timerIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
    } catch (err) {
      console.error('Failed to start timer:', err);
      setError('Failed to start timer: ' + err.message);
    }
  };

  const stopTimer = async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    // await storeSession();
  };

  const storeSession = async () => {
    if (!startTimeRef.current || !sessionId || elapsedTime <= 0) return;

    try {
      const sessionData = {
        end_time: Math.floor(Date.now() / 1000),
        duration: Object.values(appUsage).reduce((acc, rec) => {
          acc += rec;
          return acc;
        }, 0),
        app_usage: appUsage ? JSON.stringify(appUsage) : null
      };

      await window.database.executeQuery('update-session', {
        id: sessionId,
        ...sessionData
      });
    } catch (err) {
      console.error('Failed to save session to database:', err);
      setError('Failed to save session data to database.');
    }
  };

  const handleStartStop = async () => {
    if (!running) {
      sendTrackerCommand('start');
      setRunning(true);
    } else {
      sendTrackerCommand('stop');
      setRunning(false);
    }
  };

  const handleReset = async () => {
    sendTrackerCommand('reset');

    if (sessionId && startTimeRef.current) {
      await storeSession();
    }

    stopTimer();
    setRunning(false);
    setElapsedTime(0);
    setAppUsage({});
    setProcessStatus('');
    setError(null);
    startTimeRef.current = null;
    setSessionId(null);
  };

  const sortedAppUsage = appUsage
      ? Object.entries(appUsage)
          .sort((a, b) => b[1] - a[1])
      : [];

  return (
      <div className="time-tracker">
        <div className="timer-display">{formatElapsedTime(elapsedTime)}</div>

        {error && (
            <div className="error-message">
              <AlertCircle className="error-icon" />
              {error}
            </div>
        )}

        <div className="timer-controls">
          <button
              className={`control-button ${running ? "stop" : "start"}`}
              onClick={handleStartStop}
              disabled={processStatus === "error"}
          >
            {running ? <Pause /> : <Play />}
            {running ? "Pause" : "Start"}
          </button>

          <button
              className="control-button reset"
              onClick={handleReset}
              disabled={elapsedTime === 0 && !running}
          >
            <Square />
            Reset
          </button>
        </div>

        {appUsage && Object.keys(appUsage).length > 0 && (
            <div className="app-usage">
              <h3>Application Usage</h3>
              <div className="app-usage-list">
                {sortedAppUsage.map(([app, time]) => (
                    <div key={app} className="app-usage-item">
                      <span className="app-name">{app}</span>
                      <span className="app-time">{formatApplicationTime(time)}</span>
                    </div>
                ))}
              </div>
            </div>
        )}
      </div>
  );
};
