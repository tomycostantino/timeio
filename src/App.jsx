import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Sidebar } from "./components/sidebar/Sidebar.jsx";
import { Export } from "./pages/Export.jsx";
import { Tags } from "./pages/Tags.jsx";
import { SessionHistory } from "./components/session_history/SessionHistory.jsx";
import './App.css';
import { TimeTracker } from "./components/time_tracker/TimeTracker.jsx";

const container = document.getElementById('root');

const root = createRoot(container);

const App = () => {
  const [activePage, setActivePage] = React.useState("current-session");

  const renderContent = () => {
    switch (activePage) {
      case "current-session":
        return <TimeTracker />;
      case "session-history":
        return <SessionHistory />;
      case "export":
        return <Export />;
      case "tags":
        return <Tags />;
      default:
        return <TimeTracker />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      <main className="content">{renderContent()}</main>
    </div>
  );
};

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

