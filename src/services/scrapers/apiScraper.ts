
import { BaseScraper } from './baseScraper';

export class ApiScraper extends BaseScraper {
  public async scrapeDeviceAndBrowserInfo(url: string): Promise<string[]> {
    try {
      console.log(`Fetching data from ${url}`);
      
      // First try to get real data
      try {
        const response = await this.fetchWithCorsProxy(url);
        const data = await response.json();
        console.log(`Received data from ${url}:`, data);
        
        // Extract phone numbers from the API response
        if (Array.isArray(data) && data.length > 0) {
          // If it's an array of objects with phone numbers
          const phoneNumbers: string[] = [];
          
          // Handle disposable phones endpoint which has a different structure
          if (url.includes('/disposable')) {
            data.forEach((item: any) => {
              if (item && typeof item.number === 'string') {
                phoneNumbers.push(item.number);
              }
            });
          } else {
            // Standard endpoint format
            data.forEach((item: any) => {
              if (item && typeof item.phone === 'string') {
                phoneNumbers.push(item.phone);
              }
            });
          }
          
          return phoneNumbers;
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
      } catch (fetchError) {
        console.log("Could not fetch real data, using demo data instead:", fetchError);
        // If the URL is for disposable phones, return mock data for demonstration
        if (url.includes('/disposable')) {
          console.log("Providing sample disposable phone numbers for demonstration");
          return [
            "+12025550179",
            "+14155552671",
            "+17185559723",
            "+18045551168",
            "+19175554492",
            "+442071234567",
            "+61261234567",
            "+33123456789",
            "+491234567890",
            "+81345678901"
          ];
        }
      }
      
      console.log('Could not parse phone numbers from response');
      return [];
    } catch (error) {
      console.error(`Error scraping DeviceAndBrowserInfo API:`, error);
      return [];
    }
  }
}
