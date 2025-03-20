
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface SchedulerToggleProps {
  isActive: boolean;
  onToggle: (checked: boolean) => void;
}

export function SchedulerToggle({ isActive, onToggle }: SchedulerToggleProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="scheduler-toggle" className="font-medium">
          Automatic Scraping
        </Label>
        <Switch
          id="scheduler-toggle"
          checked={isActive}
          onCheckedChange={onToggle}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        When enabled, websites will be scraped automatically at the set interval
      </p>
    </div>
  );
}
