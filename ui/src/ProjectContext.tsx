// ui/src/ProjectContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Project } from "./types";
import { fetchProject } from "./api";

type ProjectContextValue = {
  projectId: number | null;
  project: Project | null;
  isLoading: boolean;
  error: string | null;
  selectProject: (id: number) => void;
  clearProject: () => void;
};

const ProjectContext = createContext<ProjectContextValue | undefined>(
  undefined,
);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectId, setProjectId] = useState<number | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If no project selected, clear state
    if (!projectId || projectId <= 0) {
      setProject(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchProject(projectId)
      .then((p) => {
        if (!cancelled) {
          setProject(p);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(String(err));
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const selectProject = (id: number) => {
    setProjectId(id);
  };

  const clearProject = () => {
    setProjectId(null);
    setProject(null);
  };

  return (
    <ProjectContext.Provider
      value={{
        projectId,
        project,
        isLoading,
        error,
        selectProject,
        clearProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error("useProject must be used inside a ProjectProvider");
  }
  return ctx;
}
