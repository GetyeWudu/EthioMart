"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Download, Filter } from "lucide-react";

export function ReportFilters() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        
        <div className="space-y-2 flex-1">
          <Label>Report Type</Label>
          <select className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
            <option>Platform Revenue & GMV</option>
            <option>Seller Commission Statements</option>
            <option>Customer Acquisition Metrics</option>
            <option>Product Inventory Status</option>
          </select>
        </div>

        <div className="space-y-2 flex-1">
          <Label>Start Date</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <Input type="date" className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
          </div>
        </div>

        <div className="space-y-2 flex-1">
          <Label>End Date</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <Input type="date" className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none gap-2 border-slate-200 dark:border-slate-700">
            <Filter className="h-4 w-4" />
            Apply
          </Button>
          <Button className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

      </div>
    </div>
  );
}
