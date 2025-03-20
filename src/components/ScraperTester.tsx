
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { testWebsiteScraper } from "@/services/scrapers/testScraper";
import { Loader2, Search, AlertCircle, Clock, Phone, Info } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ScraperTester() {
  const [url, setUrl] = useState("");
  const [results, setResults] = useState<{
    phoneNumbers: string[];
    timing: { durationMs: number };
    error?: string;
    usingDemoData?: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = async () => {
    if (!url) {
      toast({
        title: "URL Required",
        description: "Please enter a website URL to test",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL including http:// or https://",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      const testResult = await testWebsiteScraper(url);
      
      // Check if this is the disposable phones endpoint by looking at the URL
      // and if we found phone numbers - this indicates demo data was likely used
      const usingDemoData = testResult.phoneNumbers.length > 0 && 
                          url.includes('/disposable');
      
      setResults({
        ...testResult,
        usingDemoData
      });
      
      if (testResult.success) {
        toast({
          title: "Scraping Complete",
          description: `Found ${testResult.phoneNumbers.length} phone numbers in ${testResult.timing.durationMs / 1000} seconds`,
        });
      } else {
        toast({
          title: "Scraping Error",
          description: testResult.error || "An unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card h-full">
      <CardHeader>
        <CardTitle>Test Scraper</CardTitle>
        <CardDescription>
          Test phone number scraping on a specific website
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="url"
              placeholder="Enter website URL to test..."
              className="pl-9 pr-4"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button onClick={handleTest} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Scraper"
            )}
          </Button>
        </div>

        {results && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Results</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="mr-1 h-4 w-4" />
                {(results.timing.durationMs / 1000).toFixed(2)}s
              </div>
            </div>

            {results.usingDemoData && (
              <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                <Info className="h-4 w-4" />
                <AlertTitle>Demo Data</AlertTitle>
                <AlertDescription>
                  The API returned an access error, so sample demo data is being shown for demonstration purposes.
                </AlertDescription>
              </Alert>
            )}

            {results.error ? (
              <div className="rounded-md bg-destructive/10 p-4 text-destructive">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-medium">Error</p>
                </div>
                <p className="mt-2 text-sm">{results.error}</p>
              </div>
            ) : results.phoneNumbers.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>Found {results.phoneNumbers.length} phone numbers</span>
                </div>
                <div className="max-h-48 overflow-y-auto rounded-md border p-2">
                  <ul className="space-y-1">
                    {results.phoneNumbers.map((phone, index) => (
                      <li key={index} className="font-mono text-sm">
                        {phone}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="rounded-md bg-muted p-4 text-center text-muted-foreground">
                No phone numbers found on this website
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
