
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
}: MembersToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <h1 className="text-2xl font-bold text-gradient">Members List</h1>
      <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
        <SearchInput
          value={searchValue}
          placeholder="Search members..."
          onSearch={onSearch}
        />
        
        {isAdmin && (
          <Select
            value={selectedCollector}
            onValueChange={onCollectorChange}
          >
            <SelectTrigger className="w-[200px] glass-card">
              <SelectValue placeholder="Filter by collector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Collectors</SelectItem>
              {collectors?.map((collector) => (
                <SelectItem key={collector.id} value={collector.id}>
                  {collector.name || `Collector ${collector.number}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="glass-card">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
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

        {isAdmin && (
          <AddMemberDialog onSubmit={onAddMember} collectors={collectors} />
        )}
      </div>
    </div>
  );
}
