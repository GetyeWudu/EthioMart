"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddressFormProps {
  onSave?: (address: any) => void;
  onCancel?: () => void;
  initialData?: any;
}

export function AddressForm({ onSave, onCancel, initialData }: AddressFormProps) {
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || "",
    streetAddress: initialData?.streetAddress || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    zipCode: initialData?.zipCode || "",
    country: initialData?.country || "",
    phone: initialData?.phone || "",
    isDefault: initialData?.isDefault || false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input 
            id="fullName" 
            name="fullName" 
            value={formData.fullName} 
            onChange={handleChange} 
            placeholder="John Doe" 
            required 
            className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>
        
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="streetAddress">Street Address</Label>
          <Input 
            id="streetAddress" 
            name="streetAddress" 
            value={formData.streetAddress} 
            onChange={handleChange} 
            placeholder="123 Main St, Apt 4B" 
            required 
            className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input 
            id="city" 
            name="city" 
            value={formData.city} 
            onChange={handleChange} 
            placeholder="New York" 
            required 
            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="state">State / Province</Label>
          <Input 
            id="state" 
            name="state" 
            value={formData.state} 
            onChange={handleChange} 
            placeholder="NY" 
            required 
            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="zipCode">Zip / Postal Code</Label>
          <Input 
            id="zipCode" 
            name="zipCode" 
            value={formData.zipCode} 
            onChange={handleChange} 
            placeholder="10001" 
            required 
            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input 
            id="country" 
            name="country" 
            value={formData.country} 
            onChange={handleChange} 
            placeholder="United States" 
            required 
            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>
        
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input 
            id="phone" 
            name="phone" 
            type="tel"
            value={formData.phone} 
            onChange={handleChange} 
            placeholder="+1 (555) 000-0000" 
            className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>
        
        <div className="flex items-center space-x-2 sm:col-span-2 mt-2">
          <input 
            type="checkbox" 
            id="isDefault" 
            name="isDefault" 
            checked={formData.isDefault} 
            onChange={handleChange} 
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:checked:bg-indigo-500"
          />
          <Label htmlFor="isDefault" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Set as default shipping address
          </Label>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button type="submit" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
          Save Address
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto border-slate-200 dark:border-slate-800">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
