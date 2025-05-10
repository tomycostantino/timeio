import React, { useContext, useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { SessionGroup } from "./SessionGroup.jsx";
import { SessionSummaryContext } from "../../contexts/SessionSummaryContext.jsx";
import './SessionHistory.css';

const groupSessions = (sessions) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const thisWeekStart = new Date(today);
    const day = thisWeekStart.getDay();
    const diff = day === 0 ? 6 : day - 1;
    thisWeekStart.setDate(today.getDate() - diff);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const groups = {
        today: [],
        thisWeek: [],
        thisMonth: [],
        older: {}
    };

    sessions.forEach(session => {
        const sessionDate = new Date(session.start_time * 1000);

        if (sessionDate >= today) {
            groups.today.push(session);
        } else if (sessionDate >= thisWeekStart) {
            groups.thisWeek.push(session);
        } else if (sessionDate >= thisMonthStart) {
            groups.thisMonth.push(session);
        } else {
            const monthKey = `${sessionDate.getFullYear()}-${sessionDate.getMonth() + 1}`;
            if (!groups.older[monthKey]) {
                groups.older[monthKey] = [];
            }
            groups.older[monthKey].push(session);
        }
    });

    return groups;
};

export const SessionGroups = () => {
    const { sessions } = useContext(SessionSummaryContext);
    const [groupedSessions, setGroupedSessions] = useState({
        today: [],
        thisWeek: [],
        thisMonth: [],
        older: {}
    });

    useEffect(() => {
        if (sessions && sessions.length > 0) {
            setGroupedSessions(groupSessions(sessions));
        }
    }, [sessions]);

    if (!sessions || sessions.length === 0) {
        return (
            <div className="session-history-empty">
                <Clock size={24} />
                <p>No session history available.</p>
            </div>
        );
    }

    return (
        <div className="session-list">
            {groupedSessions.today?.length > 0 && (
                <SessionGroup title="Today" sessions={groupedSessions.today} />
            )}
            {groupedSessions.thisWeek?.length > 0 && (
                <SessionGroup title="This Week" sessions={groupedSessions.thisWeek} />
            )}
            {groupedSessions.thisMonth?.length > 0 && (
                <SessionGroup title="This Month" sessions={groupedSessions.thisMonth} />
            )}
            {Object.entries(groupedSessions.older).map(([monthKey, monthSessions]) => {
                const [year, month] = monthKey.split('-');
                const date = new Date(year, month - 1);
                const title = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                return (
                    <SessionGroup
                        key={monthKey}
                        title={title}
                        sessions={monthSessions}
                    />
                );
            })}
        </div>
    );
};
