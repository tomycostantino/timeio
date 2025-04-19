import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Sidebar } from "./components/sidebar/Sidebar.jsx";
import { CurrentSession } from "./pages/CurrentSession.jsx";
import { Analytics } from "./pages/Analytics.jsx";
import { Export } from "./pages/Export.jsx";
import { Tags } from "./pages/Tags.jsx";
import './App.css';

const container = document.getElementById('root');

const root = createRoot(container);

const App = () => {
  const [activePage, setActivePage] = React.useState("current-session");

  const renderContent = () => {
    switch (activePage) {
      case "current-session":
        return <CurrentSession />;
      case "analytics":
        return <Analytics />;
      case "export":
        return <Export />;
      case "tags":
        return <Tags />;
      default:
        return <CurrentSession />;
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

