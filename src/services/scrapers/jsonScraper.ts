
import { BaseScraper } from './baseScraper';

export class JsonScraper extends BaseScraper {
  public async scrapeGithubJson(url: string): Promise<string[]> {
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
}
