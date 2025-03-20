import { useState } from 'react';
import { Check, Plus, Trash, ExternalLink, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Website, StorageService } from '@/services/storage';

export function WebsiteList() {
  const storageService = new StorageService();
  const [websites, setWebsites] = useState<Website[]>(storageService.getWebsites());
  const [newWebsite, setNewWebsite] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const handleToggleEnabled = (index: number) => {
    const updatedWebsites = [...websites];
    updatedWebsites[index].enabled = !updatedWebsites[index].enabled;
    setWebsites(updatedWebsites);
    storageService.setWebsites(updatedWebsites);
    
    toast({
      title: updatedWebsites[index].enabled ? 'Website Enabled' : 'Website Disabled',
      description: `${updatedWebsites[index].url} is now ${updatedWebsites[index].enabled ? 'enabled' : 'disabled'} for scraping.`,
      duration: 3000,
    });
  };
  
  const handleEnableAllWebsites = () => {
    if (websites.length === 0) {
      toast({
        title: 'No Websites Found',
        description: 'Add websites first before trying to enable all.',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }
    
    const disabledCount = websites.filter(w => !w.enabled).length;
    
    if (disabledCount === 0) {
      toast({
        title: 'All Websites Already Enabled',
        description: 'All websites are already enabled for scraping.',
        duration: 3000,
      });
      return;
    }
    
    const updatedWebsites = websites.map(website => ({
      ...website,
      enabled: true
    }));
    
    setWebsites(updatedWebsites);
    storageService.setWebsites(updatedWebsites);
    
    toast({
      title: 'All Websites Enabled',
      description: `Enabled ${disabledCount} website${disabledCount > 1 ? 's' : ''} for scraping.`,
      duration: 3000,
    });
  };
  
  const handleAddWebsite = () => {
    if (!newWebsite) return;
    
    try {
      // Basic validation
      new URL(newWebsite);
      
      // Check for duplicates
      if (websites.some(w => w.url.toLowerCase() === newWebsite.toLowerCase())) {
        toast({
          title: 'Website already exists',
          description: 'This website is already in your list.',
          variant: 'destructive',
          duration: 3000,
        });
        return;
      }
      
      const newWebsiteObj: Website = {
        url: newWebsite,
        enabled: true,
        lastScraped: null,
        addedAt: new Date().toISOString()
      };
      
      const updatedWebsites = [...websites, newWebsiteObj];
      setWebsites(updatedWebsites);
      storageService.setWebsites(updatedWebsites);
      setNewWebsite('');
      setIsAddingNew(false);
      
      toast({
        title: 'Website Added',
        description: `${newWebsite} has been added to your scraping list.`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid website URL including http:// or https://',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };
  
  const handleRemoveWebsite = (index: number) => {
    const websiteToRemove = websites[index];
    const updatedWebsites = websites.filter((_, i) => i !== index);
    setWebsites(updatedWebsites);
    storageService.setWebsites(updatedWebsites);
    
    toast({
      title: 'Website Removed',
      description: `${websiteToRemove.url} has been removed from your scraping list.`,
      duration: 3000,
    });
  };
  
  const handleImportDefault = () => {
    const defaultWebsites = [
      'https://receive-sms-free.cc/',
      'https://receive-smss.com/',
      'https://receive-sms.cc/',
      'https://spytm.com/',
      'https://quackr.io/',
      'https://onlinesim.io/',
      'https://smstome.com/',
      'https://receive-sms-online.info/',
      'https://app.smsplaza.io/',
      'https://textrapp.com/',
      'https://temporary-phone-number.com/',
      'https://sms24.me/',
      'https://sms-activate.guru/',
      'https://anonymsms.com/',
      'https://krispcall.com/virtual-phone-number',
      'https://deviceandbrowserinfo.com/api/phones/disposable',
      'https://raw.githubusercontent.com/iP1SMS/disposable-phone-numbers/refs/heads/master/number-list.json'
    ];
    
    const newWebsites: Website[] = defaultWebsites.map(url => ({
      url,
      enabled: true,
      lastScraped: null,
      addedAt: new Date().toISOString()
    }));
    
    // Filter out duplicates
    const existingUrls = new Set(websites.map(w => w.url.toLowerCase()));
    const filteredNewWebsites = newWebsites.filter(w => !existingUrls.has(w.url.toLowerCase()));
    
    if (filteredNewWebsites.length === 0) {
      toast({
        title: 'No New Websites',
        description: 'All default websites are already in your list.',
        duration: 3000,
      });
      return;
    }
    
    const updatedWebsites = [...websites, ...filteredNewWebsites];
    setWebsites(updatedWebsites);
    storageService.setWebsites(updatedWebsites);
    
    toast({
      title: 'Default Websites Imported',
      description: `Added ${filteredNewWebsites.length} new websites to your scraping list.`,
      duration: 3000,
    });
  };
  
  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Scraping Sources</CardTitle>
            <CardDescription className="mt-1">
              Manage websites to scrape for phone numbers
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleImportDefault}
            >
              Import Default
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleEnableAllWebsites}
            >
              <Power className="h-4 w-4 mr-2" />
              Enable All
            </Button>
            <Button 
              size="sm"
              onClick={() => setIsAddingNew(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Website
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isAddingNew && (
          <div className="flex items-center space-x-2 mb-4 animate-slide-in">
            <Input
              placeholder="https://example.com"
              value={newWebsite}
              onChange={(e) => setNewWebsite(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button variant="outline" size="icon" onClick={handleAddWebsite}>
              <Check className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setNewWebsite('');
                setIsAddingNew(false);
              }}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <ScrollArea className="h-[300px] overflow-y-auto pr-3 -mr-3">
          <div className="space-y-2 fade-mask">
            {websites.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <p className="text-muted-foreground mb-3">No websites added yet</p>
                <Button 
                  variant="outline" 
                  onClick={handleImportDefault}
                >
                  Import Default Websites
                </Button>
              </div>
            ) : (
              websites.map((website, index) => (
                <div 
                  key={index}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md transition-all",
                    website.enabled 
                      ? "bg-accent/50" 
                      : "bg-background opacity-70"
                  )}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <Switch
                      checked={website.enabled}
                      onCheckedChange={() => handleToggleEnabled(index)}
                      className="mr-3"
                    />
                    <div className="overflow-hidden">
                      <div className="flex items-center">
                        <p className={cn(
                          "text-sm font-medium truncate mr-2",
                          !website.enabled && "text-muted-foreground"
                        )}>
                          {new URL(website.url).hostname.replace('www.', '')}
                        </p>
                        {website.lastScraped && (
                          <Badge variant="outline" className="text-xs">
                            Last: {new Date(website.lastScraped).toLocaleString()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {website.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(website.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveWebsite(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default WebsiteList;
