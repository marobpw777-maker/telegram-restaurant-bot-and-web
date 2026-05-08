import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BottomNav() {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  
  const isBookPage = location.pathname === '/book';
  const isHome = location.pathname === '/' || location.pathname === '/menu';

  useEffect(() => {
    const handleScroll = () => {
      // Show only if scrolled down or not on home page
      if (isHome) {
        setIsVisible(window.scrollY > 400);
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome, location.pathname]);

  if (isBookPage || !isVisible) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-full max-w-[340px] px-6 md:hidden animate-slide-up">
      <div className="shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-full overflow-hidden">
        <Button asChild className="btn-editorial w-full py-7 text-[11px] h-16 flex items-center justify-center gap-4 bg-foreground text-background">
          <Link to="/book">
            <CalendarDays className="w-5 h-5" />
            Резервировать стол
          </Link>
        </Button>
      </div>
    </div>
  );
}
