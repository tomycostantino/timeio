import React, { createContext, useState, useEffect } from 'react';

export const SessionSummaryContext = createContext();

export const SessionSummaryProvider = ({ children }) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedSessionId, setExpandedSessionId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null);
    const [selectedSessions, setSelectedSessions] = useState([]);

    useEffect(() => {
        fetchSessions();
    }, []);

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
        try {
            await fetchSessions();
        } catch (error) {
            console.error(error);
            setError(error);
        } finally {
            setTimeout(() => setRefreshing(false), 500);
        }
    }

    const toggleSession = (sessionId) => {
        if (expandedSessionId === sessionId) {
            setExpandedSessionId(null);
        } else {
            setExpandedSessionId(sessionId);
        }
    }

    const handleDeleteClick = (sessionId) => {
        setSessionToDelete(sessionId);
        setDeleteModalOpen(true);
    }

    const handleDeleteConfirm = async () => {
        if (sessionToDelete) {
            await deleteSession(sessionToDelete);
            setDeleteModalOpen(false);
            setSessionToDelete(null);
        }
    }

    const handleDeleteCancel = () => {
        setDeleteModalOpen(false);
        setSessionToDelete(null);
    }

    const handleToggleSelectSession = (sessionId) => {
        const sessionExists = selectedSessions.find((s) => s.id === sessionId);
        if (sessionExists) {
            setSelectedSessions(selectedSessions.filter((s) => s.id !== sessionId));
        } else {
            const sessionToAdd = sessions.find((s) => s.id === sessionId);
            if (sessionToAdd) {
                setSelectedSessions([...selectedSessions, sessionToAdd]);
            }
        }
    }

    return (
        <SessionSummaryContext.Provider
            value={{
                sessions,
                loading,
                error,
                expandedSessionId,
                refreshing,
                deleteModalOpen,
                selectedSessions,
                toggleSession,
                handleRefresh,
                handleDeleteClick,
                deleteSession,
                handleDeleteCancel,
                handleDeleteConfirm,
                handleToggleSelectSession,
            }}
        >
            {children}
        </SessionSummaryContext.Provider>
    );
};
