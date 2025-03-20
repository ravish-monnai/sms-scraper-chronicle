
import { useState } from 'react';
import Header from '@/components/Header';
import WebsiteList from '@/components/WebsiteList';
import ScrapingScheduler from '@/components/ScrapingScheduler';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Download, Upload, RefreshCw, Database } from 'lucide-react';
import { StorageService } from '@/services/storage';
import { PhoneNumberRecord } from '@/services/types';

const Settings = () => {
  const storageService = new StorageService();
  
  const [isResetting, setIsResetting] = useState(false);
  
  const handleExportData = () => {
    const phoneNumbers = storageService.getPhoneNumbers();
    const websites = storageService.getWebsites();
    
    const exportData = {
      phoneNumbers,
      websites,
      exportedAt: new Date().toISOString()
    };
    
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sms-patrol-export-${new Date().toISOString().slice(0, 10)}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Export Complete',
      description: 'All data has been exported successfully',
      duration: 3000,
    });
  };
  
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (!data.phoneNumbers || !Array.isArray(data.phoneNumbers) || !data.websites || !Array.isArray(data.websites)) {
          throw new Error('Invalid data format');
        }
        
        // Import data
        storageService.setPhoneNumbers(data.phoneNumbers);
        storageService.setWebsites(data.websites);
        
        toast({
          title: 'Import Successful',
          description: `Imported ${data.phoneNumbers.length} phone numbers and ${data.websites.length} websites`,
          duration: 3000,
        });
        
        // Reload page to reflect changes
        window.location.reload();
      } catch (error) {
        toast({
          title: 'Import Failed',
          description: 'The selected file contains invalid data',
          variant: 'destructive',
          duration: 3000,
        });
      }
    };
    
    reader.readAsText(file);
    
    // Reset input value so the same file can be selected again
    event.target.value = '';
  };
  
  const handleResetData = () => {
    setIsResetting(true);
    
    try {
      storageService.setPhoneNumbers([]);
      storageService.setWebsites([]);
      storageService.setSchedulerStatus(false);
      storageService.setNextScheduledRun(null);
      
      toast({
        title: 'Data Reset Complete',
        description: 'All phone numbers and websites have been deleted',
        duration: 3000,
      });
      
      // Reload page to reflect changes
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast({
        title: 'Reset Failed',
        description: 'An error occurred while resetting data',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsResetting(false);
    }
  };
  
  const handleGenerateTestData = () => {
    const phoneNumbers: PhoneNumberRecord[] = [];
    const websites = storageService.getWebsites();
    
    if (websites.length === 0) {
      toast({
        title: 'No Websites Found',
        description: 'Please add websites before generating test data',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }
    
    // Generate 50 random phone numbers
    for (let i = 0; i < 50; i++) {
      const website = websites[Math.floor(Math.random() * websites.length)];
      
      // Create a random phone number
      const countryCode = ['+1', '+44', '+49', '+33', '+7', '+86', '+91'][Math.floor(Math.random() * 7)];
      const number = countryCode + Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
      
      // Random date within the last 30 days
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      phoneNumbers.push({
        id: `test-${i}`,
        phoneNumber: number,
        source: website.url,
        timestamp: date.toISOString()
      });
    }
    
    storageService.setPhoneNumbers(phoneNumbers);
    
    toast({
      title: 'Test Data Generated',
      description: 'Added 50 test phone numbers to the database',
      duration: 3000,
    });
    
    // Reload page to reflect changes
    window.location.reload();
  };
  
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="layout space-y-8">
          <div>
            <span className="title-chip">Settings</span>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Configuration</h1>
            <p className="text-muted-foreground">Manage scraping sources and application settings</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <WebsiteList />
            </div>
            
            <div>
              <ScrapingScheduler />
            </div>
          </div>
          
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Backup, restore, or reset your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center" 
                  onClick={handleExportData}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
                
                <div className="relative w-full">
                  <input
                    type="file"
                    id="import-file"
                    accept=".json"
                    onChange={handleImportData}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center pointer-events-none"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import Data
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center"
                  onClick={handleGenerateTestData}
                >
                  <Database className="mr-2 h-4 w-4" />
                  Generate Test Data
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="w-full flex items-center justify-center"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Reset All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all your
                        phone numbers and website settings.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleResetData}
                        className="bg-destructive text-destructive-foreground"
                      >
                        {isResetting ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>Delete</>
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
