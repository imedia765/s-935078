
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileDown } from "lucide-react";
import { SearchInput } from "./SearchInput";
import { AddMemberDialog } from "./AddMemberDialog";

interface MembersToolbarProps {
  onSearch: (term: string) => void;
  searchValue: string;
  selectedCollector: string;
  onCollectorChange: (value: string) => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  onAddMember: (data: any) => void;
  collectors: any[];
  isAdmin?: boolean;
  currentCollector?: { id: string; name: string } | null;
}

export function MembersToolbar({
  onSearch,
  searchValue,
  selectedCollector,
  onCollectorChange,
  onExportCSV,
  onExportPDF,
  onExportExcel,
  onAddMember,
  collectors,
  isAdmin = false,
  currentCollector,
}: MembersToolbarProps) {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gradient">Members List</h1>
        {isAdmin && (
          <AddMemberDialog onSubmit={onAddMember} collectors={collectors} />
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            value={searchValue}
            placeholder="Search members..."
            onSearch={onSearch}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {isAdmin ? (
            <Select
              value={selectedCollector}
              onValueChange={onCollectorChange}
            >
              <SelectTrigger className="w-full sm:w-[200px] glass-card">
                <SelectValue placeholder="Filter by collector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Collectors</SelectItem>
                {collectors?.map((collector) => (
                  collector.id && (
                    <SelectItem key={collector.id} value={collector.id}>
                      {collector.name || `Collector ${collector.member_number}`} (#{collector.member_number})
                    </SelectItem>
                  )
                ))}
              </SelectContent>
            </Select>
          ) : currentCollector && (
            <div className="w-full sm:w-[200px] px-4 py-2 glass-card rounded-md text-sm">
              Current Group: {currentCollector.name}
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto glass-card">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onExportCSV}>
                <FileDown className="mr-2 h-4 w-4" />
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportPDF}>
                <FileDown className="mr-2 h-4 w-4" />
                Export to PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportExcel}>
                <FileDown className="mr-2 h-4 w-4" />
                Export to Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
