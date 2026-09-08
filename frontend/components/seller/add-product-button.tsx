"use client";

import { Button } from "@/components/ui/button";
import { AddProductModal } from "@/components/seller/add-product-modal";
import { Plus } from "lucide-react";
import { useState } from "react";

export function AddProductButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="default" size="sm" onClick={() => setOpen(true)} className="h-9 px-3.5 bg-gradient-to-r from-[#FF7900] to-[#E66800] hover:from-[#E66800] hover:to-[#D55F00] text-white font-bold shadow-md shadow-[#FF7900]/20 rounded-xl">
        <Plus className="h-4 w-4 mr-1" /> Add Product
      </Button>
      <AddProductModal open={open} onOpenChange={setOpen} />
    </>
  );
}
