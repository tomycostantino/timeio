import React, { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Clock, Calendar, RefreshCw, Laptop, AlertCircle, Trash } from 'lucide-react'
import "./SessionHistory.css"

export const SessionHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const sessionsData = await window.database.ipcRenderer.invoke('get-sessions');
      setSessions(sessionsData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError('Failed to load session history.');
    } finally {
      setLoading(false);
    }
  }

  const deleteSession = async (id) => {
    try {
      setLoading(true);
      await window.database.ipcRenderer.invoke('delete-session', id);
      setSessions(prevSessions => prevSessions.filter(session => session.id !== id));
    } catch (err) {
      console.error('Failed to delete session:', err);
      setError('Failed to delete session.');
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSessions();
    setTimeout(() => setRefreshing(false), 500);
  }

  const toggleSession = (sessionId) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
    } else {
      setExpandedSessionId(sessionId);
    }
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":")
  }

  const parseAppUsage = (usageString) => {
    if (!usageString) return null;
    try {
      return JSON.parse(usageString);
    } catch (err) {
      console.error('Failed to parse app usage data:', err);
      return null;
    }
  }

  const getAppColor = (app) => {
    let hash = 0;
    for (let i = 0; i < app.length; i++) {
      hash = app.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
  }

  if (loading && sessions.length === 0) {
    return (
      <div className="session-history-container">
        <div className="session-history-loading">
          <div className="loading-spinner"></div>
          <p>Loading session history...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="session-history-container">
        <div className="session-history-error">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="session-history-container">
      <div className="session-history-header">
        <h2 className="session-history-title">Session History</h2>
        <button
          className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
          onClick={handleRefresh}
          disabled={loading || refreshing}
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="session-history-empty">
          <Clock size={24} />
          <p>No session history available.</p>
        </div>
      ) : (
        <div className="session-list">
          {sessions.map((session) => {
            const isExpanded = expandedSessionId === session.id
            const appUsage = parseAppUsage(session.app_usage)
            const sortedAppUsage = appUsage
              ? Object.entries(appUsage).sort((a, b) => b[1] - a[1])
              : []

            const totalAppTime = sortedAppUsage.reduce((sum, [_, time]) => sum + time, 0)

            return (
              <div
                key={session.id}
                className={`session-item ${isExpanded ? 'expanded' : ''}`}
              >
                <div
                  className="session-header"
                  onClick={() => toggleSession(session.id)}
                >
                  <div className="session-info">
                    <div className="session-date">
                      <Calendar size={16} />
                      <span>{formatDate(session.start_time)}</span>
                    </div>
                    <div className="session-duration">
                      <Clock size={16} />
                      <span>{formatDuration(session.duration)}</span>
                    </div>
                  </div>
                  <div>
                    <button className="expand-button" aria-label={isExpanded ? "Collapse" : "Expand"}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    <button className="delete-button" onClick={() => deleteSession(session.id)}>
                      <Trash size={20} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="session-details">
                    <div className="session-detail-grid">
                      <div className="session-detail">
                        <span className="detail-label">Started</span>
                        <span className="detail-value">{formatDate(session.start_time)}</span>
                      </div>
                      <div className="session-detail">
                        <span className="detail-label">Ended</span>
                        <span className="detail-value">{formatDate(session.end_time)}</span>
                      </div>
                      <div className="session-detail">
                        <span className="detail-label">Duration</span>
                        <span className="detail-value">{formatDuration(session.duration)}</span>
                      </div>
                      <div className="session-detail">
                        <span className="detail-label">Session ID</span>
                        <span className="detail-value session-id">{session.id}</span>
                      </div>
                    </div>

                    {appUsage && sortedAppUsage.length > 0 && (
                      <div className="session-app-usage">
                        <h4>
                          <Laptop size={16} />
                          <span>Application Usage</span>
                        </h4>

                        <div className="app-usage-bar">
                          {sortedAppUsage.map(([app, time]) => {
                            const percentage = (time / totalAppTime) * 100
                            return (
                              <div
                                key={`bar-${app}`}
                                className="app-usage-segment"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: getAppColor(app)
                                }}
                                title={`${app}: ${time} seconds (${percentage.toFixed(1)}%)`}
                              />
                            )
                          })}
                        </div>

                        <div className="app-usage-list">
                          {sortedAppUsage.map(([app, time]) => {
                            const percentage = (time / totalAppTime) * 100
                            return (
                              <div key={app} className="app-usage-item">
                                <div className="app-usage-info">
                                  <div
                                    className="app-color-indicator"
                                    style={{ backgroundColor: getAppColor(app) }}
                                  />
                                  <span className="app-name">{app}</span>
                                </div>
                                <div className="app-usage-time">
                                  <span className="app-time">{time} seconds</span>
                                  <span className="app-percentage">({percentage.toFixed(1)}%)</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
