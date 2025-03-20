
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface IntervalSelectorProps {
  interval: string;
  onIntervalChange: (value: string) => void;
  disabled: boolean;
}

export function IntervalSelector({ interval, onIntervalChange, disabled }: IntervalSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="interval-select">Run Every</Label>
      <Select 
        value={interval} 
        onValueChange={onIntervalChange}
        disabled={disabled}
      >
        <SelectTrigger id="interval-select" className="w-full">
          <SelectValue placeholder="Select interval" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">1 minute (testing)</SelectItem>
          <SelectItem value="15">15 minutes</SelectItem>
          <SelectItem value="30">30 minutes</SelectItem>
          <SelectItem value="60">1 hour</SelectItem>
          <SelectItem value="120">2 hours</SelectItem>
          <SelectItem value="360">6 hours</SelectItem>
          <SelectItem value="720">12 hours</SelectItem>
          <SelectItem value="1440">24 hours</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
