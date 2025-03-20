
import { v4 as uuidv4 } from 'uuid';
import { PhoneNumberRecord, ScrapingResult } from './types';
import { StorageService } from './storage';

export class ScraperService {
  private storageService: StorageService;
  private corsProxyUrl = 'https://corsproxy.io/?';
  
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
        return await this.scrapeDeviceAndBrowserInfo(url);
      } else if (url.includes('github') && url.includes('json')) {
        return await this.scrapeGithubJson(url);
      } else {
        // Generic scraping for other websites
        return await this.scrapeGenericWebsite(url);
      }
    } catch (error) {
      console.error(`Error in scrapeWebsite for ${url}:`, error);
      return [];
    }
  }
  
  private async fetchWithCorsProxy(url: string): Promise<Response> {
    // Try direct fetch first
    try {
      console.log(`Fetching ${url} directly...`);
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
      throw new Error('Direct fetch failed or had CORS issues');
    } catch (error) {
      // If direct fetch fails (usually due to CORS), try with proxy
      console.log(`Retrying with CORS proxy: ${url}`);
      try {
        const proxyUrl = `${this.corsProxyUrl}${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch with proxy: ${response.status}`);
        }
        
        return response;
      } catch (proxyError) {
        console.error(`Proxy fetch failed for ${url}:`, proxyError);
        throw proxyError;
      }
    }
  }
  
  private async scrapeDeviceAndBrowserInfo(url: string): Promise<string[]> {
    try {
      console.log(`Fetching data from ${url}`);
      const response = await this.fetchWithCorsProxy(url);
      
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
      const response = await this.fetchWithCorsProxy(url);
      
      const data = await response.json();
      
      // Extract all phone-like strings from the JSON data
      return this.extractPhoneNumbersFromJson(data);
    } catch (error) {
      console.error(`Error scraping GitHub JSON:`, error);
      return [];
    }
  }
  
  private async scrapeGenericWebsite(url: string): Promise<string[]> {
    try {
      console.log(`Generic scraping of ${url}`);
      const response = await this.fetchWithCorsProxy(url);
      
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
}
