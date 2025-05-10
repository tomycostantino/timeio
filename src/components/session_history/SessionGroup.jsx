import React from 'react';
import { SessionSummary } from './SessionSummary.jsx';
import './SessionGroup.css';

export const SessionGroup = ({ title, sessions }) => {
  return (
    <div className="session-group">
      <h3 className="session-group-title">{title}</h3>
      <div className="session-group-content">
        {sessions.map((session) => (
          <SessionSummary key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
};
