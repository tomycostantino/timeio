import React from "react";
import { Clock, BarChart2, Download, Tag } from "lucide-react";
import "./Sidebar.css";

export const Sidebar = ({ activePage, onPageChange }) => {
  const menuItems = [
    { id: "current-session", icon: Clock, label: "Current Session" },
    { id: "pages", icon: BarChart2, label: "Analytics" },
    { id: "export", icon: Download, label: "Export" },
    { id: "tags", icon: Tag, label: "Tags" },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="app-title">Time IO</h1>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${activePage === item.id ? "active" : ""}`}
            onClick={() => onPageChange(item.id)}
            title={item.label}
          >
            <item.icon className="sidebar-icon" />
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
