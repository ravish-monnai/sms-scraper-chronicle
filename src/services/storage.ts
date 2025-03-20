
import { PhoneNumberRecord, ScrapingStats } from './types';

export interface Website {
  url: string;
  enabled: boolean;
  lastScraped: string | null;
  addedAt: string;
}

export class StorageService {
  private readonly PHONE_NUMBERS_KEY = 'sms_patrol_phone_numbers';
  private readonly WEBSITES_KEY = 'sms_patrol_websites';
  private readonly SCHEDULER_STATUS_KEY = 'sms_patrol_scheduler_status';
  private readonly SCHEDULER_INTERVAL_KEY = 'sms_patrol_scheduler_interval';
  private readonly NEXT_SCHEDULED_RUN_KEY = 'sms_patrol_next_scheduled_run';
  
  // Phone number methods
  public getPhoneNumbers(): PhoneNumberRecord[] {
    const data = localStorage.getItem(this.PHONE_NUMBERS_KEY);
    return data ? JSON.parse(data) : [];
  }
  
  public setPhoneNumbers(numbers: PhoneNumberRecord[]): void {
    localStorage.setItem(this.PHONE_NUMBERS_KEY, JSON.stringify(numbers));
  }
  
  public addPhoneNumbers(newNumbers: PhoneNumberRecord[]): number {
    const existingNumbers = this.getPhoneNumbers();
    const existingSet = new Set(existingNumbers.map(n => n.phoneNumber));
    
    // Filter out duplicates
    const uniqueNewNumbers = newNumbers.filter(n => !existingSet.has(n.phoneNumber));
    
    if (uniqueNewNumbers.length > 0) {
      this.setPhoneNumbers([...existingNumbers, ...uniqueNewNumbers]);
    }
    
    return uniqueNewNumbers.length;
  }
  
  // Website methods
  public getWebsites(): Website[] {
    const data = localStorage.getItem(this.WEBSITES_KEY);
    return data ? JSON.parse(data) : [];
  }
  
  public setWebsites(websites: Website[]): void {
    localStorage.setItem(this.WEBSITES_KEY, JSON.stringify(websites));
  }
  
  public updateWebsiteLastScraped(url: string, timestamp: string): void {
    const websites = this.getWebsites();
    const index = websites.findIndex(w => w.url === url);
    
    if (index !== -1) {
      websites[index].lastScraped = timestamp;
      this.setWebsites(websites);
    }
  }
  
  // Scheduler methods
  public getSchedulerStatus(): boolean {
    return localStorage.getItem(this.SCHEDULER_STATUS_KEY) === 'true';
  }
  
  public setSchedulerStatus(active: boolean): void {
    localStorage.setItem(this.SCHEDULER_STATUS_KEY, String(active));
  }
  
  public getSchedulerInterval(): string {
    return localStorage.getItem(this.SCHEDULER_INTERVAL_KEY) || '60';
  }
  
  public setSchedulerInterval(interval: string): void {
    localStorage.setItem(this.SCHEDULER_INTERVAL_KEY, interval);
  }
  
  public getNextScheduledRun(): string | null {
    return localStorage.getItem(this.NEXT_SCHEDULED_RUN_KEY);
  }
  
  public setNextScheduledRun(timestamp: string | null): void {
    if (timestamp) {
      localStorage.setItem(this.NEXT_SCHEDULED_RUN_KEY, timestamp);
    } else {
      localStorage.removeItem(this.NEXT_SCHEDULED_RUN_KEY);
    }
  }
  
  // Stats methods
  public getScrapingStats(): ScrapingStats {
    const phoneNumbers = this.getPhoneNumbers();
    const websites = this.getWebsites();
    
    // Find the latest scrape time across all websites
    const lastScraped = websites
      .filter(w => w.lastScraped)
      .map(w => w.lastScraped as string)
      .sort()
      .pop() || null;
    
    return {
      totalNumbers: phoneNumbers.length,
      uniqueNumbers: new Set(phoneNumbers.map(p => p.phoneNumber)).size,
      lastScraped,
      activeSources: websites.filter(w => w.enabled).length,
      totalSources: websites.length
    };
  }
}
