import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const ActiveProjectContext = createContext(null);

export function ActiveProjectProvider({ children }) {
    const [activeProjectId, setActiveProjectId] = useState(
        () => localStorage.getItem('tg_active_project') || null
    );
    const [activeProject, setActiveProject] = useState(null);

    useEffect(() => {
        if (activeProjectId) localStorage.setItem('tg_active_project', activeProjectId);
        else localStorage.removeItem('tg_active_project');
    }, [activeProjectId]);

    useEffect(() => {
        if (!activeProjectId) {
            setActiveProject(null);
            return;
        }
        let cancelled = false;
        base44.entities.Project.get(activeProjectId)
            .then((p) => !cancelled && setActiveProject(p))
            .catch(() => !cancelled && setActiveProject(null));
        return () => {
            cancelled = true;
        };
    }, [activeProjectId]);

    const clear = () => setActiveProjectId(null);

    return (
        <ActiveProjectContext.Provider
            value={{ activeProject, activeProjectId, setActiveProjectId, clear }}
        >
            {children}
        </ActiveProjectContext.Provider>
    );
}

export const useActiveProject = () => useContext(ActiveProjectContext);