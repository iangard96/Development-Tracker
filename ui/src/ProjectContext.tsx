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
  setCurrentProject: (p: Project | null) => void;
};

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

type ProjectProviderProps = {
  children: ReactNode;
  /** Optional external project id (e.g., from the router) to prime the context */
  projectId?: number;
};

export function ProjectProvider({ children, projectId: projectIdProp }: ProjectProviderProps) {
  const [projectId, setProjectId] = useState<number | null>(
    projectIdProp && projectIdProp > 0 ? projectIdProp : null,
  );
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep state in sync with an externally supplied id (Layout passes :projectId)
  useEffect(() => {
    if (projectIdProp && projectIdProp > 0 && projectIdProp !== projectId) {
      setProjectId(projectIdProp);
    }
  }, [projectIdProp, projectId]);

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

  const setCurrentProject = (p: Project | null) => {
    setProject(p);
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
        setCurrentProject,
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
