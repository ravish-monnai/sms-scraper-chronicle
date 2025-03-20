
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import PhoneNumberTable from '@/components/PhoneNumberTable';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { StorageService } from '@/services/storage';
import { PhoneNumberRecord } from '@/services/types';
import { FileDown, RefreshCw } from 'lucide-react';

const Report = () => {
  const storageService = new StorageService();
  
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = () => {
    setIsLoading(true);
    
    try {
      const allNumbers = storageService.getPhoneNumbers();
      setPhoneNumbers(allNumbers);
    } catch (error) {
      console.error('Error loading phone numbers:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const groupBySource = (): Record<string, PhoneNumberRecord[]> => {
    const grouped: Record<string, PhoneNumberRecord[]> = {};
    
    phoneNumbers.forEach(number => {
      const source = number.source;
      if (!grouped[source]) {
        grouped[source] = [];
      }
      grouped[source].push(number);
    });
    
    return grouped;
  };
  
  const sourceGroups = groupBySource();
  const sources = Object.keys(sourceGroups);
  
  // Export all data to CSV
  const handleExportAll = () => {
    const csvData = [
      ['Phone Number', 'Source', 'Timestamp'],
      ...phoneNumbers.map(item => [
        item.phoneNumber,
        item.source,
        new Date(item.timestamp).toLocaleString()
      ])
    ];
    
    const csvContent = csvData
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `all-phone-numbers-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="layout space-y-6">
          <div>
            <span className="title-chip">Reports</span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Phone Number Report</h1>
                <p className="text-muted-foreground">View and analyze all collected phone numbers</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={loadData}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  onClick={handleExportAll}
                  disabled={phoneNumbers.length === 0}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export All
                </Button>
              </div>
            </div>
          </div>
          
          <Card className="glass-card">
            <CardContent className="p-6">
              {phoneNumbers.length === 0 && !isLoading ? (
                <div className="text-center p-12">
                  <h3 className="text-lg font-medium mb-2">No phone numbers found</h3>
                  <p className="text-muted-foreground mb-4">
                    Configure your scraping settings to start collecting phone numbers.
                  </p>
                  <Button variant="outline" onClick={() => window.location.href = '/settings'}>
                    Go to Settings
                  </Button>
                </div>
              ) : (
                <Tabs 
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <TabsList className="bg-muted/50">
                      <TabsTrigger value="all" className="relative">
                        All Sources
                        <Badge className="ml-2 bg-primary/20 text-primary text-xs">
                          {phoneNumbers.length}
                        </Badge>
                      </TabsTrigger>
                      {sources.length > 0 && (
                        <TabsTrigger value="by-source">By Source</TabsTrigger>
                      )}
                    </TabsList>
                  </div>
                  
                  <TabsContent value="all" className="animate-fade-in">
                    <PhoneNumberTable 
                      data={phoneNumbers}
                      isLoading={isLoading}
                    />
                  </TabsContent>
                  
                  <TabsContent value="by-source" className="animate-fade-in">
                    <div className="space-y-8">
                      {sources.map(source => (
                        <div key={source} className="space-y-3">
                          <div>
                            <h3 className="text-lg font-medium">
                              {new URL(source).hostname.replace('www.', '')}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">{source}</p>
                          </div>
                          <PhoneNumberTable 
                            data={sourceGroups[source]} 
                            isLoading={isLoading}
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Report;
