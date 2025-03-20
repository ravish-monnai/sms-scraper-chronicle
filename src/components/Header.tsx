
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowRightLeft, BarChart3, Settings } from 'lucide-react';

export const Header = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4 mr-2" /> },
    { path: '/report', label: 'Report', icon: <ArrowRightLeft className="w-4 h-4 mr-2" /> },
    { path: '/settings', label: 'Settings', icon: <Settings className="w-4 h-4 mr-2" /> }
  ];

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!mounted) return null;

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out-smooth backdrop-blur-md",
        scrolled 
          ? "py-3 bg-background/80 shadow-subtle" 
          : "py-5 bg-transparent"
      )}
    >
      <div className="layout flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center gap-2 transition-opacity duration-300 hover:opacity-80"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-semibold text-primary-foreground">SP</span>
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
            </span>
          </span>
          <span className="text-lg font-semibold tracking-tight">SMS Patrol</span>
        </Link>
        
        <nav className="hidden sm:flex items-center space-x-1">
          {navItems.map(({ path, label, icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all",
                location.pathname === path
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              {icon}
              {label}
            </Link>
          ))}
        </nav>
        
        <div className="sm:hidden flex items-center">
          <div className="flex items-center space-x-2">
            {navItems.map(({ path, icon }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-md transition-all",
                  location.pathname === path
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
                aria-label={path.substring(1) || "dashboard"}
              >
                {icon}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
