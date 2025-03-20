import { useState, useEffect } from 'react';
import { StorageService } from '@/services/storage';
import { ScraperService } from '@/services/scrapers';

export function useScheduler() {
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
    let timerId: number | undefined;
    
    const updateCountdown = () => {
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
    };
    
    if (nextRun) {
      // Initial update
      updateCountdown();
      
      // Set up interval
      timerId = window.setInterval(updateCountdown, 1000);
    }
    
    return () => {
      if (timerId !== undefined) {
        window.clearInterval(timerId);
      }
    };
  }, [nextRun, isSchedulerActive]);
  
  const calculateNextRun = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + parseInt(interval));
    return now.toISOString();
  };
  
  const handleSchedulerToggle = (checked: boolean) => {
    setIsSchedulerActive(checked);
  };
  
  const handleIntervalChange = (value: string) => {
    setInterval(value);
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
      
      return { success: true };
    } catch (error) {
      return { success: false, error };
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
  
  return {
    isSchedulerActive,
    interval,
    nextRun,
    isScrapingNow,
    timeLeft,
    handleSchedulerToggle,
    handleIntervalChange,
    handleManualScrape,
    calculateNextRun
  };
}
