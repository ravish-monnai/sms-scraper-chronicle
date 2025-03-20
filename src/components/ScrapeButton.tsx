
import { Button } from '@/components/ui/button';
import { Play, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';

interface ScrapeButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export function ScrapeButton({ onClick, isLoading }: ScrapeButtonProps) {
  const [progress, setProgress] = useState(0);
  
  // Update progress when scraping is happening
  if (isLoading && progress < 95) {
    const interval = setInterval(() => {
      setProgress(prev => {
        const increment = Math.random() * 15;
        const newProgress = Math.min(prev + increment, 95);
        
        if (newProgress >= 95) {
          clearInterval(interval);
        }
        
        return newProgress;
      });
    }, 500);
    
    // Cleanup
    setTimeout(() => clearInterval(interval), 10000);
  } else if (!isLoading) {
    // Reset progress when not loading
    if (progress !== 0) {
      setProgress(0);
    }
  }
  
  return (
    <div className="space-y-2 w-full">
      <Button 
        className="w-full"
        onClick={onClick}
        disabled={isLoading}
      >
        {isLoading 
          ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Scraping...</>
          : <><Play className="w-4 h-4 mr-2" /> Run Scraper Now</>
        }
      </Button>
      
      {isLoading && (
        <Progress className="h-2" value={progress} />
      )}
    </div>
  );
}
