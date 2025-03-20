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
    console.log(`Scraping ${url} for phone numbers...`);
    
    try {
      // Handle specific sites based on their URL patterns
      if (url.includes('deviceandbrowserinfo.com/api/phones')) {
        return await this.scrapeDeviceAndBrowserInfo(url);
      } else if (url.includes('github') && url.includes('json')) {
        return await this.scrapeGithubJson(url);
      } else if (url.includes('receive-sms-free.cc')) {
        return await this.scrapeReceiveSmsFreeCc(url);
      } else if (url.includes('receive-smss.com')) {
        return await this.scrapeReceiveSmss(url);
      } else if (url.includes('receive-sms.cc')) {
        return await this.scrapeReceiveSmsCC(url);
      } else if (url.includes('spytm.com')) {
        return await this.scrapeSpytm(url);
      } else if (url.includes('quackr.io')) {
        return await this.scrapeQuackr(url);
      } else if (url.includes('onlinesim.io')) {
        return await this.scrapeOnlineSim(url);
      } else if (url.includes('smstome.com')) {
        return await this.scrapeSmsTome(url);
      } else if (url.includes('temporary-phone-number.com')) {
        return await this.scrapeTemporaryPhoneNumber(url);
      } else if (url.includes('sms24.me')) {
        return await this.scrapeSms24(url);
      } else {
        // Generic scraping for other websites
        return await this.scrapeGenericWebsite(url);
      }
    } catch (error) {
      console.error(`Error in scrapeWebsite for ${url}:`, error);
      return [];
    }
  }
  
  private async scrapeDeviceAndBrowserInfo(url: string): Promise<string[]> {
    try {
      console.log(`Fetching data from ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Received data from ${url}:`, data);
      
      // Extract phone numbers from the API response
      if (Array.isArray(data) && data.length > 0) {
        // If it's an array of objects with phone numbers
        return data
          .filter(item => item && typeof item.phone === 'string')
          .map(item => item.phone);
      } else if (data && data.phones && Array.isArray(data.phones)) {
        // If it has a phones array property
        return data.phones;
      } else if (data && typeof data === 'object') {
        // Try to find any property that might contain phone numbers
        const phoneArrays = Object.values(data)
          .filter(value => Array.isArray(value))
          .flatMap(arr => arr);
          
        if (phoneArrays.length > 0) {
          return phoneArrays
            .filter(item => typeof item === 'string' && this.isPhoneNumber(item))
            .map(item => item.toString());
        }
      }
      
      console.log('Could not parse phone numbers from response:', data);
      return [];
    } catch (error) {
      console.error(`Error scraping DeviceAndBrowserInfo API:`, error);
      return [];
    }
  }
  
  private async scrapeGithubJson(url: string): Promise<string[]> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract all phone-like strings from the JSON data
      return this.extractPhoneNumbersFromJson(data);
    } catch (error) {
      console.error(`Error scraping GitHub JSON:`, error);
      return [];
    }
  }
  
  private async scrapeReceiveSmsFreeCc(url: string): Promise<string[]> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Extract phone numbers displayed on the page
      // The site typically displays phone numbers in a specific format
      const phoneRegex = /\+\d{1,3}\s?\d{3,14}/g;
      const matches = html.match(phoneRegex) || [];
      
      return matches.map(num => num.replace(/\s/g, ''));
    } catch (error) {
      console.error(`Error scraping Receive SMS Free:`, error);
      return [];
    }
  }
  
  private async scrapeReceiveSmss(url: string): Promise<string[]> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const html = await response.text();
      
      // This site often has phone numbers in a specific format
      const phoneRegex = /\+\d{1,3}\d{6,14}/g;
      const matches = html.match(phoneRegex) || [];
      
      return [...new Set(matches)]; // Remove duplicates
    } catch (error) {
      console.error(`Error scraping Receive SMS:`, error);
      return [];
    }
  }
  
  private async scrapeReceiveSmsCC(url: string): Promise<string[]> {
    // Similar to receive-smss.com but might have different HTML structure
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const html = await response.text();
      
      const phoneRegex = /\+\d{1,3}\d{6,14}/g;
      const matches = html.match(phoneRegex) || [];
      
      return [...new Set(matches)];
    } catch (error) {
      console.error(`Error scraping Receive SMS CC:`, error);
      return [];
    }
  }
  
  private async scrapeSpytm(url: string): Promise<string[]> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Spytm might have phone numbers in a different format
      const phoneRegex = /\+\d{1,3}\d{6,14}/g;
      const matches = html.match(phoneRegex) || [];
      
      return [...new Set(matches)];
    } catch (error) {
      console.error(`Error scraping Spytm:`, error);
      return [];
    }
  }
  
  private async scrapeQuackr(url: string): Promise<string[]> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Extract phone numbers
      const phoneRegex = /\+\d{1,3}\d{6,14}/g;
      const matches = html.match(phoneRegex) || [];
      
      return [...new Set(matches)];
    } catch (error) {
      console.error(`Error scraping Quackr:`, error);
      return [];
    }
  }
  
  private async scrapeOnlineSim(url: string): Promise<string[]> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Extract phone numbers
      const phoneRegex = /\+\d{1,3}\d{6,14}/g;
      const matches = html.match(phoneRegex) || [];
      
      return [...new Set(matches)];
    } catch (error) {
      console.error(`Error scraping OnlineSim:`, error);
      return [];
    }
  }
  
  private async scrapeSmsTome(url: string): Promise<string[]> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Extract phone numbers
      const phoneRegex = /\+\d{1,3}\d{6,14}/g;
      const matches = html.match(phoneRegex) || [];
      
      return [...new Set(matches)];
    } catch (error) {
      console.error(`Error scraping SmsTome:`, error);
      return [];
    }
  }
  
  private async scrapeTemporaryPhoneNumber(url: string): Promise<string[]> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const html = await response.text();
      
      // This site might list numbers in a different format
      const phoneRegex = /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/g;
      const matches = html.match(phoneRegex) || [];
      
      return [...new Set(matches)];
    } catch (error) {
      console.error(`Error scraping Temporary Phone Number:`, error);
      return [];
    }
  }
  
  private async scrapeSms24(url: string): Promise<string[]> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Extract phone numbers
      const phoneRegex = /\+\d{1,3}\d{6,14}/g;
      const matches = html.match(phoneRegex) || [];
      
      return [...new Set(matches)];
    } catch (error) {
      console.error(`Error scraping SMS24:`, error);
      return [];
    }
  }
  
  private async scrapeGenericWebsite(url: string): Promise<string[]> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      // Try to determine the content type
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        // It's JSON data
        const data = await response.json();
        return this.extractPhoneNumbersFromJson(data);
      } else {
        // Assume it's HTML or text
        const text = await response.text();
        return this.extractPhoneNumbersFromText(text);
      }
    } catch (error) {
      console.error(`Error in generic scraping for ${url}:`, error);
      return [];
    }
  }
  
  private extractPhoneNumbersFromJson(data: any): string[] {
    // Convert the whole object to a string and extract phone numbers
    const jsonString = JSON.stringify(data);
    
    // Various phone number formats
    const phoneRegexPatterns = [
      /\+\d{1,3}\d{6,14}/g,  // International format: +[country code][number]
      /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,  // US/CA: xxx-xxx-xxxx
      /\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/g,  // US/CA: (xxx) xxx-xxxx
      /\d{5}[-.\s]?\d{6}/g,  // Some European formats
      /\d{4}[-.\s]?\d{3}[-.\s]?\d{3}/g   // Some Asian formats
    ];
    
    // Apply all regex patterns and collect matches
    const allMatches = phoneRegexPatterns.flatMap(regex => {
      const matches = jsonString.match(regex) || [];
      return [...matches];
    });
    
    // Filter and clean up the results
    return [...new Set(allMatches)]
      .filter(match => this.isLikelyPhoneNumber(match))
      .map(match => this.normalizePhoneNumber(match));
  }
  
  private extractPhoneNumbersFromText(text: string): string[] {
    // Various phone number formats
    const phoneRegexPatterns = [
      /\+\d{1,3}\d{6,14}/g,  // International format: +[country code][number]
      /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,  // US/CA: xxx-xxx-xxxx
      /\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/g,  // US/CA: (xxx) xxx-xxxx
      /\d{5}[-.\s]?\d{6}/g,  // Some European formats
      /\d{4}[-.\s]?\d{3}[-.\s]?\d{3}/g   // Some Asian formats
    ];
    
    // Apply all regex patterns and collect matches
    const allMatches = phoneRegexPatterns.flatMap(regex => {
      const matches = text.match(regex) || [];
      return [...matches];
    });
    
    // Filter and clean up the results
    return [...new Set(allMatches)]
      .filter(match => this.isLikelyPhoneNumber(match))
      .map(match => this.normalizePhoneNumber(match));
  }
  
  private isPhoneNumber(str: string): boolean {
    // Basic phone number validation regex
    const phoneRegex = /^\+?[0-9]{6,15}$/;
    return phoneRegex.test(str);
  }
  
  private isLikelyPhoneNumber(str: string): boolean {
    // More comprehensive check for potential phone numbers
    // Check length - most phone numbers are between 8 and 15 digits
    const digitsOnly = str.replace(/\D/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      return false;
    }
    
    // If it starts with common country codes, it's likely a phone number
    if (str.startsWith('+') || str.startsWith('00')) {
      return true;
    }
    
    // Check if it has a proper phone number format
    const hasFormat = /^[\d\+\-\(\)\s\.]+$/.test(str);
    
    return hasFormat;
  }
  
  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except the leading '+'
    const hasPlus = phoneNumber.startsWith('+');
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // Re-add the '+' if it was there initially
    return hasPlus ? `+${digitsOnly}` : digitsOnly;
  }
  
  // Keeping this as a fallback if all other methods fail
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
