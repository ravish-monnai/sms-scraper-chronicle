
import { ScraperService } from './scraperService';
import { GenericScraper } from './genericScraper';
import { ApiScraper } from './apiScraper';
import { JsonScraper } from './jsonScraper';

/**
 * Utility function to test a scraper on a specific URL
 * @param url The website URL to test scraping
 * @returns Result of the scraping operation
 */
export async function testScraper(url: string): Promise<{
  success: boolean;
  phoneNumbers: string[];
  error?: string;
}> {
  console.log(`Testing scraper for URL: ${url}`);
  
  try {
    // Determine which scraper to use based on URL patterns
    let phoneNumbers: string[] = [];
    
    if (url.includes('deviceandbrowserinfo.com/api/phones')) {
      const apiScraper = new ApiScraper();
      phoneNumbers = await apiScraper.scrapeDeviceAndBrowserInfo(url);
    } else if (url.includes('github') && url.includes('json')) {
      const jsonScraper = new JsonScraper();
      phoneNumbers = await jsonScraper.scrapeGithubJson(url);
    } else {
      const genericScraper = new GenericScraper();
      phoneNumbers = await genericScraper.scrapeGenericWebsite(url);
    }
    
    console.log(`Successfully scraped ${phoneNumbers.length} phone numbers`);
    return {
      success: true,
      phoneNumbers
    };
  } catch (error) {
    console.error('Error testing scraper:', error);
    return {
      success: false,
      phoneNumbers: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Expose a function to test a website and return the results
export async function testWebsiteScraper(url: string): Promise<{
  success: boolean;
  phoneNumbers: string[];
  error?: string;
  timing: {
    start: string;
    end: string;
    durationMs: number;
  };
}> {
  const startTime = new Date();
  const result = await testScraper(url);
  const endTime = new Date();
  
  return {
    ...result,
    timing: {
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      durationMs: endTime.getTime() - startTime.getTime()
    }
  };
}
