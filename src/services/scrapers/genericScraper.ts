
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
        return this.extractPhoneNumbersFromText(text);
      }
    } catch (error) {
      console.error(`Error in generic scraping for ${url}:`, error);
      return [];
    }
  }
}
