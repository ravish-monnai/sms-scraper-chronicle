
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { useScheduler } from '@/hooks/useScheduler';
import { SchedulerToggle } from './SchedulerToggle';
import { IntervalSelector } from './IntervalSelector';
import { SchedulerStatus } from './SchedulerStatus';
import { ScrapeButton } from './ScrapeButton';

export function ScrapingScheduler() {
  const {
    isSchedulerActive,
    interval,
    nextRun,
    isScrapingNow,
    timeLeft,
    handleSchedulerToggle,
    handleIntervalChange,
    handleManualScrape
  } = useScheduler();
  
  const onSchedulerToggle = (checked: boolean) => {
    handleSchedulerToggle(checked);
    
    toast({
      title: checked ? 'Scheduler Activated' : 'Scheduler Deactivated',
      description: checked 
        ? `Will run every ${interval} minutes` 
        : 'Automatic scraping has been turned off',
      duration: 3000,
    });
  };
  
  const onIntervalChange = (value: string) => {
    handleIntervalChange(value);
    
    if (isSchedulerActive) {
      toast({
        title: 'Interval Updated',
        description: `Scraping will now run every ${value} minutes`,
        duration: 3000,
      });
    }
  };
  
  const onManualScrape = async () => {
    const result = await handleManualScrape();
    
    if (result.success) {
      toast({
        title: 'Scraping Complete',
        description: 'All enabled websites have been scraped for phone numbers',
        duration: 3000,
      });
    } else {
      toast({
        title: 'Scraping Error',
        description: 'An error occurred while scraping websites',
        variant: 'destructive',
        duration: 3000,
      });
      console.error('Scraping error:', result.error);
    }
  };
  
  return (
    <Card className="glass-card h-full">
      <CardHeader>
        <CardTitle>Scraping Schedule</CardTitle>
        <CardDescription>
          Configure automatic phone number collection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <SchedulerToggle 
          isActive={isSchedulerActive} 
          onToggle={onSchedulerToggle} 
        />
        
        <IntervalSelector 
          interval={interval} 
          onIntervalChange={onIntervalChange} 
          disabled={!isSchedulerActive} 
        />
        
        <SchedulerStatus 
          nextRun={nextRun} 
          timeLeft={timeLeft} 
          isSchedulerActive={isSchedulerActive} 
        />
        
        <ScrapeButton 
          onClick={onManualScrape} 
          isLoading={isScrapingNow} 
        />
      </CardContent>
    </Card>
  );
}

export default ScrapingScheduler;
