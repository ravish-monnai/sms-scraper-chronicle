
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Clock, Play, RefreshCw } from 'lucide-react';
import { StorageService } from '@/services/storage';
import { ScraperService } from '@/services/scraper';

export function ScrapingScheduler() {
  const storageService = new StorageService();
  const scraperService = new ScraperService();
  
  const [isSchedulerActive, setIsSchedulerActive] = useState(storageService.getSchedulerStatus());
  const [interval, setInterval] = useState<string>(storageService.getSchedulerInterval() || '60');
  const [nextRun, setNextRun] = useState<string | null>(storageService.getNextScheduledRun());
  const [isScrapingNow, setIsScrapingNow] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  useEffect(() => {
    // Save preferences when they change
    storageService.setSchedulerStatus(isSchedulerActive);
    storageService.setSchedulerInterval(interval);
    
    // Calculate next run time if scheduler is active
    if (isSchedulerActive) {
      const nextRunTime = calculateNextRun();
      storageService.setNextScheduledRun(nextRunTime);
      setNextRun(nextRunTime);
    } else {
      storageService.setNextScheduledRun(null);
      setNextRun(null);
    }
  }, [isSchedulerActive, interval]);
  
  useEffect(() => {
    // Setup countdown timer
    const timer = setInterval(() => {
      if (nextRun) {
        const now = new Date();
        const next = new Date(nextRun);
        const diff = Math.max(0, next.getTime() - now.getTime());
        
        if (diff === 0 && isSchedulerActive) {
          // Time to run scraper
          handleAutoScrape();
        } else {
          // Update countdown
          const minutes = Math.floor(diff / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${minutes}m ${seconds}s`);
        }
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [nextRun, isSchedulerActive]);
  
  const calculateNextRun = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + parseInt(interval));
    return now.toISOString();
  };
  
  const handleSchedulerToggle = (checked: boolean) => {
    setIsSchedulerActive(checked);
    
    toast({
      title: checked ? 'Scheduler Activated' : 'Scheduler Deactivated',
      description: checked 
        ? `Will run every ${interval} minutes` 
        : 'Automatic scraping has been turned off',
      duration: 3000,
    });
  };
  
  const handleIntervalChange = (value: string) => {
    setInterval(value);
    
    if (isSchedulerActive) {
      toast({
        title: 'Interval Updated',
        description: `Scraping will now run every ${value} minutes`,
        duration: 3000,
      });
    }
  };
  
  const handleManualScrape = async () => {
    setIsScrapingNow(true);
    
    try {
      await scraperService.scrapeAllWebsites();
      
      // Update next run time
      if (isSchedulerActive) {
        const nextRunTime = calculateNextRun();
        storageService.setNextScheduledRun(nextRunTime);
        setNextRun(nextRunTime);
      }
      
      toast({
        title: 'Scraping Complete',
        description: 'All enabled websites have been scraped for phone numbers',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Scraping Error',
        description: 'An error occurred while scraping websites',
        variant: 'destructive',
        duration: 3000,
      });
      console.error('Scraping error:', error);
    } finally {
      setIsScrapingNow(false);
    }
  };
  
  const handleAutoScrape = async () => {
    if (isScrapingNow) return; // Prevent concurrent scraping
    
    setIsScrapingNow(true);
    
    try {
      await scraperService.scrapeAllWebsites();
      
      // Update next run time
      const nextRunTime = calculateNextRun();
      storageService.setNextScheduledRun(nextRunTime);
      setNextRun(nextRunTime);
      
      console.log('Auto-scraping completed');
    } catch (error) {
      console.error('Auto-scraping error:', error);
    } finally {
      setIsScrapingNow(false);
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="scheduler-toggle" className="font-medium">
              Automatic Scraping
            </Label>
            <Switch
              id="scheduler-toggle"
              checked={isSchedulerActive}
              onCheckedChange={handleSchedulerToggle}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            When enabled, websites will be scraped automatically at the set interval
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="interval-select">Run Every</Label>
          <Select 
            value={interval} 
            onValueChange={handleIntervalChange}
            disabled={!isSchedulerActive}
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
        
        {nextRun && isSchedulerActive && (
          <div className="flex items-center p-3 rounded-md bg-accent/50">
            <Clock className="w-5 h-5 text-muted-foreground mr-3" />
            <div>
              <p className="text-sm font-medium">Next run in {timeLeft}</p>
              <p className="text-xs text-muted-foreground">
                Scheduled for {new Date(nextRun).toLocaleString()}
              </p>
            </div>
          </div>
        )}
        
        <Button 
          className="w-full"
          onClick={handleManualScrape}
          disabled={isScrapingNow}
        >
          {isScrapingNow 
            ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Scraping...</>
            : <><Play className="w-4 h-4 mr-2" /> Run Scraper Now</>
          }
        </Button>
      </CardContent>
    </Card>
  );
}

export default ScrapingScheduler;
