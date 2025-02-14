
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MembersLoading() {
  return (
    <div className="space-y-4">
      {/* Toolbar loading state */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-10 w-full sm:w-[200px]" />
            <Skeleton className="h-10 w-full sm:w-[100px]" />
          </div>
        </div>
      </div>

      {/* Member cards loading state */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 glass-card">
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
