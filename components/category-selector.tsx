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
}

export function CategorySelector({ value, onSelect, bills, incomeMonth }: CategorySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [showIncomeMonthPicker, setShowIncomeMonthPicker] = React.useState(false);
  const [selectedMonth, setSelectedMonth] = React.useState<Date>(new Date());

  const incomeOptions = [{ value: "income", label: "Income" }];
  
  const billOptions = bills.map((bill) => ({
    value: bill.id,
    label: bill.name,
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

  // Generate next 12 months for picker
  const nextMonths = Array.from({ length: 12 }, (_, i) => addMonths(startOfMonth(new Date()), i));

  const allOptions = [...incomeOptions, ...billOptions, ...otherOptions];
  const selectedLabel = allOptions.find((c) => c.value === value)?.label;

  const renderGroup = (heading: string, options: { value: string; label: string }[]) => (
    <CommandGroup heading={heading} className="py-1">
      {options.map((category) => (
        <CommandItem
          key={category.value}
          value={category.value}
          className="py-1.5"
          onSelect={(currentValue) => {
             const matched = allOptions.find(c => c.value.toLowerCase() === currentValue.toLowerCase() || c.label.toLowerCase() === currentValue.toLowerCase());
             handleSelect(matched ? matched.value : currentValue);
          }}
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
            <CommandList>
              <CommandEmpty>No category found.</CommandEmpty>
              {renderGroup("Income", incomeOptions)}
              {renderGroup("Bills", billOptions)}
              {renderGroup("Other", otherOptions)}
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
