
import { Button } from '@/components/ui/button';

interface EmptyWebsiteListProps {
  onImportDefault: () => void;
}

export function EmptyWebsiteList({ onImportDefault }: EmptyWebsiteListProps) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center">
      <p className="text-muted-foreground mb-3">No websites added yet</p>
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
