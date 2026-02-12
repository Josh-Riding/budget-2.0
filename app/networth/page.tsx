import { getSimpleFinConnections, getAvailableSimpleFinConnections } from "@/lib/mock-data";
import { ConnectionCard } from "@/components/connection-card";
import { ManageConnectionsModal } from "@/components/manage-connections-modal";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NetWorthPage() {
  const connections = await getSimpleFinConnections();
  const availableConnections = await getAvailableSimpleFinConnections();
  
  const onBudgetConnections = connections.filter((c) => c.isOnBudget);
  const offBudgetConnections = connections.filter((c) => !c.isOnBudget);
  
  const totalNetWorth = connections.reduce((sum, c) => sum + c.currentBalance, 0);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Net Worth</h1>
              <p className="text-lg text-slate-600 mt-1">
                ${totalNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <ManageConnectionsModal 
            activeConnections={connections}
            availableConnections={availableConnections}
          />
        </div>

        {/* On Budget Section */}
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">On Budget</h2>
          {onBudgetConnections.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 border rounded-lg bg-white">
              No on-budget connections
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {onBudgetConnections.map((connection) => (
                <Link key={connection.id} href={`/networth/${connection.id}`}>
                  <ConnectionCard connection={connection} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <Separator className="my-8" />

        {/* Off Budget Section */}
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Off Budget</h2>
          {offBudgetConnections.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 border rounded-lg bg-white">
              No off-budget connections
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {offBudgetConnections.map((connection) => (
                <Link key={connection.id} href={`/networth/${connection.id}`}>
                  <ConnectionCard connection={connection} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
