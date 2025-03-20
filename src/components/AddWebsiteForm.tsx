
import { useState } from 'react';
import { Check, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddWebsiteFormProps {
  newWebsite: string;
  setNewWebsite: (value: string) => void;
  onAdd: () => void;
  onCancel: () => void;
}

export function AddWebsiteForm({ newWebsite, setNewWebsite, onAdd, onCancel }: AddWebsiteFormProps) {
  return (
    <div className="flex items-center space-x-2 mb-4 animate-slide-in">
      <Input
        placeholder="https://example.com"
        value={newWebsite}
        onChange={(e) => setNewWebsite(e.target.value)}
        className="flex-1"
        autoFocus
      />
      <Button variant="outline" size="icon" onClick={onAdd}>
        <Check className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={onCancel}
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default AddWebsiteForm;
