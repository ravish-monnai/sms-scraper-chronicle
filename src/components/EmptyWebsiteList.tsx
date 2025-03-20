
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

interface EmptyWebsiteListProps {
  onImportDefault: () => void;
}

export function EmptyWebsiteList({ onImportDefault }: EmptyWebsiteListProps) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
      <Info className="h-10 w-10 text-muted-foreground mb-2 opacity-50" />
      <p className="text-muted-foreground mb-3">No websites added yet</p>
      <p className="text-sm text-muted-foreground mb-4">
        Add websites to scrape for phone numbers or import our default list
      </p>
      <Button 
        variant="outline" 
        onClick={onImportDefault}
      >
        Import Default Websites
      </Button>
    </div>
  );
}

export default EmptyWebsiteList;
