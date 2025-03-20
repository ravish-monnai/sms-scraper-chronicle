
import { v4 as uuidv4 } from 'uuid';
import { PhoneNumberRecord, ScrapingResult } from '../types';
import { StorageService } from '../storage';
import { WebsiteScraper } from './websiteScraper';
import { ApiScraper } from './apiScraper';
import { JsonScraper } from './jsonScraper';
import { GenericScraper } from './genericScraper';

export class ScraperService {
  private storageService: StorageService;
  private websiteScraper: WebsiteScraper;
  private apiScraper: ApiScraper;
  private jsonScraper: JsonScraper;
  private genericScraper: GenericScraper;
  
  constructor() {
    this.storageService = new StorageService();
    this.websiteScraper = new WebsiteScraper();
    this.apiScraper = new ApiScraper();
    this.jsonScraper = new JsonScraper();
    this.genericScraper = new GenericScraper();
  }
  
  public async scrapeAllWebsites(): Promise<ScrapingResult> {
    const websites = this.storageService.getWebsites().filter(w => w.enabled);
    
    if (websites.length === 0) {
      return {
        success: false,
        message: 'No enabled websites to scrape',
        newNumbers: 0,
        totalProcessed: 0
      };
    }
    
    let totalNewNumbers = 0;
    let totalProcessed = 0;
    let errors = 0;
    const now = new Date().toISOString();
    
    console.log(`Starting to scrape ${websites.length} websites...`);
    
    // Process each website
    for (const website of websites) {
      try {
        console.log(`Starting scrape for ${website.url}`);
        const phoneNumbers = await this.scrapeWebsite(website.url);
        console.log(`Found ${phoneNumbers.length} phone numbers from ${website.url}`);
        
        if (phoneNumbers.length > 0) {
          // Create records for each number
          const phoneRecords: PhoneNumberRecord[] = phoneNumbers.map(number => ({
            id: uuidv4(),
            phoneNumber: number,
            source: website.url,
            timestamp: now
          }));
          
          // Add to storage
          const newCount = this.storageService.addPhoneNumbers(phoneRecords);
          totalNewNumbers += newCount;
          totalProcessed += phoneNumbers.length;
        }
        
        // Update last scraped timestamp
        this.storageService.updateWebsiteLastScraped(website.url, now);
      } catch (error) {
        console.error(`Error scraping ${website.url}:`, error);
        errors++;
      }
    }
    
    return {
      success: errors < websites.length, // Success if at least one website was scraped without error
      message: `Scraped ${totalNewNumbers} new phone numbers from ${websites.length - errors}/${websites.length} websites`,
      newNumbers: totalNewNumbers,
      totalProcessed
    };
  }
  
  private async scrapeWebsite(url: string): Promise<string[]> {
    console.log(`Scraping ${url} for phone numbers...`);
    
    try {
      // Handle specific sites based on their URL patterns
      if (url.includes('deviceandbrowserinfo.com/api/phones')) {
        return await this.apiScraper.scrapeDeviceAndBrowserInfo(url);
      } else if (url.includes('github') && url.includes('json')) {
        return await this.jsonScraper.scrapeGithubJson(url);
      } else {
        // Generic scraping for other websites
        return await this.genericScraper.scrapeGenericWebsite(url);
      }
    } catch (error) {
      console.error(`Error in scrapeWebsite for ${url}:`, error);
      return [];
    }
  }
}
