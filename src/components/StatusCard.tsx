
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatusCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  isLoading?: boolean;
}

export function StatusCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  isLoading = false
}: StatusCardProps) {
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 1000);
    return () => clearTimeout(timer);
  }, [value]);
  
  return (
    <Card className={cn("glass-card overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-7 w-20 bg-muted rounded-md animate-pulse" />
        ) : (
          <div className="flex items-baseline space-x-3">
            <div 
              className={cn(
                "text-2xl font-semibold transition-all duration-500",
                animate && "text-primary"
              )}
            >
              {value}
            </div>
            {trend && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={cn(
                        "text-xs font-medium flex items-center",
                        trend.isPositive ? "text-green-500" : "text-red-500"
                      )}
                    >
                      <span className="mr-0.5">
                        {trend.isPositive ? '↑' : '↓'}
                      </span>
                      {Math.abs(trend.value)}%
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {trend.isPositive 
                        ? `Increased by ${trend.value}% since last scrape` 
                        : `Decreased by ${Math.abs(trend.value)}% since last scrape`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default StatusCard;
