import React, { useEffect, useMemo, useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import HomePage from './HomePage';
import ViewPage from './ViewPage';
import ExperimentPage from './ExperimentPage';
import AppShell from './components/AppShell';
import { createAppTheme, THEME_MODE_STORAGE_KEY } from './theme';

// If we're in an iframe, send messages to the
// parent when the route changes. This allows the
// parent to update its own URL accordingly.
function RouteChangeNotifier() {
  const location = useLocation();

  useEffect(() => {
    // Check if we're in an iframe
    if (window !== window.parent) {
      // Send message to parent with the new path and query string
      window.parent.postMessage({
        type: 'ROUTE_CHANGE',
        path: location.pathname + location.search
      }, '*');
    }
  }, [location]);

  return null;
}

function App() {
  const [mode, setMode] = useState(() => localStorage.getItem(THEME_MODE_STORAGE_KEY) || 'light');
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  function toggleTheme() {
    setMode((prevMode) => {
      const nextMode = prevMode === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_MODE_STORAGE_KEY, nextMode);
      return nextMode;
    });
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <RouteChangeNotifier />
        <Routes>
          <Route path="/" element={<AppShell mode={mode} onToggleTheme={toggleTheme}><HomePage /></AppShell>} />
          <Route path="/view/*" element={<AppShell mode={mode} onToggleTheme={toggleTheme}><ViewPage /></AppShell>} />
          <Route path="/experiment/*" element={<AppShell mode={mode} onToggleTheme={toggleTheme}><ExperimentPage /></AppShell>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
