import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Truck, FileText } from "lucide-react";
import Image from "next/image";

interface OrderItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  image: string;
}

interface OrderDetailsProps {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

export function OrderDetails({
  orderId = "ORD-902102",
  customerName = "John Doe",
  customerEmail = "john.doe@example.com",
  customerPhone = "+1 (555) 123-4567",
  date = "Oct 24, 2026 at 2:30 PM",
  status = "Processing",
  items = [
    {
      id: "P1",
      name: "Premium Wireless Headphones",
      sku: "SKU-9012",
      quantity: 1,
      price: 299.99,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop"
    }
  ],
  subtotal = 299.99,
  tax = 24.00,
  shipping = 0,
  total = 323.99
}: Partial<OrderDetailsProps>) {
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Items & Customer Details */}
      <div className="lg:col-span-2 space-y-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Order Items</h2>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>
          
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {items.map((item) => (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shrink-0">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 dark:text-white line-clamp-1">{item.name}</h4>
                  <p className="text-sm text-slate-500 font-mono mt-1">{item.sku}</p>
                </div>
                <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0">
                  <span className="text-sm text-slate-500 sm:mb-1">Qty: {item.quantity}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Customer Contact Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-slate-500 mb-1">Name</p>
              <p className="font-medium text-slate-900 dark:text-white">{customerName}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Email</p>
              <p className="font-medium text-slate-900 dark:text-white">{customerEmail}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Phone</p>
              <p className="font-medium text-slate-900 dark:text-white">{customerPhone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Actions & Summary */}
      <div className="space-y-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="text-slate-900 dark:text-white font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Shipping</span>
              <span className="text-slate-900 dark:text-white font-medium">{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tax</span>
              <span className="text-slate-900 dark:text-white font-medium">${tax.toFixed(2)}</span>
            </div>
            <Separator className="my-4 dark:bg-slate-800" />
            <div className="flex justify-between font-bold text-xl text-slate-900 dark:text-white">
              <span>Total Paid</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Fulfillment Actions</h2>
          <div className="space-y-3">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Truck className="h-4 w-4" />
              Mark as Shipped
            </Button>
            <Button variant="outline" className="w-full gap-2 border-slate-200 dark:border-slate-700">
              <FileText className="h-4 w-4" />
              Print Packing Slip
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
