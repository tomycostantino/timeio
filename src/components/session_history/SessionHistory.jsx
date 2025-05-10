import React, { useContext } from "react"
import { RefreshCw, AlertCircle } from 'lucide-react'
import { ConfirmationModal } from "../common/ConfirmationModal.jsx"
import { SessionGroups } from "./SessionGroups.jsx";
import { SessionSummaryContext } from "../../contexts/SessionSummaryContext.jsx";
import "./SessionHistory.css"

export const SessionHistory = () => {
  const {
    selectedSessions,
    sessions,
    loading,
    error,
    refreshing,
    deleteModalOpen,
    handleRefresh,
    handleDeleteCancel,
    handleDeleteConfirm,
  } = useContext(SessionSummaryContext);

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
        <div className="session-history-actions">
          {selectedSessions.length > 0 && (
            <>
              <button className="action-button export-button">
                <span>Export Selected</span>
              </button>
              <button className="action-button delete-selected-button">
                <span>Delete Selected</span>
              </button>
            </>
          )}
          <button
            className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={loading || refreshing}
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <SessionGroups />

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Session"
        message="Are you sure you want to delete this session? This action cannot be undone."
      />
    </div>
  )
}
