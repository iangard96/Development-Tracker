// ui/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProjectSummaryPage from "./ProjectSummary";
import ProjectLayout from "./Layout";
import Dashboard from "./Dashboard";
import DevActivities from "./DevActivities";
import ProjectContacts from "./ProjectContacts";
import Requirements from "./Requirements";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Project list / summary - NO project context needed */}
        <Route path="/" element={<ProjectSummaryPage />} />

        {/* Everything inside a single project - wrapped in ProjectLayout with context */}
        <Route path="/projects/:projectId" element={<ProjectLayout />}>
          {/* default tab */}
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="activities" element={<DevActivities />} />
          <Route path="requirements" element={<Requirements />} />
          <Route path="contacts" element={<ProjectContacts />} />
        </Route>

        {/* Catch-all redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
