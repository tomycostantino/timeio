import React, { useState, useEffect, useContext } from "react";
import { Calendar, ChevronDown, ChevronUp, Clock, Laptop, Trash } from "lucide-react";
import { formatApplicationTime, formatElapsedTime, formatDate } from "../../utils.js";
import { SessionSummaryContext } from "../../contexts/SessionSummaryContext.jsx";
import './SessionSummary.css';

export const SessionSummary = ({ session }) => {
    const {
        expandedSessionId,
        toggleSession,
        handleDeleteClick,
    } = useContext(SessionSummaryContext);
    const [isExpanded, setIsExpanded] = useState(false);
    const [appUsage, setAppUsage] = useState({});

    useEffect(() => {
        setAppUsage(parseAppUsage(session.app_usage));
    }, []);

    useEffect(() => {
        if (expandedSessionId === session.id && !isExpanded) {
            setIsExpanded(true);
        } else if (expandedSessionId !== session.id && isExpanded) {
            setIsExpanded(false);
        }
    }, [expandedSessionId, isExpanded]);

    const parseAppUsage = (usageString) => {
        if (!usageString) return {};
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
                        <span>{formatElapsedTime(session.duration)}</span>
                    </div>
                </div>
                <div>
                    <button className="expand-button" aria-label={isExpanded ? "Collapse" : "Expand"}>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    <button className="delete-button" onClick={() => handleDeleteClick(session.id)}>
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
                            <span className="detail-value">{formatElapsedTime(session.duration)}</span>
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
                                                <span className="app-time">{formatApplicationTime(time)}</span>
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
}
