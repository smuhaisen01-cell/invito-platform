import React, { createContext, useContext, useState, useCallback } from 'react';
import { setLoadingSetter } from '../services/loadingHelper';
import { injectLoadingSetter } from '../services/api';

const LoadingContext = createContext({
  loading: false,
  setLoading: () => {},
});

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  // Prevent flicker for very fast requests (optional)
  const setLoadingSafe = useCallback((value) => {
    setLoading(value);
  }, []);

  React.useEffect(() => {
    setLoadingSetter(setLoadingSafe);
    injectLoadingSetter(setLoadingSafe);
  }, [setLoadingSafe]);

  return (
    <LoadingContext.Provider value={{ loading, setLoading: setLoadingSafe }}>
      {children}
    </LoadingContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLoading = () => useContext(LoadingContext); 
