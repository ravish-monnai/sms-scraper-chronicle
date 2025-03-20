
export abstract class BaseScraper {
  protected corsProxyUrl = 'https://corsproxy.io/?';
  
  protected async fetchWithCorsProxy(url: string): Promise<Response> {
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
