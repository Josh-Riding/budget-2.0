"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bill } from "@/lib/types";
import { format, addMonths, startOfMonth } from "date-fns";

interface CategorySelectorProps {
  value?: string;
  onSelect: (value: string, incomeMonth?: string) => void;
  bills: Bill[];
  incomeMonth?: string;
  funds?: { id: string; name: string }[];
  isDeposit?: boolean;
  allocationStartDate?: Date | string;
}

export function CategorySelector({
  value,
  onSelect,
  bills,
  incomeMonth,
  funds,
  isDeposit,
  allocationStartDate,
}: CategorySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [showIncomeMonthPicker, setShowIncomeMonthPicker] = React.useState(false);
  const [selectedMonth, setSelectedMonth] = React.useState<Date>(new Date());

  const incomeOptions = [{ value: "income", label: "Income" }];

  const billOptions = bills.map((bill) => ({
    value: bill.id,
    label: bill.name,
  }));

  const fundOptions = (funds || []).map((fund) => ({
    value: `fund:${fund.id}`,
    label: `${fund.name} Spending`,
  }));

  const otherOptions = [
    { value: "everything_else", label: "Everything Else" },
    { value: "ignore", label: "Ignore" },
  ];

  const handleSelect = (currentValue: string) => {
    if (currentValue === "income") {
      setShowIncomeMonthPicker(true);
      setOpen(false);
    } else {
      onSelect(currentValue);
      setOpen(false);
    }
  };

  const confirmIncomeMonth = () => {
    const monthStr = format(selectedMonth, "MM/yyyy");
    onSelect("income", monthStr);
    setShowIncomeMonthPicker(false);
  };

  const parsedAllocationStartDate = React.useMemo(() => {
    if (!allocationStartDate) return startOfMonth(new Date());
    const date =
      allocationStartDate instanceof Date
        ? allocationStartDate
        : new Date(allocationStartDate);
    return Number.isNaN(date.getTime()) ? startOfMonth(new Date()) : startOfMonth(date);
  }, [allocationStartDate]);

  // Generate next 12 months for picker from the transaction month
  const nextMonths = Array.from({ length: 12 }, (_, i) =>
    addMonths(parsedAllocationStartDate, i)
  );

  const allOptions = [...incomeOptions, ...billOptions, ...fundOptions, ...otherOptions];
  const selectedLabel = allOptions.find((c) => c.value === value)?.label;

  const renderGroup = (heading: string, options: { value: string; label: string }[]) => {
    if (options.length === 0) return null;
    return (
      <CommandGroup heading={heading} className="py-1">
        {options.map((category) => (
          <CommandItem
            key={category.value}
            value={category.label}
            className="py-1.5"
            onSelect={() => handleSelect(category.value)}
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                value === category.value ? "opacity-100" : "opacity-0"
              )}
            />
            {category.label}
          </CommandItem>
        ))}
      </CommandGroup>
    );
  };


  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            <span className="truncate">
              {value === "income" && incomeMonth
                ? `Income (${incomeMonth})`
                : value
                ? selectedLabel
                : "Select category..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search category..." className="h-8" />
            <CommandList className="max-h-[40vh] overflow-y-auto">
              <CommandEmpty>No category found.</CommandEmpty>
              {renderGroup("Other", otherOptions)}
              {isDeposit !== false && renderGroup("Income", incomeOptions)}
              {renderGroup("Bills", billOptions)}
              {renderGroup("Fund Spending", fundOptions)}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showIncomeMonthPicker} onOpenChange={setShowIncomeMonthPicker}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Allocate Income</DialogTitle>
            <DialogDescription>
              Select the month this income should be allocated to.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-3 gap-2">
                {nextMonths.map((date) => (
                    <Button
                        key={date.toString()}
                        variant={selectedMonth.getMonth() === date.getMonth() && selectedMonth.getFullYear() === date.getFullYear() ? "default" : "outline"}
                        onClick={() => setSelectedMonth(date)}
                        className="text-sm"
                    >
                        {format(date, "MMM yyyy")}
                    </Button>
                ))}
             </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmIncomeMonth}>Confirm Allocation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
