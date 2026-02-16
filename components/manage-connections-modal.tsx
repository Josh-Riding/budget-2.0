"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleFinConnection } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Pencil, RefreshCw, Unplug } from "lucide-react";

interface ManageConnectionsModalProps {
  activeConnections: SimpleFinConnection[];
  isSimpleFinConnected: boolean;
}

export function ManageConnectionsModal({
  activeConnections: initialActiveConnections,
  isSimpleFinConnected: initialConnected,
}: ManageConnectionsModalProps) {
  const router = useRouter();
  const [activeConnections, setActiveConnections] = useState(initialActiveConnections);
  const [isConnected, setIsConnected] = useState(initialConnected);
  const [setupToken, setSetupToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!setupToken.trim()) return;
    setConnecting(true);
    setError(null);

    const response = await fetch("/api/simplefin/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setupToken: setupToken.trim() }),
    });

    if (response.ok) {
      setIsConnected(true);
      setSetupToken("");
      // Auto-sync after connecting
      await handleSync();
    } else {
      const data = await response.json();
      setError(data.error || "Failed to connect");
    }
    setConnecting(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setError(null);

    const response = await fetch("/api/simplefin/sync", { method: "POST" });

    if (response.ok) {
      const data = await response.json();
      setSyncResult(`Synced ${data.accounts} accounts, ${data.transactions} new transactions`);
      // Refresh connections list
      const connectionsRes = await fetch("/api/connections");
      if (connectionsRes.ok) {
        const updated = await connectionsRes.json();
        setActiveConnections(updated);
      }
      router.refresh();
    } else {
      const data = await response.json();
      setError(data.error || "Sync failed");
    }
    setSyncing(false);
  };

  const handleDisconnectSimpleFin = async () => {
    await fetch("/api/simplefin/disconnect", { method: "POST" });
    setIsConnected(false);
    setSyncResult(null);
    router.refresh();
  };

  const handleDisconnectAccount = async (connectionId: string) => {
    setActiveConnections(activeConnections.filter((c) => c.id !== connectionId));
    await fetch(`/api/connections/${connectionId}`, { method: "DELETE" });
    router.refresh();
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleStartEdit = (connection: SimpleFinConnection) => {
    setEditingId(connection.id);
    setEditValue(connection.displayName || connection.name);
  };

  const handleSaveName = async (connectionId: string) => {
    const trimmed = editValue.trim();
    const connection = activeConnections.find((c) => c.id === connectionId);
    if (!connection) return;

    // If the user cleared it or set it back to the original name, store null
    const displayName = trimmed === "" || trimmed === connection.name ? "" : trimmed;

    setActiveConnections(
      activeConnections.map((c) =>
        c.id === connectionId ? { ...c, displayName: displayName || undefined } : c
      )
    );
    setEditingId(null);

    await fetch(`/api/connections/${connectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    });

    router.refresh();
  };

  const handleToggleBudget = async (connectionId: string) => {
    const connection = activeConnections.find((c) => c.id === connectionId);
    if (!connection) return;

    setActiveConnections(
      activeConnections.map((c) =>
        c.id === connectionId ? { ...c, isOnBudget: !c.isOnBudget } : c
      )
    );

    await fetch(`/api/connections/${connectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOnBudget: !connection.isOnBudget }),
    });

    router.refresh();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Manage Connections
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage SimpleFin Connections</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* SimpleFin Setup */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">SimpleFin Bridge</h3>
            {isConnected ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg bg-green-50/50">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">Connected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSync}
                      disabled={syncing}
                      className="flex-1 sm:flex-initial"
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
                      {syncing ? "Syncing..." : "Sync Now"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDisconnectSimpleFin}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-initial"
                    >
                      <Unplug className="h-4 w-4 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                </div>
                {syncResult && (
                  <p className="text-sm text-green-600">{syncResult}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Paste your SimpleFin setup token to connect your bank accounts.
                </p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="setup-token" className="sr-only">Setup Token</Label>
                    <Input
                      id="setup-token"
                      placeholder="Paste setup token..."
                      value={setupToken}
                      onChange={(e) => setSetupToken(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleConnect} disabled={connecting || !setupToken.trim()}>
                    {connecting ? "Connecting..." : "Connect"}
                  </Button>
                </div>
              </div>
            )}
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>

          <Separator />

          {/* Active Connections */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Accounts</h3>
            {activeConnections.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No accounts. {!isConnected && "Connect SimpleFin above to sync your bank accounts."}
              </p>
            ) : (
              <div className="space-y-2">
                {activeConnections.map((connection) => (
                  <div
                    key={connection.id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    {/* Row 1: Name + Balance */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {editingId === connection.id ? (
                          <Input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSaveName(connection.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveName(connection.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="h-7 text-sm font-medium w-full sm:w-48"
                          />
                        ) : (
                          <button
                            onClick={() => handleStartEdit(connection)}
                            className="flex items-center gap-1.5 group text-left min-w-0"
                          >
                            <p className="font-medium text-sm truncate">{connection.displayName || connection.name}</p>
                            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </button>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-slate-700 shrink-0">
                        ${connection.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Row 2: Badges + Disconnect */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {connection.accountType && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {connection.accountType}
                          </Badge>
                        )}
                        <Badge
                          variant={connection.isOnBudget ? "default" : "secondary"}
                          className="text-xs cursor-pointer"
                          onClick={() => handleToggleBudget(connection.id)}
                        >
                          {connection.isOnBudget ? "On Budget" : "Off Budget"}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDisconnectAccount(connection.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 text-xs shrink-0"
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
