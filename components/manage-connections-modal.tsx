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
import { SimpleFinConnection, AvailableSimpleFinConnection } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

interface ManageConnectionsModalProps {
  activeConnections: SimpleFinConnection[];
  availableConnections: AvailableSimpleFinConnection[];
}

export function ManageConnectionsModal({
  activeConnections: initialActiveConnections,
  availableConnections: initialAvailableConnections,
}: ManageConnectionsModalProps) {
  const router = useRouter();
  const [activeConnections, setActiveConnections] = useState(initialActiveConnections);
  const [availableConnections, setAvailableConnections] = useState(initialAvailableConnections);
  const [addingConnectionId, setAddingConnectionId] = useState<string | null>(null);

  const handleAddConnection = async (connection: AvailableSimpleFinConnection, isOnBudget: boolean) => {
    // Optimistic update
    const newConnection: SimpleFinConnection = {
      id: connection.id,
      name: connection.name,
      currentBalance: 0,
      isOnBudget,
      accountType: connection.accountType,
    };

    setActiveConnections([...activeConnections, newConnection]);
    setAvailableConnections(availableConnections.filter((c) => c.id !== connection.id));
    setAddingConnectionId(null);

    await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: connection.id,
        name: connection.name,
        accountType: connection.accountType,
        isOnBudget,
      }),
    });

    router.refresh();
  };

  const handleDisconnect = async (connectionId: string) => {
    const connection = activeConnections.find((c) => c.id === connectionId);
    if (!connection) return;

    // Optimistic update
    const availableConnection: AvailableSimpleFinConnection = {
      id: connection.id,
      name: connection.name,
      accountType: connection.accountType,
    };

    setAvailableConnections([...availableConnections, availableConnection]);
    setActiveConnections(activeConnections.filter((c) => c.id !== connectionId));

    await fetch(`/api/connections/${connectionId}`, { method: "DELETE" });

    router.refresh();
  };

  const handleToggleBudget = async (connectionId: string) => {
    const connection = activeConnections.find((c) => c.id === connectionId);
    if (!connection) return;

    // Optimistic update
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage SimpleFin Connections</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Available Connections */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Available Connections</h3>
            {availableConnections.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No available connections
              </p>
            ) : (
              <div className="space-y-2">
                {availableConnections.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-sm">{connection.name}</p>
                        {connection.accountType && (
                          <Badge variant="outline" className="text-xs capitalize mt-1">
                            {connection.accountType}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {addingConnectionId === connection.id ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddConnection(connection, true)}
                        >
                          On Budget
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddConnection(connection, false)}
                        >
                          Off Budget
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAddingConnectionId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setAddingConnectionId(connection.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Active Connections */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Active Connections</h3>
            {activeConnections.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No active connections
              </p>
            ) : (
              <div className="space-y-2">
                {activeConnections.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-sm">{connection.name}</p>
                        <div className="flex items-center gap-2 mt-1">
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
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-700">
                        ${connection.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDisconnect(connection.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
