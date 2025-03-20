
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight, RefreshCw, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhoneNumberRecord } from '@/services/types';

interface PhoneNumberTableProps {
  data: PhoneNumberRecord[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function PhoneNumberTable({
  data = [],
  isLoading = false,
  onRefresh
}: PhoneNumberTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'date' | 'phone' | 'source'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filteredData, setFilteredData] = useState<PhoneNumberRecord[]>([]);
  
  const itemsPerPage = 10;
  
  useEffect(() => {
    // Filter data based on search term
    const filtered = data.filter(
      item => 
        item.phoneNumber.includes(searchTerm) || 
        item.source.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Sort data
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return sortDirection === 'asc' 
          ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else if (sortBy === 'phone') {
        return sortDirection === 'asc'
          ? a.phoneNumber.localeCompare(b.phoneNumber)
          : b.phoneNumber.localeCompare(a.phoneNumber);
      } else {
        return sortDirection === 'asc'
          ? a.source.localeCompare(b.source)
          : b.source.localeCompare(a.source);
      }
    });
    
    setFilteredData(sorted);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [data, searchTerm, sortBy, sortDirection]);
  
  const pageCount = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);
  
  const handleSort = (field: 'date' | 'phone' | 'source') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };
  
  const handleExport = () => {
    const csvData = [
      ['Phone Number', 'Source', 'Timestamp'],
      ...filteredData.map(item => [
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
    link.setAttribute('download', `phone-numbers-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search phone numbers or sources..."
            className="pl-9 pr-4"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            disabled={filteredData.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] cursor-pointer" onClick={() => handleSort('phone')}>
                <div className="flex items-center">
                  Phone Number
                  {sortBy === 'phone' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('source')}>
                <div className="flex items-center">
                  Source
                  {sortBy === 'source' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('date')}>
                <div className="flex items-center justify-end">
                  Date Added
                  {sortBy === 'date' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="h-4 w-24 bg-muted rounded ml-auto animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono font-medium">{item.phoneNumber}</TableCell>
                  <TableCell>{item.source}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(item.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {filteredData.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {Math.min(filteredData.length, startIndex + 1)} - {Math.min(filteredData.length, startIndex + itemsPerPage)} of {filteredData.length} results
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Select
              value={currentPage.toString()}
              onValueChange={(value) => setCurrentPage(parseInt(value))}
            >
              <SelectTrigger className="w-16">
                <SelectValue placeholder={currentPage} />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: pageCount }, (_, i) => (
                  <SelectItem key={i} value={(i + 1).toString()}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= pageCount}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhoneNumberTable;
