
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ApartmentList from './components/ApartmentList';
import ReadingForm from './components/ReadingForm';
import ResidentDetails from './components/ResidentDetails';
import History from './components/History';
import UnitList from './components/UnitList';
import UnitRegistration from './components/UnitRegistration';
import Settings from './components/Settings';
import Navigation from './components/Navigation';
import ImagePreview from './components/ImagePreview';
import Login from './components/Login';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        if (location.pathname === '/login') {
          navigate('/dashboard');
        }
      } else {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && location.pathname !== '/login') {
        navigate('/login');
      } else if (isAuthenticated && location.pathname === '/login') {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, location.pathname, navigate, isLoading]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background-light dark:bg-background-dark overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto relative no-scrollbar">
        <div className="mx-auto w-full max-w-[500px] min-h-full flex flex-col bg-slate-50 dark:bg-background-dark shadow-2xl shadow-black/5 min-[501px]:border-x dark:border-gray-800">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/readings" element={<ApartmentList />} />
            <Route path="/readings/:id" element={<ReadingForm />} />
            <Route path="/history" element={<History onImageClick={setPreviewImage} />} />
            <Route path="/units" element={<UnitList />} />
            <Route path="/units/new" element={<UnitRegistration />} />
            <Route path="/units/:id/edit" element={<UnitRegistration />} />
            <Route path="/residents/:id" element={<ResidentDetails />} />
            <Route path="/settings" element={<Settings toggleDarkMode={toggleDarkMode} isDarkMode={darkMode} onLogout={handleLogout} />} />
          </Routes>
        </div>
      </div>

      {isAuthenticated && <Navigation />}
      {previewImage && <ImagePreview url={previewImage} onClose={() => setPreviewImage(null)} />}
    </div>
  );
};

export default App;
