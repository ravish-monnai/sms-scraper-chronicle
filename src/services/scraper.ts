
import { v4 as uuidv4 } from 'uuid';
import { PhoneNumberRecord, ScrapingResult } from './types';
import { StorageService } from './storage';

export class ScraperService {
  private storageService: StorageService;
  
  constructor() {
    this.storageService = new StorageService();
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
    const now = new Date().toISOString();
    
    // Process each website
    for (const website of websites) {
      try {
        const phoneNumbers = await this.scrapeWebsite(website.url);
        
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
      }
    }
    
    return {
      success: true,
      message: `Scraped ${totalNewNumbers} new phone numbers from ${websites.length} websites`,
      newNumbers: totalNewNumbers,
      totalProcessed
    };
  }
  
  private async scrapeWebsite(url: string): Promise<string[]> {
    // Simulate scraping for demo purposes
    // In a real implementation, this would use fetch/axios to request the URL
    // and parse the HTML for phone numbers using regex
    
    console.log(`Scraping ${url} for phone numbers...`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, generate some random phone numbers
    // In a real implementation, this would extract actual numbers from the page
    if (url.includes('github') || url.includes('api')) {
      // Simulate API endpoints with JSON data
      return this.generateRandomPhoneNumbers(5, 15);
    } else {
      // Simulate website scraping
      return this.generateRandomPhoneNumbers(1, 8);
    }
  }
  
  private generateRandomPhoneNumbers(min: number, max: number): string[] {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const phoneNumbers: string[] = [];
    
    // Phone number formats:
    const formats = [
      '+1XXXXXXXXXX',      // US
      '+44XXXXXXXXXX',     // UK
      '+49XXXXXXXXX',      // Germany
      '+33XXXXXXXXX',      // France
      '+7XXXXXXXXXX',      // Russia
      '+86XXXXXXXXXXX',    // China
      '+91XXXXXXXXXX',     // India
      '+55XXXXXXXXXX',     // Brazil
      '+27XXXXXXXXX',      // South Africa
      '+61XXXXXXXXX',      // Australia
    ];
    
    for (let i = 0; i < count; i++) {
      const format = formats[Math.floor(Math.random() * formats.length)];
      let number = '';
      
      for (const char of format) {
        if (char === 'X') {
          number += Math.floor(Math.random() * 10);
        } else {
          number += char;
        }
      }
      
      phoneNumbers.push(number);
    }
    
    return phoneNumbers;
  }
}
