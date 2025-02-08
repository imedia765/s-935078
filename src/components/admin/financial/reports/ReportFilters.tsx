
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReportDateRangePicker } from "./ReportDateRangePicker";
import { Download } from "lucide-react";

interface ReportFiltersProps {
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
  onTypeChange: (type: string) => void;
  onExport: (format: 'excel' | 'csv' | 'pdf') => void;
  isExporting: boolean;
}

export function ReportFilters({ onDateRangeChange, onTypeChange, onExport, isExporting }: ReportFiltersProps) {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date Range</label>
          <ReportDateRangePicker onRangeChange={onDateRangeChange} />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Report Type</label>
          <Select onValueChange={onTypeChange} defaultValue="all">
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="pending">Pending Payments</SelectItem>
              <SelectItem value="approved">Approved Payments</SelectItem>
              <SelectItem value="collector">By Collector</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            onClick={() => onExport('excel')}
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => onExport('csv')}
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => onExport('pdf')}
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>
    </Card>
  );
}
