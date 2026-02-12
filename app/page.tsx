"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MonthSelector } from "@/components/ui/month-selector";
import { BillsModal } from "@/components/bills-modal";
import Link from "next/link";

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-10">
        
        {/* Month Selector Header */}
        <MonthSelector 
          currentDate={currentDate} 
          onMonthChange={setCurrentDate} 
        />
        
        {/* Top Row Grid */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7 items-start">
          
          {/* Left Card: People (Madison & Josh) */}
          <Card className="col-span-1 md:col-span-1 lg:col-span-2 shadow-sm">
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-slate-700">Madison</span>
                <span className="text-xl font-bold text-slate-900">$1,250.00</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-slate-700">Josh</span>
                <span className="text-xl font-bold text-slate-900">$3,420.50</span>
              </div>
            </CardContent>
          </Card>

          {/* Center Card: Main Financials */}
          <Card className="col-span-1 md:col-span-1 lg:col-span-3 border-slate-200 shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-6 space-y-6">
              {/* Income vs Remaining Cash */}
              <div className="flex flex-col items-center space-y-8 w-full">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Income
                  </span>
                  <div className="text-5xl font-extrabold text-emerald-600 tracking-tight">
                    $8,450.00
                  </div>
                </div>
                
                <div className="flex flex-col items-center">
                  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Remaining Cash
                  </span>
                  <div className="text-4xl font-bold text-slate-800 tracking-tight">
                    $4,210.00
                  </div>
                </div>
              </div>

              {/* Bills & Networth */}
              <div className="grid grid-cols-2 gap-8 w-full border-t pt-6 bg-slate-50/50 rounded-lg p-4">
                <BillsModal currentMonth={currentDate} />
                <Link href="/networth" className="flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Networth
                  </span>
                  <span className="text-2xl font-bold text-slate-700">$450.00</span>
                </Link>
              </div>
              
               {/* Simple Bills Status */}
              <div className="text-sm text-slate-400 font-medium">
                10/12 Bills Payed
              </div>
            </CardContent>
          </Card>

          {/* Right Card: Funds (Travel & Savings) */}
          <Card className="col-span-1 md:col-span-1 lg:col-span-2 shadow-sm">
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-slate-700">Travel</span>
                <span className="text-xl font-bold text-slate-900">$5,000.00</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-slate-700">Savings</span>
                <span className="text-xl font-bold text-slate-900">$12,500.00</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t flex justify-center z-50">
           <Link href="/transactions">
             <Button 
              variant="outline" 
              size="lg"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-semibold shadow-sm transition-all"
            >
              22 transactions not categorized yet
            </Button>
           </Link>
        </div>
        
        {/* Spacer for bottom fixed bar */}
        <div className="h-20" />
      </div>
    </div>
  );
}
