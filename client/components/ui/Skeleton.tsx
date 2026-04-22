import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-surface ", className)}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-border-light">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-10 w-16" />
        </div>
        <Skeleton className="h-14 w-14 rounded-xl" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
      <div className="p-6 border-b border-border-light">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="divide-y divide-border-light">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-6 flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-6 w-96" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <TableSkeleton rows={5} />
    </div>
  );
}
