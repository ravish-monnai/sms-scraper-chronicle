
import { Button } from '@/components/ui/button';
import { Play, RefreshCw } from 'lucide-react';

interface ScrapeButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export function ScrapeButton({ onClick, isLoading }: ScrapeButtonProps) {
  return (
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
  );
}
