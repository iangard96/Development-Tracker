import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./Layout";
import MilestoneTable from "./MilestoneTable";
import Dashboard from "./Dashboard";
import ProjectSummary from "./ProjectSummary";
import App from "./App";
import ProjectContacts from "./ProjectContacts";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* default → /dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/development" element={<App />} />
          <Route path="/project_summary" element={<ProjectSummary />} />
          <Route path="/project_contacts" element={<ProjectContacts />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  </React.StrictMode>
);
