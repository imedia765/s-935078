
import { Button } from "@/components/ui/button";

interface MembersPaginationProps {
  page: number;
  itemsPerPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function MembersPagination({
  page,
  itemsPerPage,
  totalCount,
  onPageChange,
}: MembersPaginationProps) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, totalCount)} of {totalCount} members
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span className="text-sm">
          Page {page} of {Math.ceil(totalCount / itemsPerPage)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(Math.ceil(totalCount / itemsPerPage), page + 1))}
          disabled={page === Math.ceil(totalCount / itemsPerPage)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
