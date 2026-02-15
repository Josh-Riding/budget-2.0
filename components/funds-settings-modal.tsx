"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";

interface FundSetting {
  fundId: string;
  displayName: string;
  position: "left" | "right";
  currentBalance: number;
  overrideAmount?: number;
}

interface FundsSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FundsSettingsModal({
  open,
  onOpenChange,
}: FundsSettingsModalProps) {
  const router = useRouter();
  const [funds, setFunds] = useState<FundSetting[]>([]);
  const [newFundName, setNewFundName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editPosition, setEditPosition] = useState<"left" | "right">("right");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Load funds on modal open
  useEffect(() => {
    if (!open) return;

    const loadFunds = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/funds");
        if (response.ok) {
          const data = await response.json();
          setFunds(
            data.map((f: { id: string; displayName: string; position: "left" | "right"; currentBalance: number; overrideAmount?: number }) => ({
              fundId: f.id,
              displayName: f.displayName,
              position: f.position,
              currentBalance: f.currentBalance,
              overrideAmount: f.overrideAmount,
            }))
          );
        }
      } catch (error) {
        console.error("Error loading funds:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFunds();
  }, [open]);

  const handleStartEdit = (fund: FundSetting) => {
    setEditingId(fund.fundId);
    setEditDisplayName(fund.displayName);
    setEditAmount(String(fund.overrideAmount ?? fund.currentBalance ?? 0));
    setEditPosition(fund.position);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditDisplayName("");
    setEditAmount("");
    setEditPosition("right");
  };

  const handleUpdateFund = async (fundId: string) => {
    const amount = parseFloat(editAmount);
    const payload = {
      displayName: editDisplayName.trim(),
      position: editPosition,
      isVisible: true,
      overrideAmount: Number.isNaN(amount) ? 0 : amount,
    };

    if (!payload.displayName) return;

    const response = await fetch(`/api/fund-settings/${fundId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setError("Failed to update fund settings");
      return;
    }

    setFunds((prev) =>
      prev.map((f) =>
        f.fundId === fundId
          ? {
              ...f,
              displayName: payload.displayName,
              position: payload.position,
              overrideAmount: payload.overrideAmount,
            }
          : f
      )
    );
    handleCancelEdit();
    router.refresh();
  };

  const handleAddFund = async () => {
    if (!newFundName.trim()) return;

    try {
      const response = await fetch("/api/funds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFundName }),
      });

      if (response.ok) {
        const newFund = await response.json();
        setFunds((prev) => [
          ...prev,
          {
            fundId: newFund.id,
            displayName: newFund.name,
            position: "right",
            currentBalance: 0,
            overrideAmount: 0,
          },
        ]);
        setNewFundName("");
        router.refresh();
      }
    } catch (error) {
      console.error("Error adding fund:", error);
    }
  };

  const handleDeleteFund = async (fundId: string) => {
    if (
      !confirm("Are you sure you want to delete this fund?")
    )
      return;

    try {
      const response = await fetch("/api/funds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fundId }),
      });

      if (response.ok) {
        setFunds((prev) => prev.filter((f) => f.fundId !== fundId));
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting fund:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Funds</DialogTitle>
          <DialogDescription>
            Edit fund names, amounts, and positions on the dashboard
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading funds...</p>
        ) : (
          <div className="space-y-6">
            {/* Funds Table */}
            <div className="rounded-md border max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Position</TableHead>
                    <TableHead className="w-[80px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funds.map((fund) => (
                    <TableRow key={fund.fundId}>
                      <TableCell>
                        {editingId === fund.fundId ? (
                          <Input
                            value={editDisplayName}
                            onChange={(e) => setEditDisplayName(e.target.value)}
                            className="h-8"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium">{fund.displayName}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === fund.fundId ? (
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-sm">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="h-8 w-24 text-right"
                            />
                          </div>
                        ) : (
                          <span>${(fund.overrideAmount ?? fund.currentBalance ?? 0).toFixed(2)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === fund.fundId ? (
                          <div className="flex justify-end">
                            <Select
                              value={editPosition}
                              onValueChange={(value) =>
                                setEditPosition(value as "left" | "right")
                              }
                            >
                              <SelectTrigger className="h-8 w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <span className="capitalize text-muted-foreground">{fund.position}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === fund.fundId ? (
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdateFund(fund.fundId)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4 text-gray-400" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleStartEdit(fund)}
                            >
                              <Edit2 className="h-4 w-4 text-gray-400" />
                            </Button>
                            {!["fund-josh", "fund-madison", "fund-house", "fund-travel"].includes(
                              fund.fundId
                            ) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteFund(fund.fundId)}
                                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Add New Fund */}
            <div className="grid gap-4 py-4 border-t">
              <div className="grid grid-cols-4 items-end gap-4">
                <div className="grid gap-2 col-span-3">
                  <Label htmlFor="new-fund-name">New Fund Name</Label>
                  <Input
                    id="new-fund-name"
                    placeholder="e.g. Car, Wedding"
                    value={newFundName}
                    onChange={(e) => setNewFundName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddFund();
                    }}
                  />
                </div>
                <Button
                  onClick={handleAddFund}
                  disabled={!newFundName.trim()}
                  className="col-span-1 rounded-full"
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
