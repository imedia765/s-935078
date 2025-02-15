
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
import { Download, FileDown, Filter } from "lucide-react";
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
    <div className="space-y-3 p-2">
      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <h1 className="text-xl font-semibold text-primary">Members List</h1>
        {isAdmin && (
          <AddMemberDialog onSubmit={onAddMember} collectors={collectors} />
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 min-w-0">
          <SearchInput
            value={searchValue}
            placeholder="Search members..."
            onSearch={onSearch}
          />
        </div>
        
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Select
              value={selectedCollector}
              onValueChange={onCollectorChange}
            >
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <SelectValue placeholder="Filter by collector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Collectors</SelectItem>
                {collectors?.map((collector) => (
                  collector.id && (
                    <SelectItem key={collector.id} value={collector.id}>
                      <span className="truncate block">
                        {collector.name || `Collector ${collector.member_number}`}
                      </span>
                    </SelectItem>
                  )
                ))}
              </SelectContent>
            </Select>
          ) : currentCollector && (
            <div className="px-3 py-2 h-10 border rounded-md bg-muted/30 text-sm truncate">
              {currentCollector.name}
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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
