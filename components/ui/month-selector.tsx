"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MonthSelectorProps {
  currentDate: Date;
  onMonthChange: (date: Date) => void;
}

export function MonthSelector({ currentDate, onMonthChange }: MonthSelectorProps) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const today = new Date();
  const isCurrentMonth = 
    today.getMonth() === currentDate.getMonth() && 
    today.getFullYear() === currentDate.getFullYear();

  const handleMonthChange = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    onMonthChange(newDate);
  };

  const handleReset = () => {
    onMonthChange(new Date());
  };

  const getMonthName = (offset: number) => {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() + offset);
    return months[date.getMonth()];
  };

  return (
    <div className="relative flex items-center justify-center py-8 w-full">
      {/* Background Gradient for fade effect */}
      <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-gray-50/50 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-gray-50/50 to-transparent z-10 pointer-events-none" />

      <div className="flex items-center gap-4 md:gap-12">
        {/* Far Left */}
        <button 
          onClick={() => handleMonthChange(-2)}
          className="hidden md:flex w-32 justify-center text-2xl font-bold text-slate-400/20 transition-all hover:text-slate-400/40 scale-90"
        >
          {getMonthName(-2)}
        </button>

        {/* Immediate Left */}
        <button 
          onClick={() => handleMonthChange(-1)}
          className="flex w-16 md:w-32 justify-center text-2xl md:text-3xl font-bold text-slate-400/50 transition-all hover:text-slate-600/80 scale-95"
        >
          {getMonthName(-1)}
        </button>

        {/* Center (Current) */}
        <div className="relative z-20 flex flex-col items-center w-48 md:w-64">
           <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight transition-all scale-100">
            {months[currentDate.getMonth()]}
          </span>
          <span className="text-sm font-medium text-slate-500 mt-1">
            {currentDate.getFullYear()}
          </span>
          
          {/* Back to Current Month Button */}
          {!isCurrentMonth && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleReset}
              className="absolute -bottom-12 z-50 animate-in fade-in zoom-in duration-300 text-xs text-muted-foreground hover:text-primary gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              Back to Current Month
            </Button>
          )}
        </div>

        {/* Immediate Right */}
        <button 
          onClick={() => handleMonthChange(1)}
          className="flex w-16 md:w-32 justify-center text-2xl md:text-3xl font-bold text-slate-400/50 transition-all hover:text-slate-600/80 scale-95"
        >
          {getMonthName(1)}
        </button>

        {/* Far Right */}
        <button 
          onClick={() => handleMonthChange(2)}
          className="hidden md:flex w-32 justify-center text-2xl font-bold text-slate-400/20 transition-all hover:text-slate-400/40 scale-90"
        >
          {getMonthName(2)}
        </button>
      </div>
    </div>
  );
}
