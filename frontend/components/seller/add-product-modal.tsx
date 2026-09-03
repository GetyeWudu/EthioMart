"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState } from "react";
import { useSellerStore } from "@/stores/seller-store";

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProductModal({ open, onOpenChange }: AddProductModalProps) {
  const addProduct = useSellerStore((state) => state.addProduct);
  const [form, setForm] = useState({
    name: "",
    category: "electronics",
    brand: "",
    price: "",
    stock: "",
    sku: "",
    image: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (value: string | null) => {
    if (value) setForm({ ...form, category: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!form.name || !form.brand || !form.price || !form.stock || !form.sku) return;
    addProduct({
      name: form.name,
      category: form.category,
      brand: form.brand,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
      sales: 0,
      rating: 0,
      status: "Active",
      image: form.image,
      sku: form.sku,
    });
    // Reset form and close modal
    setForm({ name: "", category: "electronics", brand: "", price: "", stock: "", sku: "", image: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 backdrop-blur-xl rounded-xl">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>Enter product details to add it to your catalog.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="name" placeholder="Product Name" value={form.name} onChange={handleChange} required />
          <Select value={form.category} onValueChange={handleSelectChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="fashion">Fashion</SelectItem>
              <SelectItem value="home-kitchen">Home & Kitchen</SelectItem>
            </SelectContent>
          </Select>
          <Input name="brand" placeholder="Brand" value={form.brand} onChange={handleChange} required />
          <Input name="price" placeholder="Price" type="number" step="0.01" value={form.price} onChange={handleChange} required />
          <Input name="stock" placeholder="Stock Quantity" type="number" value={form.stock} onChange={handleChange} required />
          <Input name="sku" placeholder="SKU" value={form.sku} onChange={handleChange} required />
          <Input name="image" placeholder="Image URL (optional)" value={form.image} onChange={handleChange} />
          <DialogFooter className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              Add Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
