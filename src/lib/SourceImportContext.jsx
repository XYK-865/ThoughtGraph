import React, { createContext, useContext, useState } from 'react';
import AddSourceSheet from '@/components/sources/AddSourceSheet';

const SourceImportContext = createContext(null);

export function SourceImportProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [initialProjectIds, setInitialProjectIds] = useState([]);

  const openImport = (ids = []) => {
    setInitialProjectIds(ids);
    setOpen(true);
  };

  return (
    <SourceImportContext.Provider value={{ openImport }}>
      {children}
      <AddSourceSheet
        open={open}
        onOpenChange={setOpen}
        initialProjectIds={initialProjectIds}
      />
    </SourceImportContext.Provider>
  );
}

export const useSourceImport = () => useContext(SourceImportContext);
