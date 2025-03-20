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
          return this.extractPhoneNumbersFromSmsFreeSite(text, url);
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
  private extractPhoneNumbersFromSmsFreeSite(html: string, url: string): string[] {
    try {
      console.log("Using specialized extraction for receive-sms-free.cc");
      
      const phones: string[] = [];
      
      // Extract phone numbers from the main page listing
      // The site has phone numbers in div elements with class "number-boxes"
      // each containing a link with the phone number
      const numberBoxRegex = /<div[^>]*class="number-box"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      
      while ((match = numberBoxRegex.exec(html)) !== null) {
        // The href attribute contains the path to the phone's detail page
        const phonePath = match[1];
        // The text content contains the phone number
        const phoneText = match[2].replace(/<[^>]*>/g, '').trim();
        
        if (phoneText && this.isLikelyPhoneNumber(phoneText)) {
          phones.push(this.normalizePhoneNumber(phoneText));
        } else if (phonePath) {
          // If we can't extract from the text, try to get it from the URL path
          // URLs are often in format /XXX-XXX-XXXX/
          const pathMatch = phonePath.match(/\/(\d[\d-]+\d)\//);
          if (pathMatch && pathMatch[1]) {
            const phoneFromPath = pathMatch[1].replace(/-/g, '');
            if (this.isLikelyPhoneNumber(phoneFromPath)) {
              phones.push(this.normalizePhoneNumber(phoneFromPath));
            }
          }
        }
      }
      
      // Also look for phone numbers directly in h1, h2, h3 elements
      const headingRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
      while ((match = headingRegex.exec(html)) !== null) {
        const headingText = match[1].replace(/<[^>]*>/g, '').trim();
        const phoneMatch = headingText.match(/(\+?[\d-() ]{8,})/);
        if (phoneMatch && phoneMatch[1] && this.isLikelyPhoneNumber(phoneMatch[1])) {
          phones.push(this.normalizePhoneNumber(phoneMatch[1]));
        }
      }
      
      // Try another approach - look for number blocks
      const numberBlockRegex = /<div[^>]*class="number-boxes"[^>]*>([\s\S]*?)<\/div>/gi;
      while ((match = numberBlockRegex.exec(html)) !== null) {
        const blockContent = match[1];
        // Extract all digit sequences that could be phone numbers
        const numberMatches = blockContent.match(/(\+?\d[\d-() ]{7,}\d)/g);
        if (numberMatches) {
          for (const num of numberMatches) {
            if (this.isLikelyPhoneNumber(num)) {
              phones.push(this.normalizePhoneNumber(num));
            }
          }
        }
      }
      
      // If still no results, try a more aggressive approach to find any potential phone numbers
      if (phones.length === 0) {
        // Look for strings with digits, spaces, dashes and parentheses that could be phone numbers
        const genericPhoneRegex = /(\+?[\d-() ]{8,})/g;
        let genericMatch;
        while ((genericMatch = genericPhoneRegex.exec(html)) !== null) {
          const potentialNumber = genericMatch[1].trim();
          // Count digits to filter out dates and other non-phone numbers
          const digitCount = (potentialNumber.match(/\d/g) || []).length;
          if (digitCount >= 7 && digitCount <= 15) {
            phones.push(this.normalizePhoneNumber(potentialNumber));
          }
        }
      }
      
      // Get unique phone numbers only
      return [...new Set(phones)];
    } catch (error) {
      console.error("Error in specialized extraction:", error);
      return [];
    }
  }
  
  protected isPhoneNumber(str: string): boolean {
    // Basic phone number validation regex
    const phoneRegex = /^\+?[0-9]{6,15}$/;
    return phoneRegex.test(str);
  }
  
  protected isLikelyPhoneNumber(str: string): boolean {
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
  
  protected normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except the leading '+'
    const hasPlus = phoneNumber.startsWith('+');
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // Re-add the '+' if it was there initially
    return hasPlus ? `+${digitsOnly}` : digitsOnly;
  }
  
  protected extractPhoneNumbersFromText(text: string): string[] {
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
  
  protected extractPhoneNumbersFromJson(data: any): string[] {
    // Convert the whole object to a string and extract phone numbers
    const jsonString = JSON.stringify(data);
    return this.extractPhoneNumbersFromText(jsonString);
  }
}
