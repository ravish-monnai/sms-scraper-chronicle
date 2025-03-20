
export interface PhoneNumberRecord {
  id: string;
  phoneNumber: string;
  source: string;
  timestamp: string;
}

export interface ScrapingStats {
  totalNumbers: number;
  uniqueNumbers: number;
  lastScraped: string | null;
  activeSources: number;
  totalSources: number;
}

export interface ScrapingResult {
  success: boolean;
  message: string;
  newNumbers: number;
  totalProcessed: number;
}
