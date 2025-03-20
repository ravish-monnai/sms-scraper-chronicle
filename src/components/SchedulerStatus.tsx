
import { Clock } from 'lucide-react';

interface SchedulerStatusProps {
  nextRun: string | null;
  timeLeft: string;
  isSchedulerActive: boolean;
}

export function SchedulerStatus({ nextRun, timeLeft, isSchedulerActive }: SchedulerStatusProps) {
  if (!nextRun || !isSchedulerActive) return null;
  
  return (
    <div className="flex items-center p-3 rounded-md bg-accent/50">
      <Clock className="w-5 h-5 text-muted-foreground mr-3" />
      <div>
        <p className="text-sm font-medium">Next run in {timeLeft}</p>
        <p className="text-xs text-muted-foreground">
          Scheduled for {new Date(nextRun).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
