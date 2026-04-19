import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import React from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import AppLayout from '@/components/layout/AppLayout.jsx';
import Login from '@/pages/Login';
import Feed from '@/pages/Feed';
import FindDupes from '@/pages/FindDupes';
import Saved from '@/pages/Saved';
import Profile from '@/pages/Profile';
import Styleboards from '@/pages/Styleboards';
import StyleboardBuilder from '@/pages/StyleboardBuilder';
import Admin from '@/pages/Admin';
import About from '@/pages/About';
import Privacy from '@/pages/Privacy';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-8 text-center">
          <p className="text-destructive font-medium">Something went wrong</p>
          <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{this.state.error.message}</pre>
          <button onClick={() => this.setState({ error: null })} className="mt-4 text-sm underline">Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<ErrorBoundary><Feed /></ErrorBoundary>} />
        <Route path="/find-dupes" element={<ErrorBoundary><FindDupes /></ErrorBoundary>} />
        <Route path="/saved" element={<ErrorBoundary><Saved /></ErrorBoundary>} />
        <Route path="/styleboards" element={<ErrorBoundary><Styleboards /></ErrorBoundary>} />
        <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
      </Route>
      <Route path="/styleboards/:id" element={<ErrorBoundary><StyleboardBuilder /></ErrorBoundary>} />
      <Route path="/admin" element={<ErrorBoundary><Admin /></ErrorBoundary>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
