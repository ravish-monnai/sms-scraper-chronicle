
import { useState } from 'react';
import { ExternalLink, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Website } from '@/services/storage';

interface WebsiteItemProps {
  website: Website;
  index: number;
  onToggle: (index: number) => void;
  onRemove: (index: number) => void;
}

export function WebsiteItem({ website, index, onToggle, onRemove }: WebsiteItemProps) {
  return (
    <div 
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
          onCheckedChange={() => onToggle(index)}
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
          onClick={() => onRemove(index)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default WebsiteItem;
