
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import StatusCard from '@/components/StatusCard';
import WebsiteList from '@/components/WebsiteList';
import PhoneNumberTable from '@/components/PhoneNumberTable';
import ScrapingScheduler from '@/components/ScrapingScheduler';
import { Button } from '@/components/ui/button';
import { StorageService } from '@/services/storage';
import { ScraperService } from '@/services/scrapers';
import { ArrowRight, ListFilter, Phone, Globe, Clock } from 'lucide-react';
import { ScrapingStats, PhoneNumberRecord } from '@/services/types';

const Index = () => {
  const storageService = new StorageService();
  const scraperService = new ScraperService();
  
  const [stats, setStats] = useState<ScrapingStats>({
    totalNumbers: 0,
    uniqueNumbers: 0,
    lastScraped: null,
    activeSources: 0,
    totalSources: 0
  });
  
  const [recentNumbers, setRecentNumbers] = useState<PhoneNumberRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = () => {
    setIsLoading(true);
    
    try {
      // Get stats
      const currentStats = storageService.getScrapingStats();
      setStats(currentStats);
      
      // Get recent phone numbers (last 5)
      const allNumbers = storageService.getPhoneNumbers();
      const sortedNumbers = [...allNumbers].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setRecentNumbers(sortedNumbers.slice(0, 5));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate trend for demo purposes (random +/- 5%)
  const getTrend = () => {
    const value = Math.floor(Math.random() * 10) - 5;
    return {
      value: Math.abs(value),
      isPositive: value >= 0
    };
  };
  
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="layout space-y-8">
          <div>
            <span className="title-chip">Dashboard</span>
            <h1 className="text-3xl font-bold tracking-tight mb-2">SMS Patrol</h1>
            <p className="text-muted-foreground">Monitor and collect phone numbers from multiple sources</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatusCard
              title="Total Phone Numbers"
              value={stats.totalNumbers}
              icon={Phone}
              trend={getTrend()}
              isLoading={isLoading}
              description="All scraped numbers"
            />
            <StatusCard
              title="Unique Numbers"
              value={stats.uniqueNumbers}
              icon={ListFilter}
              trend={getTrend()}
              isLoading={isLoading}
              description="Deduplicated count"
            />
            <StatusCard
              title="Active Sources"
              value={`${stats.activeSources}/${stats.totalSources}`}
              icon={Globe}
              isLoading={isLoading}
              description="Enabled scraping websites"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Recent Numbers</h2>
                  <Link to="/report">
                    <Button variant="outline" size="sm">
                      View All <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                
                <PhoneNumberTable
                  data={recentNumbers}
                  isLoading={isLoading}
                  onRefresh={loadData}
                />
              </div>
              
              <WebsiteList />
            </div>
            
            <div>
              <ScrapingScheduler />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
