
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MembersLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[150px]" />
      </div>
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6">
          <Skeleton className="h-[120px] w-full" />
        </Card>
      ))}
    </div>
  );
}
