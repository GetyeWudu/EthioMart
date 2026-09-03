"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  UploadCloud,
  X,
  Package,
  Truck,
  Layers,
  ShieldAlert,
  Download,
  Info,
  Mail,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const productSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  categoryId: z.string().min(1, "Please select a category."),
  suggestedCategory: z.string().optional(),
  brandId: z.string().optional(),
  newBrandName: z.string().optional(),
  price: z.coerce.number().positive("Price must be a positive number."),
  salePrice: z.coerce.number().min(0, "Sale price cannot be negative.").optional(),
  sku: z.string().min(3, "SKU must be at least 3 characters."),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative."),
  status: z.enum(["ACTIVE", "DRAFT"]),
  shipping_class: z.enum(["STANDARD", "HEAVY", "BULKY", "FRAGILE", "DIGITAL"]).default("STANDARD"),
  weight_kg: z.coerce.number().min(0, "Weight cannot be negative.").default(0.5),
  length_cm: z.coerce.number().min(0, "Length cannot be negative.").default(15.0),
  width_cm: z.coerce.number().min(0, "Width cannot be negative.").default(10.0),
  height_cm: z.coerce.number().min(0, "Height cannot be negative.").default(5.0),
}).refine((data) => {
  if (data.salePrice && data.salePrice >= data.price) {
    return false;
  }
  return true;
}, {
  message: "Sale price must be lower than regular price.",
  path: ["salePrice"],
});

type ProductFormValues = z.infer<typeof productSchema>;

const PACKAGE_PRESETS = [
  {
    id: "small_pouch",
    name: "Small Pouch",
    subtitle: "0.5 kg | 15×10×5 cm",
    examples: "Phones, Jewelry, Cosmetics, Small Accessories",
    icon: Mail,
    weight_kg: 0.5,
    length_cm: 15.0,
    width_cm: 10.0,
    height_cm: 5.0,
    shipping_class: "STANDARD" as const,
    badge: "Smartphones & Jewelry",
  },
  {
    id: "standard_box",
    name: "Shoe / Standard Box",
    subtitle: "1.5 kg | 30×20×15 cm",
    examples: "Shoes, Clothes, Tablets, Books",
    icon: Package,
    weight_kg: 1.5,
    length_cm: 30.0,
    width_cm: 20.0,
    height_cm: 15.0,
    shipping_class: "STANDARD" as const,
    badge: "Apparel & Shoes",
  },
  {
    id: "medium_parcel",
    name: "Medium Box / Appliance",
    subtitle: "5.0 kg | 40×30×25 cm",
    examples: "Blenders, Kettles, Laptops, Kitchenware",
    icon: Truck,
    weight_kg: 5.0,
    length_cm: 40.0,
    width_cm: 30.0,
    height_cm: 25.0,
    shipping_class: "HEAVY" as const,
    badge: "Appliances & Tools",
  },
  {
    id: "bulky_freight",
    name: "Heavy / Bulky Freight",
    subtitle: "40.0 kg | 120×80×80 cm",
    examples: "Sofas, Refrigerators, Beds, TVs",
    icon: Layers,
    weight_kg: 40.0,
    length_cm: 120.0,
    width_cm: 80.0,
    height_cm: 80.0,
    shipping_class: "BULKY" as const,
    badge: "Furniture & Large Items",
  },
  {
    id: "fragile_parcel",
    name: "Fragile Box",
    subtitle: "2.0 kg | 25×20×20 cm",
    examples: "Glassware, Ceramics, Perfumes (Special Care)",
    icon: ShieldAlert,
    weight_kg: 2.0,
    length_cm: 25.0,
    width_cm: 20.0,
    height_cm: 20.0,
    shipping_class: "FRAGILE" as const,
    badge: "Special Handling",
  },
  {
    id: "digital_product",
    name: "Digital / Virtual",
    subtitle: "0 kg (No physical parcel)",
    examples: "E-books, Software licenses, Gift Cards",
    icon: Download,
    weight_kg: 0.0,
    length_cm: 0.0,
    width_cm: 0.0,
    height_cm: 0.0,
    shipping_class: "DIGITAL" as const,
    badge: "No Shipping",
  },
];

const SHIPPING_CLASSES = [
  {
    id: "STANDARD",
    label: "Standard",
    desc: "Clothes, electronics, books (< 5kg)",
    icon: Package,
  },
  {
    id: "HEAVY",
    label: "Heavy",
    desc: "Appliances, heavy gear (5kg - 20kg)",
    icon: Truck,
  },
  {
    id: "BULKY",
    label: "Bulky",
    desc: "Large furniture, sofas, big TVs (> 20kg)",
    icon: Layers,
  },
  {
    id: "FRAGILE",
    label: "Fragile",
    desc: "Glassware, ceramics, delicate items",
    icon: ShieldAlert,
  },
  {
    id: "DIGITAL",
    label: "Digital",
    desc: "No physical shipping required",
    icon: Download,
  },
] as const;

export function ProductForm() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      sku: "",
      status: "ACTIVE",
      categoryId: "",
      suggestedCategory: "",
      brandId: "",
      newBrandName: "",
      price: 0,
      stock: 0,
      salePrice: 0,
      shipping_class: "STANDARD",
      weight_kg: 0.5,
      length_cm: 15.0,
      width_cm: 10.0,
      height_cm: 5.0,
    },
  });

  const watchWeight = Number(form.watch("weight_kg") || 0);
  const watchLength = Number(form.watch("length_cm") || 0);
  const watchWidth = Number(form.watch("width_cm") || 0);
  const watchHeight = Number(form.watch("height_cm") || 0);
  const watchShippingClass = form.watch("shipping_class");

  const volWeight = ((watchLength * watchWidth * watchHeight) / 5000).toFixed(2);
  const chargeableWeight = Math.max(watchWeight, Number(volWeight)).toFixed(2);

  const [showAdvancedDimensions, setShowAdvancedDimensions] = useState(false);

  const applyPreset = (preset: typeof PACKAGE_PRESETS[0]) => {
    setSelectedPreset(preset.id);
    form.setValue("shipping_class", preset.shipping_class);
    form.setValue("weight_kg", preset.weight_kg);
    form.setValue("length_cm", preset.length_cm);
    form.setValue("width_cm", preset.width_cm);
    form.setValue("height_cm", preset.height_cm);
  };

  const onSubmit = (data: ProductFormValues) => {
    if (images.length === 0) {
      toast.error("Please upload at least one product image.");
      return;
    }
    console.log("Product Submitted:", data, images);
    toast.success("Product created successfully!");
    router.push("/seller/products");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setImages([...images, url]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">General Information</h2>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Premium Wireless Headphones" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={5}
                        placeholder="Describe your product in detail..."
                        className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800 px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="" disabled>Select the closest match...</option>
                          <option value="electronics-other">Electronics &gt; Other Wearables</option>
                          <option value="fashion-men">Fashion &gt; Men's Clothing</option>
                          <option value="fashion-other">Fashion &gt; Miscellaneous</option>
                          <option value="home-other">Home &amp; Furniture &gt; Other</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="suggestedCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                        <Sparkles className="w-3.5 h-3.5" /> Can't find the exact category?
                      </FormLabel>
                      <FormControl>
                        <Input placeholder='Suggest one here... (e.g. "Smart Rings")' className="bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/40 focus-visible:ring-indigo-600" {...field} />
                      </FormControl>
                      <FormDescription className="text-[10px]">
                        We'll place it in the closest match for now, and admins will promote it later!
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="brandId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800 px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                          {...field}
                        >
                          <option value="" disabled>Select Brand...</option>
                          <option value="create_new">+ Create New Brand</option>
                          <option value="nike">Nike (Global)</option>
                          <option value="samsung">Samsung (Global)</option>
                          <option value="my_custom">My Custom Brand</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch("brandId") === "create_new" && (
                  <FormField
                    control={form.control}
                    name="newBrandName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Brand Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Type your custom brand name..." className="bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 focus-visible:ring-emerald-600" {...field} />
                        </FormControl>
                        <FormDescription className="text-[10px] text-emerald-600">
                          This brand will be exclusive to your store.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Inventory Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Pricing & Inventory</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regular Price (ETB)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Price (ETB)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" {...field} />
                    </FormControl>
                    <FormDescription>Leave blank if no sale.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="SKU-12345" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Variant Dimensions & Custom Axes */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Product Variants & Dimensions</h2>
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                <Sparkles className="w-3.5 h-3.5" />
                Add Custom Variant Dimension
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Color (Inherited from Category)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-medium flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-black"></div> Midnight Black <X className="w-3 h-3 text-slate-400 cursor-pointer hover:text-red-500" />
                  </div>
                  <div className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-medium flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div> Silver <X className="w-3 h-3 text-slate-400 cursor-pointer hover:text-red-500" />
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs border border-dashed border-slate-300">
                    + Add Value
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-indigo-100 dark:border-indigo-900/30 p-4 bg-indigo-50/20 dark:bg-indigo-950/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Engraving Type (Custom Dimension)</span>
                  <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1.5 rounded-full border border-indigo-200 bg-white dark:bg-slate-900 text-xs font-medium flex items-center gap-2 text-indigo-700">
                    Laser <X className="w-3 h-3 text-indigo-400 cursor-pointer hover:text-red-500" />
                  </div>
                  <div className="px-3 py-1.5 rounded-full border border-indigo-200 bg-white dark:bg-slate-900 text-xs font-medium flex items-center gap-2 text-indigo-700">
                    Hand-Carved <X className="w-3 h-3 text-indigo-400 cursor-pointer hover:text-red-500" />
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs border border-dashed border-indigo-300 text-indigo-600">
                    + Add Custom Value
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 1-CLICK PACKAGE PRESETS & SHIPPING CARD ─── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Package Size Presets &amp; Shipping Tier
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Click a standard preset to auto-fill logistics weights and dimensions for courier line-haul.</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] font-bold">
                <Sparkles className="w-3 h-3" /> 1-Click Presets
              </div>
            </div>

            {/* Presets Grid */}
            <div>
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 block">
                Select Package Preset (1-Click Auto-Fill):
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {PACKAGE_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedPreset === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative group ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30 shadow-md scale-[1.01]"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-white"
                      }`}
                    >
                      {preset.badge && (
                        <span className={`absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected 
                            ? "bg-indigo-600 text-white" 
                            : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}>
                          {preset.badge}
                        </span>
                      )}
                      <div>
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div className={`p-2 rounded-lg ${isSelected ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600"}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className={`text-xs font-bold block ${isSelected ? "text-indigo-950 dark:text-indigo-100" : "text-slate-900 dark:text-white"}`}>
                              {preset.name}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                              {preset.subtitle}
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                          {preset.examples}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-medium">Tier: <b className="text-slate-700 dark:text-slate-300 font-bold">{preset.shipping_class}</b></span>
                        {isSelected && <span className="text-indigo-600 dark:text-indigo-400 font-black flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Active</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chargeable Logistics Weight Live Indicator */}
            {watchShippingClass !== "DIGITAL" && (
              <div className="rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-semibold text-indigo-950 dark:text-indigo-200 text-sm">
                      Chargeable Logistics Weight: <span className="text-indigo-600 dark:text-indigo-400 underline font-bold">{chargeableWeight} kg</span> (Tier: <span className="font-bold">{watchShippingClass}</span>)
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      Couriers charge the higher of <b>Actual Weight ({watchWeight} kg)</b> or <b>Volumetric Weight ({volWeight} kg)</b> calculated via standard formula <code>(L × W × H) / 5000</code>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Custom Dimensions Accordion Toggle */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAdvancedDimensions(!showAdvancedDimensions)}
                className="flex items-center justify-between w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
              >
                <span className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-slate-500" />
                  Custom Measurements &amp; Advanced Dimensions
                </span>
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span>{showAdvancedDimensions ? "Hide Inputs" : "Override Measurements"}</span>
                  {showAdvancedDimensions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {showAdvancedDimensions && (
                <div className="mt-4 p-5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-5">
                  <FormField
                    control={form.control}
                    name="shipping_class"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-xs font-bold">Manual Shipping Class Override</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {SHIPPING_CLASSES.map((sc) => (
                              <button
                                key={sc.id}
                                type="button"
                                onClick={() => {
                                  field.onChange(sc.id);
                                  setSelectedPreset("custom");
                                }}
                                className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                                  field.value === sc.id
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                                }`}
                              >
                                {sc.label}
                              </button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchShippingClass !== "DIGITAL" && (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                      <FormField
                        control={form.control}
                        name="weight_kg"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold">Weight (kg)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="0.5" 
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setSelectedPreset("custom");
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="length_cm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold">Length (cm)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                placeholder="15.0" 
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setSelectedPreset("custom");
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="width_cm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold">Width (cm)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                placeholder="10.0" 
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setSelectedPreset("custom");
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="height_cm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold">Height (cm)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                placeholder="5.0" 
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setSelectedPreset("custom");
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Media & Publish */}
        <div className="space-y-8">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Product Media</h2>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="h-10 w-10 text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Click to upload image</p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
              </div>
              
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group">
                      <img src={img} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-black/50 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Publish Status</h2>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="status-active"
                          value="ACTIVE"
                          checked={field.value === "ACTIVE"}
                          onChange={() => field.onChange("ACTIVE")}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <Label htmlFor="status-active" className="cursor-pointer">Active</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="status-draft"
                          value="DRAFT"
                          checked={field.value === "DRAFT"}
                          onChange={() => field.onChange("DRAFT")}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <Label htmlFor="status-draft" className="cursor-pointer">Draft</Label>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="mt-8 flex flex-col gap-3">
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Save Product</Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="w-full border-slate-200 dark:border-slate-700">Discard Changes</Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
