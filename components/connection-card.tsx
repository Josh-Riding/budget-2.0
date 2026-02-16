import { SimpleFinConnection } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ConnectionCardProps {
  connection: SimpleFinConnection;
}

export function ConnectionCard({ connection }: ConnectionCardProps) {
  const isNegative = connection.currentBalance < 0;

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
          <h3 className="font-semibold text-base sm:text-lg text-slate-800 truncate">{connection.displayName || connection.name}</h3>
          {connection.accountType && (
            <Badge variant="outline" className="text-xs capitalize shrink-0">
              {connection.accountType}
            </Badge>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl sm:text-3xl font-bold ${isNegative ? 'text-red-600' : 'text-slate-900'}`}>
            ${Math.abs(connection.currentBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {isNegative && <span className="text-sm text-red-600 font-medium">CR</span>}
        </div>
      </CardContent>
    </Card>
  );
}
