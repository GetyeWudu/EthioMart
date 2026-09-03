"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SellerForm() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Store Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input id="storeName" placeholder="e.g. GechExpress Main Store" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerFirstName">Owner First Name</Label>
              <Input id="ownerFirstName" placeholder="John" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerLastName">Owner Last Name</Label>
              <Input id="ownerLastName" placeholder="Doe" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="storeDescription">Store Description</Label>
              <textarea 
                id="storeDescription" 
                rows={4}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                placeholder="Describe the seller's business..."
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Contact & Business Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Business Email</Label>
              <Input id="email" type="email" placeholder="store@example.com" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="businessAddress">Business Address</Label>
              <Input id="businessAddress" placeholder="123 Main St" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Commission & Fees</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="commissionRate">Platform Commission Rate (%)</Label>
              <Input id="commissionRate" type="number" defaultValue="15" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
              <p className="text-xs text-slate-500">The percentage GechExpress takes per sale from this seller.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Account Status</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input type="radio" id="status-active" name="status" className="text-indigo-600" />
              <Label htmlFor="status-active">Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="radio" id="status-pending" name="status" defaultChecked className="text-indigo-600" />
              <Label htmlFor="status-pending">Pending Approval</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="radio" id="status-suspended" name="status" className="text-indigo-600" />
              <Label htmlFor="status-suspended" className="text-rose-600">Suspended</Label>
            </div>
          </div>
          
          <div className="mt-8 flex flex-col gap-3">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Save Seller Account</Button>
            <Button variant="outline" className="w-full border-slate-200 dark:border-slate-700">Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
