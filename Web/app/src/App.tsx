import { HashRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import { MenuPage } from '@/pages/MenuPage';
import { WinePage } from '@/pages/WinePage';
import { BookPage } from '@/pages/BookPage';
import { InfoPage } from '@/pages/InfoPage';
import { AdminPage } from '@/pages/AdminPage';
import { Toaster } from '@/components/ui/sonner';

// Layout for main pages with navigation
function MainLayout() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col bg-grain">
      <Navbar />
      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}

// Layout for admin without main navigation
function AdminLayout() {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Main routes with navigation */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<MenuPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/wines" element={<WinePage />} />
          <Route path="/book" element={<BookPage />} />
          <Route path="/info" element={<InfoPage />} />
          <Route path="*" element={<MenuPage />} />
        </Route>
        
        {/* Admin routes */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
      <Toaster position="top-center" />
    </HashRouter>
  );
}

export default App;
