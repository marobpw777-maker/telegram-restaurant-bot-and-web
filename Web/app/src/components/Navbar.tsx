import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { restaurantInfo } from '@/data/mockData';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/menu', label: 'Гастрономия' },
    { href: '/wines', label: 'Винотека' },
    { href: '/book', label: 'Резерв' },
    { href: '/info', label: 'История' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        isScrolled ? 'glass-header py-4' : 'bg-transparent py-8'
      }`}
    >
      <nav className="max-w-screen-2xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between">
          {/* Desktop Navigation (Left) */}
          <div className="hidden md:flex items-center gap-12 flex-1">
            {navLinks.slice(0, 2).map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-all duration-500 hover:opacity-50 ${
                  isActive(link.href) 
                    ? 'text-primary' 
                    : (isScrolled ? 'text-foreground' : 'text-white')
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Logo (Center) */}
          <Link to="/" className="flex flex-col items-center group">
            <span className={`font-serif text-2xl md:text-3xl font-bold tracking-tighter transition-all duration-700 group-hover:scale-105 ${
              isScrolled ? 'text-foreground' : 'text-white'
            }`}>
              {restaurantInfo.name.toUpperCase()}
            </span>
            <div className="h-[1px] w-0 group-hover:w-full bg-primary transition-all duration-700 mt-1" />
          </Link>

          {/* Desktop Navigation (Right) */}
          <div className="hidden md:flex items-center justify-end gap-12 flex-1">
            {navLinks.slice(2).map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-all duration-500 hover:opacity-50 ${
                  isActive(link.href) 
                    ? 'text-primary' 
                    : (isScrolled ? 'text-foreground' : 'text-white')
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className={`p-2 transition-colors ${isScrolled ? 'text-foreground' : 'text-white'}`}>
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full bg-background border-none p-0">
                <div className="flex flex-col h-full px-8 py-12">
                  <div className="flex justify-between items-center mb-24">
                     <span className="font-serif text-xl font-bold tracking-tighter">
                        {restaurantInfo.name.toUpperCase()}
                      </span>
                      <button onClick={() => setIsMobileMenuOpen(false)}>
                        <X className="w-6 h-6" />
                      </button>
                  </div>
                  
                  <nav className="flex flex-col gap-12">
                    {navLinks.map((link, i) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-4xl font-serif font-bold tracking-tighter hover:text-primary transition-colors"
                      >
                        <span className="text-xs font-sans font-bold tracking-widest text-muted-foreground mr-4">0{i+1}</span>
                        {link.label}
                      </Link>
                    ))}
                  </nav>

                  <div className="mt-auto border-t border-border pt-12 flex flex-col gap-4">
                     <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Москва, Большая Дмитровка, 12</p>
                     <p className="text-[10px] uppercase tracking-widest text-muted-foreground">+7 (495) 123-45-67</p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
