
import { BaseScraper } from './baseScraper';

export class GenericScraper extends BaseScraper {
  public async scrapeGenericWebsite(url: string): Promise<string[]> {
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
        
        // Special handling for receive-sms-free.cc
        if (url.includes('receive-sms-free.cc')) {
          return this.extractPhoneNumbersFromSmsFreeSite(text);
        }
        
        return this.extractPhoneNumbersFromText(text);
      }
    } catch (error) {
      console.error(`Error in generic scraping for ${url}:`, error);
      return [];
    }
  }
  
  /**
   * Specialized extraction for receive-sms-free.cc site
   */
  private extractPhoneNumbersFromSmsFreeSite(html: string): string[] {
    try {
      console.log("Using specialized extraction for receive-sms-free.cc");
      
      // This site often has phone numbers in specific patterns
      // Looking for elements with phone number formatting
      const phoneRegex = /\+\d{10,15}|(\d{1,3}[-\.\s]??\d{3}[-\.\s]??\d{3,4})|(\(\d{3}\)\s*\d{3}[-\.\s]??\d{4})/g;
      const matches = html.match(phoneRegex) || [];
      
      // Also look for numbers in specific HTML patterns on the site
      // The site often has numbers in <span> or <div> elements with specific classes
      const htmlPhonePatterns = [
        /<div[^>]*class="number"[^>]*>(.*?)<\/div>/gi,
        /<span[^>]*class="number"[^>]*>(.*?)<\/span>/gi,
        /<td[^>]*class="phone"[^>]*>(.*?)<\/td>/gi,
        /<div[^>]*class="phone-number"[^>]*>(.*?)<\/div>/gi
      ];
      
      const htmlMatches = htmlPhonePatterns.flatMap(pattern => {
        const elements = html.match(pattern) || [];
        return elements.map(el => {
          // Extract text content between tags
          const textMatch = el.match(/>([^<]*)</);
          return textMatch ? textMatch[1].trim() : "";
        });
      }).filter(text => text && this.isLikelyPhoneNumber(text));
      
      // Combine all matches and remove duplicates
      const allMatches = [...matches, ...htmlMatches];
      
      // If regular matching fails, try table rows as this site often puts numbers in tables
      if (allMatches.length === 0) {
        // Look for table rows with potential phone numbers
        const tableRowRegex = /<tr[^>]*>(.*?)<\/tr>/gis;
        const tableRows = html.match(tableRowRegex) || [];
        
        for (const row of tableRows) {
          const digitsOnly = row.replace(/\D/g, '');
          // If row has enough digits to be a phone number, extract it
          if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
            const formattedNumber = `+${digitsOnly.substring(0, 15)}`;
            allMatches.push(formattedNumber);
          }
        }
      }
      
      // Normalize and filter the results
      return [...new Set(allMatches)]
        .filter(match => this.isLikelyPhoneNumber(match))
        .map(match => this.normalizePhoneNumber(match));
    } catch (error) {
      console.error("Error in specialized extraction:", error);
      return [];
    }
  }
}
