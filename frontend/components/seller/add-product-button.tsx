"use client";

import { Button } from "@/components/ui/button";
import { AddProductModal } from "@/components/seller/add-product-modal";
import { Plus } from "lucide-react";
import { useState } from "react";

export function AddProductButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="default" size="sm" onClick={() => setOpen(true)} className="h-9 px-3 bg-indigo-600 hover:bg-indigo-700 text-white">
        <Plus className="h-4 w-4 mr-1" /> Add Product
      </Button>
      <AddProductModal open={open} onOpenChange={setOpen} />
    </>
  );
}
