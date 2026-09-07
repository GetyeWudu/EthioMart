"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brand, ProductType, CategoryAttributeBinding, CategoryNode } from "@/features/products/types";
import { catalogService } from "@/features/products/services/catalog-service";
import { vendorService } from "@/features/vendors/services/vendor-service";
import { inventoryService } from "@/features/inventory/services/inventory-service";
import { WarehouseLocation } from "@/features/inventory/types";
import { ProductVariantMatrix, VariantRow } from "@/components/catalog/product-variant-matrix";
import { ProductImageUploader, StagedImage } from "@/components/catalog/product-image-uploader";
import {
  ArrowLeft, CheckCircle2, AlertCircle, Layers,
  Package, Layers as LayersIcon, Filter, Plus, Trash2, Warehouse, Store, Compass,
  Truck, ShieldAlert, Download, Info, Mail, Sliders, ChevronDown, ChevronUp, Sparkles, X
} from "lucide-react";
import { cn } from "@/lib/utils";



interface PackagePreset {
  id: string;
  name: string;
  subtitle: string;
  examples: string;
  icon: any;
  weight_kg: string;
  length_cm: string;
  width_cm: string;
  height_cm: string;
  shipping_class: "STANDARD" | "HEAVY" | "BULKY" | "FRAGILE" | "DIGITAL";
  badge?: string;
}

const PACKAGE_PRESETS: PackagePreset[] = [
  {
    id: "small_pouch",
    name: "Small Pouch",
    subtitle: "0.5 kg | 15×10×5 cm",
    examples: "Phones, Jewelry, Cosmetics, Small Accessories",
    icon: Mail,
    weight_kg: "0.5",
    length_cm: "15.0",
    width_cm: "10.0",
    height_cm: "5.0",
    shipping_class: "STANDARD",
    badge: "Smartphones & Jewelry",
  },
  {
    id: "standard_box",
    name: "Shoe / Standard Box",
    subtitle: "1.5 kg | 30×20×15 cm",
    examples: "Shoes, Clothes, Tablets, Books",
    icon: Package,
    weight_kg: "1.5",
    length_cm: "30.0",
    width_cm: "20.0",
    height_cm: "15.0",
    shipping_class: "STANDARD",
    badge: "Apparel & Shoes",
  },
  {
    id: "medium_parcel",
    name: "Medium Box / Appliance",
    subtitle: "5.0 kg | 40×30×25 cm",
    examples: "Blenders, Kettles, Laptops, Kitchenware",
    icon: Truck,
    weight_kg: "5.0",
    length_cm: "40.0",
    width_cm: "30.0",
    height_cm: "25.0",
    shipping_class: "HEAVY",
    badge: "Appliances & Tools",
  },
  {
    id: "bulky_freight",
    name: "Heavy / Bulky Freight",
    subtitle: "40.0 kg | 120×80×80 cm",
    examples: "Sofas, Refrigerators, Beds, TVs",
    icon: LayersIcon,
    weight_kg: "40.0",
    length_cm: "120.0",
    width_cm: "80.0",
    height_cm: "80.0",
    shipping_class: "BULKY",
    badge: "Furniture & Large Items",
  },
  {
    id: "fragile_parcel",
    name: "Fragile Box",
    subtitle: "2.0 kg | 25×20×20 cm",
    examples: "Glassware, Ceramics, Perfumes (Special Care)",
    icon: ShieldAlert,
    weight_kg: "2.0",
    length_cm: "25.0",
    width_cm: "20.0",
    height_cm: "20.0",
    shipping_class: "FRAGILE",
    badge: "Special Handling",
  },
  {
    id: "digital_product",
    name: "Digital / Virtual",
    subtitle: "0 kg (No physical parcel)",
    examples: "E-books, Software licenses, Gift Cards",
    icon: Download,
    weight_kg: "0.0",
    length_cm: "0.0",
    width_cm: "0.0",
    height_cm: "0.0",
    shipping_class: "DIGITAL",
    badge: "No Shipping",
  },
];

const SHIPPING_CLASSES = [
  { id: "STANDARD", label: "Standard", desc: "Clothes, electronics (< 5kg)", icon: Package },
  { id: "HEAVY", label: "Heavy", desc: "Appliances, heavy gear (5kg - 20kg)", icon: Truck },
  { id: "BULKY", label: "Bulky", desc: "Sofas, large furniture (> 20kg)", icon: LayersIcon },
  { id: "FRAGILE", label: "Fragile", desc: "Glassware, ceramics (special handling)", icon: ShieldAlert },
  { id: "DIGITAL", label: "Digital", desc: "No physical shipping required", icon: Download },
] as const;

export default function NewProductPage() {
  const router = useRouter();

  // Master Data
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<CategoryNode[]>([]);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [scopedBrands, setScopedBrands] = useState<Brand[]>([]);
  const [allowedCategoryIds, setAllowedCategoryIds] = useState<string[]>([]);
  const [vendorStoreName, setVendorStoreName] = useState<string>("STORE");
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([]);

  // Form State
  const [title, setTitle] = useState("");
  const [baseSku, setBaseSku] = useState("");
  const [suggestedCategory, setSuggestedCategory] = useState("");
  const [isSuggestingCustomCategory, setIsSuggestingCustomCategory] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [customSpecifications, setCustomSpecifications] = useState<{ key: string; value: string }[]>([]);
  const [productType, setProductType] = useState<ProductType>("SIMPLE");
  const [variantAttributes, setVariantAttributes] = useState<CategoryAttributeBinding[]>([]);
  const [activeVariantAttributes, setActiveVariantAttributes] = useState<string[]>([]);
  
  const [skuRandomizer] = useState(() => Math.floor(1000 + Math.random() * 9000));
  
  useEffect(() => {
    if (title.length > 2 || selectedCategoryPath.length > 0) {
      const prefix = vendorStoreName ? vendorStoreName.substring(0, 3).toUpperCase() : "GECH";
      const cat = selectedCategoryPath.length > 0 ? selectedCategoryPath[selectedCategoryPath.length - 1].name.substring(0, 3).toUpperCase() : "GEN";
      const titlePrefix = title.length > 0 ? title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X') : "ITM";
      setBaseSku(`${prefix}-${cat}-${titlePrefix}-${skuRandomizer}`);
    }
  }, [title, selectedCategoryPath, vendorStoreName, skuRandomizer]);

  const toggleActiveAttribute = (id: string) => {
    setActiveVariantAttributes(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  // Custom Dimensions & Dropdown State
  type CustomDimension = { id: string; name: string; values: string[]; currentInput: string };
  const [customDimensions, setCustomDimensions] = useState<CustomDimension[]>([]);
  const [customAttrInputs, setCustomAttrInputs] = useState<{ [attrId: string]: string }>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");

  // Shipping & Dimensions State
  const [selectedPresetId, setSelectedPresetId] = useState<string>("small_pouch");
  const [showAdvancedDimensions, setShowAdvancedDimensions] = useState(false);
  const [shippingClass, setShippingClass] = useState<"STANDARD" | "HEAVY" | "BULKY" | "FRAGILE" | "DIGITAL">("STANDARD");
  const [weightKg, setWeightKg] = useState("0.5");
  const [lengthCm, setLengthCm] = useState("15.0");
  const [widthCm, setWidthCm] = useState("10.0");
  const [heightCm, setHeightCm] = useState("5.0");

  const numLength = parseFloat(lengthCm) || 0;
  const numWidth = parseFloat(widthCm) || 0;
  const numHeight = parseFloat(heightCm) || 0;
  const numWeight = parseFloat(weightKg) || 0;
  const volWeight = ((numLength * numWidth * numHeight) / 5000).toFixed(2);
  const chargeableWeight = Math.max(numWeight, parseFloat(volWeight) || 0).toFixed(2);

  // Single SKU
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [initialStock, setInitialStock] = useState("10");

  // Configurable Variants
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [selectedAttrValues, setSelectedAttrValues] = useState<{ [attrId: string]: string[] }>({});

  // Images
  const [images, setImages] = useState<StagedImage[]>([]);

  // UI
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-Save Draft to LocalStorage
  useEffect(() => {
    if (dataLoading) return;
    const draft = {
      title, shortDescription, description,
      selectedCategoryPathIds: selectedCategoryPath.map(c => c.id),
      suggestedCategory, isSuggestingCustomCategory,
      selectedBrandId, newBrandName,
      productType, selectedPresetId, showAdvancedDimensions, shippingClass,
      weightKg, lengthCm, widthCm, heightCm,
      price, compareAtPrice, initialStock, selectedWarehouseId,
      customSpecifications
    };
    localStorage.setItem("gechexpress_product_draft", JSON.stringify(draft));
  }, [title, shortDescription, description, selectedCategoryPath, suggestedCategory, isSuggestingCustomCategory, selectedBrandId, newBrandName, productType, selectedPresetId, showAdvancedDimensions, shippingClass, weightKg, lengthCm, widthCm, heightCm, price, compareAtPrice, initialStock, selectedWarehouseId, customSpecifications, dataLoading]);

  useEffect(() => {
    Promise.all([
      catalogService.getCategoryTree(),
      catalogService.getBrands(),
      vendorService.getSellerProfile().catch(() => null),
      inventoryService.getWarehouses().catch(() => []),
    ]).then(([tree, bnds, profile, whs]) => {
      setCategoryTree(tree || []);
      
      // Default Electronics category if not already set by draft
      if (tree && tree.length > 0) {
        const electronicsNode = tree.find((c: any) => c.name.toLowerCase().includes('electronic'));
        if (electronicsNode && selectedCategoryPath.length === 0) {
          setSelectedCategoryPath([electronicsNode]);
          catalogService.getCategoryAttributes(electronicsNode.id).then(attrs => {
            setVariantAttributes(attrs || []);
            setActiveVariantAttributes((attrs || []).map((a: any) => a.attribute.id));
          }).catch(() => {});
        }
      }
      setAllBrands(bnds || []);
      setScopedBrands(bnds || []); // default all brands until category chosen
      if (whs && whs.length > 0) {
        setWarehouses(whs);
        const defaultWh = whs.find((w: WarehouseLocation) => w.is_default) || whs[0];
        if (defaultWh) setSelectedWarehouseId(defaultWh.id);
      }
      if (profile) {
        if (profile.store_name) setVendorStoreName(profile.store_name.substring(0, 5).toUpperCase());
        if (profile.allowed_categories && profile.allowed_categories.length > 0) {
          setAllowedCategoryIds(profile.allowed_categories.map((c: any) => c.id || c.slug));
        }
      }
    }).finally(() => setDataLoading(false));
  }, []);

  const applyPreset = (preset: PackagePreset) => {
    setSelectedPresetId(preset.id);
    setShippingClass(preset.shipping_class);
    setWeightKg(preset.weight_kg);
    setLengthCm(preset.length_cm);
    setWidthCm(preset.width_cm);
    setHeightCm(preset.height_cm);
  };

  const handleCategoryLevelChange = async (levelIndex: number, nodeId: string) => {
    if (nodeId === "create_new") {
      const newPath = selectedCategoryPath.slice(0, levelIndex);
      setSelectedCategoryPath(newPath);
      setSuggestedCategory("");
      setIsSuggestingCustomCategory(true);
      return;
    }

    if (!nodeId) {
      const newPath = selectedCategoryPath.slice(0, levelIndex);
      setSelectedCategoryPath(newPath);
      setIsSuggestingCustomCategory(false);
      setSelectedAttrValues({});
      setActiveVariantAttributes([]);
      setVariants([]);
      setSelectedBrandId("");
      return;
    }

    const findNode = (nodes: CategoryNode[], id: string): CategoryNode | null => {
      for (const n of nodes) {
        if (n.id === id) return n;
        if (n.children) {
          const found = findNode(n.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const selectedNode = findNode(categoryTree, nodeId);
    if (!selectedNode) return;

    const newPath = [...selectedCategoryPath.slice(0, levelIndex), selectedNode];
    setSelectedCategoryPath(newPath);
    setSuggestedCategory("");
    setIsSuggestingCustomCategory(false);
    setSelectedAttrValues({});
    setActiveVariantAttributes([]);
    setVariants([]);
    setSelectedBrandId("");

    const slugOrName = (selectedNode.slug + " " + selectedNode.name).toLowerCase();
    let matchedPreset = PACKAGE_PRESETS[0];
    if (slugOrName.includes("phone") || slugOrName.includes("mobile") || slugOrName.includes("jewelry") || slugOrName.includes("watch") || slugOrName.includes("cosmetic") || slugOrName.includes("accessory")) {
      matchedPreset = PACKAGE_PRESETS[0];
    } else if (slugOrName.includes("shoe") || slugOrName.includes("cloth") || slugOrName.includes("fashion") || slugOrName.includes("apparel") || slugOrName.includes("shirt") || slugOrName.includes("pant") || slugOrName.includes("book") || slugOrName.includes("tablet")) {
      matchedPreset = PACKAGE_PRESETS[1];
    } else if (slugOrName.includes("appliance") || slugOrName.includes("kitchen") || slugOrName.includes("laptop") || slugOrName.includes("computer") || slugOrName.includes("tool") || slugOrName.includes("blender")) {
      matchedPreset = PACKAGE_PRESETS[2];
    } else if (slugOrName.includes("furniture") || slugOrName.includes("sofa") || slugOrName.includes("bed") || slugOrName.includes("tv") || slugOrName.includes("fridge") || slugOrName.includes("wardrobe")) {
      matchedPreset = PACKAGE_PRESETS[3];
    } else if (slugOrName.includes("glass") || slugOrName.includes("ceramic") || slugOrName.includes("perfume")) {
      matchedPreset = PACKAGE_PRESETS[4];
    } else if (slugOrName.includes("digital") || slugOrName.includes("ebook") || slugOrName.includes("software") || slugOrName.includes("card")) {
      matchedPreset = PACKAGE_PRESETS[5];
    }
    applyPreset(matchedPreset);

    try {
      const [attrs, bnds] = await Promise.all([
        catalogService.getCategoryAttributes(nodeId, true).catch(() => []),
        catalogService.getCategoryBrands(nodeId).catch(() => []),
      ]);
      setVariantAttributes(attrs || []);
      setScopedBrands(bnds || allBrands);
    } catch (e) {
      console.error(e);
      setVariantAttributes([]);
      setScopedBrands(allBrands);
    }
  };

  const generateVariantMatrix = (
    attrValueSelections: { [attrId: string]: string[] } = selectedAttrValues,
    currentCustomDims: CustomDimension[] = customDimensions
  ) => {
    const activeStandardAttrs = Object.entries(attrValueSelections).filter(([_, vals]) => vals.length > 0);
    const activeCustomDims = currentCustomDims.filter((d) => d.name.trim() && d.values.length > 0);

    if (activeStandardAttrs.length === 0 && activeCustomDims.length === 0) {
      setVariants([]);
      return;
    }

    let combinations: { [attrName: string]: { id: string; val: string; isCustom?: boolean } }[] = [{}];

    // 1. Multiply standard attributes
    activeStandardAttrs.forEach(([attrId, valIds]) => {
      const binding = variantAttributes.find((b) => b.attribute.id === attrId);
      const attrName = binding?.attribute.name || "Option";
      const nextCombos: { [attrName: string]: { id: string; val: string; isCustom?: boolean } }[] = [];
      combinations.forEach((currentComb) => {
        valIds.forEach((vId) => {
          const valObj = binding?.attribute.values.find((v) => v.id === vId);
          if (valObj) {
            nextCombos.push({
              ...currentComb,
              [attrName]: { id: valObj.id, val: valObj.value, isCustom: false }
            });
          }
        });
      });
      combinations = nextCombos;
    });

    // 2. Multiply custom dimensions
    activeCustomDims.forEach((dim) => {
      const attrName = dim.name.trim();
      const nextCombos: { [attrName: string]: { id: string; val: string; isCustom?: boolean } }[] = [];
      combinations.forEach((currentComb) => {
        dim.values.forEach((v) => {
          nextCombos.push({
            ...currentComb,
            [attrName]: { id: `custom_${attrName}_${v}`, val: v, isCustom: true }
          });
        });
      });
      combinations = nextCombos;
    });

    const newRows: VariantRow[] = combinations.map((comb, index) => {
      const labels: { [key: string]: { label: string } } = {};
      const valIds: string[] = [];
      Object.entries(comb).forEach(([k, v]) => {
        labels[k] = { label: v.val };
        if (!v.isCustom) {
          valIds.push(v.id);
        }
      });
      const rawCode = Object.values(comb).map((v) => v.val.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "")).join("-");
      const currentCatSlug = selectedCategoryPath.length > 0 ? (selectedCategoryPath[selectedCategoryPath.length - 1].slug || "CAT") : "CAT";
      const generatedSku = `${vendorStoreName}-${currentCatSlug.substring(0, 4).toUpperCase()}-${rawCode || index + 1}`;
      const existing = variants.find((v) => v.sku === generatedSku);
      return {
        sku: existing?.sku || generatedSku,
        price: existing?.price || (price ? Number(price) : 0),
        compare_at_price: existing?.compare_at_price || (compareAtPrice ? Number(compareAtPrice) : undefined),
        initial_stock: existing?.initial_stock ?? 10,
        attribute_value_ids: valIds,
        attribute_labels: labels,
      };
    });
    setVariants(newRows);
  };

  const handleToggleAttrValue = (attrId: string, valueId: string) => {
    const currentList = selectedAttrValues[attrId] || [];
    const exists = currentList.includes(valueId);
    const updated = exists ? currentList.filter((id) => id !== valueId) : [...currentList, valueId];
    const nextSelections = { ...selectedAttrValues, [attrId]: updated };
    setSelectedAttrValues(nextSelections);
    generateVariantMatrix(nextSelections, customDimensions);
  };

  const handleAddCustomAttrValue = async (attributeId: string) => {
    const inputVal = (customAttrInputs[attributeId] || "").trim();
    if (!inputVal) return;

    try {
      const newVal = await catalogService.createSellerAttributeValue(attributeId, inputVal);
      setVariantAttributes((prev) =>
        prev.map((binding) => {
          if (binding.attribute.id === attributeId) {
            const exists = binding.attribute.values.some(
              (v) => v.id === newVal.id || v.value.toLowerCase() === inputVal.toLowerCase()
            );
            if (!exists) {
              return {
                ...binding,
                attribute: {
                  ...binding.attribute,
                  values: [...binding.attribute.values, newVal],
                },
              };
            }
          }
          return binding;
        })
      );
      const currentList = selectedAttrValues[attributeId] || [];
      const updated = currentList.includes(newVal.id) ? currentList : [...currentList, newVal.id];
      const nextSelections = { ...selectedAttrValues, [attributeId]: updated };
      setSelectedAttrValues(nextSelections);
      setCustomAttrInputs((prev) => ({ ...prev, [attributeId]: "" }));
      generateVariantMatrix(nextSelections, customDimensions);
    } catch (err) {
      console.error("Failed to add custom attribute value:", err);
      const fallbackId = `local_custom_${Date.now()}`;
      const fallbackVal: any = { id: fallbackId, value: inputVal, is_global: false };
      setVariantAttributes((prev) =>
        prev.map((binding) => {
          if (binding.attribute.id === attributeId) {
            return {
              ...binding,
              attribute: {
                ...binding.attribute,
                values: [...binding.attribute.values, fallbackVal],
              },
            };
          }
          return binding;
        })
      );
      const currentList = selectedAttrValues[attributeId] || [];
      const nextSelections = { ...selectedAttrValues, [attributeId]: [...currentList, fallbackId] };
      setSelectedAttrValues(nextSelections);
      setCustomAttrInputs((prev) => ({ ...prev, [attributeId]: "" }));
      generateVariantMatrix(nextSelections, customDimensions);
    }
  };

  const addCustomSpec = () => {
    setCustomSpecifications((prev) => [...prev, { key: "", value: "" }]);
  };

  const updateCustomSpec = (index: number, field: "key" | "value", val: string) => {
    setCustomSpecifications((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const removeCustomSpec = (index: number) => {
    setCustomSpecifications((prev) => prev.filter((_, i) => i !== index));
  };

  // Custom Dimension Handlers
  const addCustomDimension = () => {
    setCustomDimensions((prev) => [...prev, { id: Date.now().toString(), name: "", values: [], currentInput: "" }]);
  };

  const removeCustomDimension = (id: string) => {
    const nextDims = customDimensions.filter((d) => d.id !== id);
    setCustomDimensions(nextDims);
    generateVariantMatrix(selectedAttrValues, nextDims);
  };

  const updateCustomDimensionName = (id: string, name: string) => {
    const nextDims = customDimensions.map((d) => (d.id === id ? { ...d, name } : d));
    setCustomDimensions(nextDims);
    generateVariantMatrix(selectedAttrValues, nextDims);
  };

  const updateCustomDimensionInput = (id: string, input: string) => {
    setCustomDimensions((prev) => prev.map((d) => (d.id === id ? { ...d, currentInput: input } : d)));
  };

  const addCustomDimensionValue = (id: string, e?: React.KeyboardEvent<HTMLInputElement>) => {
    if (e && e.key !== 'Enter') return;
    if (e) e.preventDefault();
    const targetDim = customDimensions.find((d) => d.id === id);
    if (!targetDim || !targetDim.currentInput.trim() || targetDim.values.includes(targetDim.currentInput.trim())) return;
    const newValues = [...targetDim.values, targetDim.currentInput.trim()];
    const nextDims = customDimensions.map((d) =>
      d.id === id ? { ...d, values: newValues, currentInput: "" } : d
    );
    setCustomDimensions(nextDims);
    generateVariantMatrix(selectedAttrValues, nextDims);
  };

  const removeCustomDimensionValue = (id: string, valueToRemove: string) => {
    const nextDims = customDimensions.map((d) => {
      if (d.id === id) {
        return { ...d, values: d.values.filter((v) => v !== valueToRemove) };
      }
      return d;
    });
    setCustomDimensions(nextDims);
    generateVariantMatrix(selectedAttrValues, nextDims);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategoryPath.length === 0) { setErrorMsg("Please select a category."); return; }
    if (isSuggestingCustomCategory && !suggestedCategory.trim()) { setErrorMsg("Please provide a category path for your suggestion."); return; }
    if (productType === "SIMPLE") {
      if (!price || Number(price) <= 0) { setErrorMsg("Please set a valid selling price."); return; }
    } else {
      if (variants.length === 0) { setErrorMsg("Please configure at least 1 variant combination."); return; }
      if (variants.find((v) => !v.sku.trim() || Number(v.price) <= 0)) {
        setErrorMsg("All variants must have a unique SKU and valid price (> 0 ETB)."); return;
      }
      // Validate all required variant creator attributes have at least one value selected
      for (const binding of variantAttributes) {
        if (binding.is_required) {
          const selectedVals = selectedAttrValues[binding.attribute.id] || [];
          if (selectedVals.length === 0) {
            setErrorMsg(`Required variant attribute '${binding.attribute.name}' is missing. Please select at least one option for '${binding.attribute.name}'.`);
            return;
          }
        }
      }
    }

    setLoading(true); setErrorMsg(null);
    try {
      const customSpecsObj: Record<string, string> = {};
      customSpecifications.forEach(({ key, value }) => {
        if (key.trim() && value.trim()) customSpecsObj[key.trim()] = value.trim();
      });

      let finalBrandId = selectedBrandId === "create_new" ? undefined : (selectedBrandId || undefined);
      if (selectedBrandId === "create_new" && newBrandName.trim()) {
        try {
          const createdBrand = await catalogService.createSellerBrand(newBrandName.trim());
          if (createdBrand && createdBrand.id) {
            finalBrandId = createdBrand.id;
          }
        } catch (bErr) {
          console.warn("Could not pre-create brand, sending new_brand_name in payload:", bErr);
        }
      }

      const payload: any = {
        category_id: selectedCategoryPath.length > 0 ? selectedCategoryPath[selectedCategoryPath.length - 1].id : undefined,
        suggested_category: isSuggestingCustomCategory && suggestedCategory.trim() ? suggestedCategory.trim() : undefined,
        brand_id: finalBrandId,
        new_brand_name: selectedBrandId === "create_new" && newBrandName.trim() ? newBrandName.trim() : undefined,
        title: title.trim(),
        short_description: shortDescription.trim(),
        description: description.trim(),
        product_type: productType,
        shipping_class: shippingClass,
        weight_kg: Number(weightKg) || 0.5,
        length_cm: Number(lengthCm) || 15.0,
        width_cm: Number(widthCm) || 10.0,
        height_cm: Number(heightCm) || 5.0,
        price: productType === "SIMPLE" ? Number(price) : undefined,
        compare_at_price: productType === "SIMPLE" && compareAtPrice ? Number(compareAtPrice) : undefined,
        initial_stock: productType === "SIMPLE" ? Number(initialStock) : undefined,
        warehouse_id: selectedWarehouseId || undefined,
        custom_specifications: Object.keys(customSpecsObj).length > 0 ? customSpecsObj : undefined,
        variants: productType === "CONFIGURABLE_VARIANT"
          ? variants.map((v) => ({
              sku: v.sku.trim(),
              price: Number(v.price),
              compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : undefined,
              initial_stock: Number(v.initial_stock),
              attribute_value_ids: v.attribute_value_ids,
              attribute_labels: v.attribute_labels,
            }))
          : undefined,
      };

      const createdProduct = await catalogService.createProduct(payload);

      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (img.file) await catalogService.uploadProductImage(createdProduct.id, img.file, img.isPrimary);
        }
      }

      await catalogService.submitProductForReview(createdProduct.id);
      router.push("/seller/products");
    } catch (err: any) {
      console.error("Product submission failed:", err);
      const data = err.response?.data;
      let message = "Failed to create product listing.";
      if (data) {
        if (Array.isArray(data.errors)) {
          message = data.errors.join(" ");
        } else if (typeof data.errors === "string") {
          message = data.errors;
        } else if (data.error) {
          message = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
        } else if (data.detail) {
          message = data.detail;
        } else if (typeof data === "object") {
          const fieldErrors = Object.entries(data)
            .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(", ") : errs}`)
            .join(" | ");
          if (fieldErrors) message = fieldErrors;
        }
      } else if (err.message) {
        message = err.message;
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    setErrorMsg(null);
    if (step === 1) {
      if (selectedCategoryPath.length === 0) { setErrorMsg("Please select a category."); return false; }
      if (isSuggestingCustomCategory && !suggestedCategory.trim()) { setErrorMsg("Please provide a category path for your suggestion."); return false; }
      return true;
    }
    if (step === 2) {
      if (title.trim().length < 5) { setErrorMsg("Please provide a valid product title (min 5 characters)."); return false; }
      if (!description.trim()) { setErrorMsg("Please provide a detailed description."); return false; }
      // Images check deferred to step 2 but let's say at least 1 image
      if (images.length === 0) { setErrorMsg("Please upload at least one primary image."); return false; }
      return true;
    }
    if (step === 3) {
      if (!selectedWarehouseId) { setErrorMsg("Please select an Inbound Logistics Hub."); return false; }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Pre-Submission Check Computations
  const isCategorySelected = selectedCategoryPath.length > 0 && (!isSuggestingCustomCategory || suggestedCategory.trim().length > 0);
  const isTitleValid = title.trim().length >= 5;
  const isPricingValid = productType === "SIMPLE" ? Number(price) > 0 : variants.length > 0 && variants.every(v => Number(v.price) > 0);
  const hasImages = images.length > 0;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-2xl flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        
        <form id="product-form" onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 relative">

          {/* Form Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden">
            
            {/* Unified Form Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 sm:px-8 flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-white">
                {currentStep === 1 && "Category & Brand"}
                {currentStep === 2 && "Product Details"}
                {currentStep === 3 && "Shipping & Location"}
                {currentStep === 4 && "Pricing & Variants"}
              </h2>

              {/* Minimal Stepper (Clickable Pagination) */}
              <div className="flex items-center">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(step)}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all hover:scale-105 active:scale-95 border",
                        currentStep === step ? "bg-white text-indigo-600 border-white shadow-md ring-4 ring-white/30" :
                        currentStep > step ? "bg-emerald-400 text-white border-emerald-400 hover:bg-emerald-500" :
                        "bg-white/10 text-indigo-200 border-indigo-300/30 hover:bg-white/20 hover:text-white"
                      )}
                    >
                      {currentStep > step ? <CheckCircle2 className="w-4 h-4" /> : step}
                    </button>
                    {step < 4 && (
                      <div className={cn(
                        "w-6 h-[2px] mx-1 rounded-full transition-colors",
                        currentStep > step ? "bg-emerald-400" : "bg-white/20"
                      )} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form Body Container */}
            <div className="p-6 sm:p-10 border-t border-slate-100 dark:border-slate-800">


          {/* ─── STEP 1: TAXONOMY & BRAND ─── */}
          <div className={currentStep === 1 ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
            <div className="space-y-8">
              
              {/* ROW 1: Name and SKU */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Product Name*</label>
                  <input type="text" required placeholder="e.g. Classic Black Tuxedo Suit for Men" value={title} onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-sm px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Base SKU (Auto-generated)</label>
                  <div className="flex gap-2">
                    <input type="text" value={baseSku} readOnly placeholder="Auto-generating..."
                      className="w-full text-sm px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none shadow-sm cursor-not-allowed font-mono font-bold" />
                  </div>
                </div>
              </div>

              {/* ROW 2: Category */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* MAIN CATEGORY */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Main Category*</label>
                    <select 
                      required
                      value={selectedCategoryPath.length > 0 ? selectedCategoryPath[0].id : ""}
                      onChange={(e) => handleCategoryLevelChange(0, e.target.value)}
                      className="w-full text-sm px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all shadow-sm"
                    >
                      <option value="">-- Select Main Category --</option>
                      {categoryTree.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* SUBCATEGORY 1 */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Subcategory*</label>
                    <select 
                      required
                      disabled={selectedCategoryPath.length === 0}
                      value={selectedCategoryPath.length > 1 ? selectedCategoryPath[1].id : (isSuggestingCustomCategory ? "create_new" : "")}
                      onChange={(e) => handleCategoryLevelChange(1, e.target.value)}
                      className="w-full text-sm px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all shadow-sm disabled:opacity-50"
                    >
                      <option value="">-- Select Subcategory --</option>
                      {selectedCategoryPath.length > 0 && selectedCategoryPath[0].children?.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                      {selectedCategoryPath.length > 0 && (
                        <option value="create_new" className="font-bold text-indigo-600">+ Add Custom Category</option>
                      )}
                    </select>
                  </div>
                </div>

                {isSuggestingCustomCategory && (
                  <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-[11px] font-bold text-indigo-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Suggest a Category Path
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Traditional Wear / Men's Tilf"
                      value={suggestedCategory}
                      onChange={(e) => setSuggestedCategory(e.target.value)}
                      className="w-full text-sm px-4 py-3 border border-indigo-200 dark:border-indigo-900/40 rounded-xl bg-indigo-50/30 dark:bg-indigo-950/20 text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all shadow-sm"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Type the category and subcategory you need, separated by a slash ( / ). We'll place it in the closest match for now.
                    </p>
                  </div>
                )}
              </div>

              {/* ROW 3: Brand and Variant Toggle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Brand (Optional)</label>
                  <select value={selectedBrandId} onChange={(e) => setSelectedBrandId(e.target.value)}
                  className="w-full text-sm px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-sm">
                  <option value="">[ Unbranded / Generic ]</option>
                  <option value="create_new" className="font-bold text-indigo-600">+ Create New Brand</option>
                  {scopedBrands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                  {/* New Brand Logic */}
                </div>
                
              </div>

</div>
          </div>
          {/* ─── STEP 2: DETAILS & MEDIA ─── */}
          <div className={currentStep === 2 ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
            <div className="space-y-6">
{/* ─── SECTION 1: BASIC DETAILS ─── */}
            <div className="space-y-5">
              

              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Short Summary</label>
                <input type="text" placeholder="Key selling points in 1 sentence..." value={shortDescription} onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full text-sm px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-sm" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Detailed Description (Rich Text/MD)*</label>
                <textarea rows={5} required placeholder="Comprehensive product specifications, features, warranty, and compatibility..." value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-4 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed" />
              </div>

              {/* Custom Specs */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Custom Specifications</label>
                  <button type="button" onClick={addCustomSpec}
                    className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 px-2.5 py-1.5 border border-indigo-200 rounded-lg transition-colors">
                    <Plus className="w-3 h-3" /> Add Row
                  </button>
                </div>
                {customSpecifications.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No custom specs yet. Add key-value pairs for extra technical data.</p>
                ) : (
                  <div className="space-y-2">
                    {customSpecifications.map((spec, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input type="text" placeholder="Key (e.g. Sole Material)" value={spec.key} onChange={(e) => updateCustomSpec(i, "key", e.target.value)}
                          className="w-1/3 text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                        <input type="text" placeholder="Value (e.g. Rubber)" value={spec.value} onChange={(e) => updateCustomSpec(i, "value", e.target.value)}
                          className="flex-1 text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                        <button type="button" onClick={() => removeCustomSpec(i)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            
            {/* ─── SECTION 3: MEDIA GALLERY ─── */}
            <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
              <ProductImageUploader images={images} onChange={setImages} />
            </div>
          </div>
        </div>

        {/* ─── STEP 3: LOGISTICS ─── */}
          <div className={currentStep === 3 ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
            <div className="space-y-6">
{/* ─── SECTION 2: 1-CLICK PACKAGE SIZE PRESETS & SHIPPING ─── */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Click a standard preset to auto-fill logistics weights and dimensions for courier line-haul.</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] font-bold">
                  <Sparkles className="w-3 h-3" /> Auto-Configured
                </div>
              </div>

              {/* 1-Click Package Presets Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                  Select Package Preset (1-Click Auto-Fill):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {PACKAGE_PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => applyPreset(preset)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative group ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 ring-2 ring-indigo-500/30 shadow-md scale-[1.01]"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-900/80"
                        }`}
                      >
                        {preset.badge && (
                          <span className={`absolute top-3 right-3 text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            isSelected 
                              ? "bg-indigo-600 text-white" 
                              : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}>
                            {preset.badge}
                          </span>
                        )}
                        <div>
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <div className={`p-2 rounded-xl ${isSelected ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600"}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <span className={`text-xs font-black block ${isSelected ? "text-indigo-950 dark:text-indigo-100" : "text-slate-900 dark:text-white"}`}>
                                {preset.name}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
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

              {/* Chargeable Logistics Weight Indicator */}
              {shippingClass !== "DIGITAL" && (
                <div className="rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-indigo-950 dark:text-indigo-200 text-sm">
                        Chargeable Logistics Weight: <span className="text-indigo-600 dark:text-indigo-400 underline font-black">{chargeableWeight} kg</span> (Tier: <span className="font-extrabold">{shippingClass}</span>)
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                        Couriers bill using the maximum of <b>Actual Weight ({numWeight} kg)</b> or <b>Volumetric Weight ({volWeight} kg)</b> via standard air/truck formula <code>(L × W × H) / 5000</code>.
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
                  <div className="mt-4 p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Manual Shipping Class Override</label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {SHIPPING_CLASSES.map((sc) => (
                          <button
                            key={sc.id}
                            type="button"
                            onClick={() => {
                              setShippingClass(sc.id);
                              setSelectedPresetId("custom");
                            }}
                            className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                              shippingClass === sc.id
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                            }`}
                          >
                            {sc.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {shippingClass !== "DIGITAL" && (
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                        <div>
                          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Weight (kg)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.5"
                            value={weightKg}
                            onChange={(e) => {
                              setWeightKg(e.target.value);
                              setSelectedPresetId("custom");
                            }}
                            className="w-full text-xs px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Length (cm)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="15.0"
                            value={lengthCm}
                            onChange={(e) => {
                              setLengthCm(e.target.value);
                              setSelectedPresetId("custom");
                            }}
                            className="w-full text-xs px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Width (cm)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="10.0"
                            value={widthCm}
                            onChange={(e) => {
                              setWidthCm(e.target.value);
                              setSelectedPresetId("custom");
                            }}
                            className="w-full text-xs px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Height (cm)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="5.0"
                            value={heightCm}
                            onChange={(e) => {
                              setHeightCm(e.target.value);
                              setSelectedPresetId("custom");
                            }}
                            className="w-full text-xs px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            
{/* ─── CARD 2: INBOUND LOGISTICS HUB ─── */}
            <div className="space-y-4 pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
              
              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Fulfillment Location</label>
                <select 
                  value={selectedWarehouseId} 
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full text-sm px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-sm">
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} {w.code ? `[${w.code}]` : ''}</option>
                  ))}
                  {warehouses.length === 0 && <option value="">Auto-Assign (Primary Hub)</option>}
                </select>
                <p className="text-[10px] text-slate-400 mt-2">Stock generated in this form will automatically route to this facility.</p>
              </div>
            </div>

            
            </div>
          </div>


          {/* ─── STEP 4: STRATEGY & VARIANTS ─── */}
          <div className={currentStep === 4 ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
            <div className="space-y-6">
              
              {/* === UNIFIED PRICING & VARIANTS CARD === */}
              <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                
                {/* 1. BASE PRICING (ALWAYS AT TOP) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Selling Price*</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">ETB</span>
                      <input type="number" required placeholder="85000" value={price} onChange={(e) => setPrice(e.target.value)}
                        className="w-full text-lg font-bold pl-14 pr-4 py-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 transition-all shadow-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Discount Price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">ETB</span>
                      <input type="number" placeholder="95000 (Optional)" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)}
                        className="w-full text-lg font-bold pl-14 pr-4 py-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all shadow-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Available Stock*</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">QTY</span>
                      <input type="number" required placeholder="15" value={initialStock} onChange={(e) => setInitialStock(e.target.value)}
                        className="w-full text-lg font-bold pl-14 pr-4 py-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all shadow-sm" />
                    </div>
                  </div>
                </div>

                {/* 2. VARIATIONS STRATEGY (BOTTOM) */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Variations Strategy</label>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                      {([
                        { type: "SIMPLE" as ProductType, label: "No Variants (Simple)" },
                        { type: "CONFIGURABLE_VARIANT" as ProductType, label: "Has Variants (Colors/Sizes)" },
                      ] as const).map(({ type, label }) => (
                        <button key={type} type="button" onClick={() => setProductType(type)}
                          className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                            productType === type
                              ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                              : "text-slate-500 hover:text-slate-700")}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Toggle whether this product comes in different colors, sizes, or configurations.</p>
                  </div>

                  {/* DIMENSIONS GENERATOR & MATRIX */}
                  {productType === "CONFIGURABLE_VARIANT" && (
                    <div className="space-y-6 pt-4">
                      {variantAttributes.length === 0 ? (
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-500 text-center font-medium shadow-sm">
                          Select a taxonomy category in Step 1 first to configure variant dimensions.
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {/* Variant Opt-In Builder */}
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">What kind of variations does this product have?</h3>
                            <p className="text-sm text-slate-500 mb-6">Select the options that apply to this product (e.g., Color Only, Size Only, or both Color & Size):</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              {variantAttributes.map(binding => (
                                <label key={`optin-${binding.id}`} className="flex items-center gap-3 cursor-pointer group p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all shadow-sm">
                                  <input
                                    type="checkbox"
                                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={activeVariantAttributes.includes(binding.attribute.id)}
                                    onChange={() => toggleActiveAttribute(binding.attribute.id)}
                                  />
                                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                    {binding.attribute.name}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Dimension Generator */}
                          {activeVariantAttributes.length > 0 && (
                            <div className="space-y-6 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Configure Options</h3>
                              </div>
                              <div className="space-y-6">
                                {variantAttributes.filter(b => activeVariantAttributes.includes(b.attribute.id)).map((binding) => {
                                  return (
                                    <div key={binding.id} className="space-y-3">
                                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                                        <span>{binding.attribute.name}</span>
                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-[9px]">* REQUIRED</span>
                                      </label>
                                      <div className="flex flex-col gap-3">
                                        <select 
                                          className="w-full text-sm px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all shadow-sm"
                                          onChange={(e) => {
                                            const valId = e.target.value;
                                            if (!valId) return;
                                            setSelectedAttrValues(prev => ({ 
                                              ...prev, 
                                              [binding.attribute.id]: prev[binding.attribute.id]?.includes(valId) 
                                                ? prev[binding.attribute.id] 
                                                : [...(prev[binding.attribute.id] || []), valId] 
                                            }));
                                            e.target.value = "";
                                          }}
                                        >
                                          <option value="">Select {binding.attribute.name.toLowerCase()}...</option>
                                          {binding.attribute.values && binding.attribute.values.map((val: any) => (
                                            <option key={val.id} value={val.id} disabled={(selectedAttrValues[binding.attribute.id] || []).includes(val.id)}>
                                              {val.value}
                                            </option>
                                          ))}
                                        </select>

                                        {/* Selected Pills */}
                                        {(selectedAttrValues[binding.attribute.id] || []).length > 0 && (
                                          <div className="flex flex-wrap gap-2 p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                            {(selectedAttrValues[binding.attribute.id] || []).map(valId => {
                                              const v = binding.attribute.values?.find((x: any) => x.id === valId);
                                              if (!v) return null;
                                              return (
                                                <span key={valId} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-lg text-sm font-bold shadow-sm">
                                                  {v.value}
                                                  <button type="button" className="hover:text-rose-500" onClick={() => {
                                                    setSelectedAttrValues(prev => ({ 
                                                      ...prev, 
                                                      [binding.attribute.id]: (prev[binding.attribute.id] || []).filter(id => id !== valId) 
                                                    }));
                                                  }}>
                                                    <X className="w-3.5 h-3.5" />
                                                  </button>
                                                </span>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          <div className="border-t border-dashed border-slate-200 dark:border-slate-800 my-4" />
                          
                          {customDimensions.map((dim) => (
                            <div key={dim.id} className="relative p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                                  Custom Measurement / Dimension
                                </label>
                                <button type="button" onClick={() => setCustomDimensions(prev => prev.filter(d => d.id !== dim.id))} className="text-slate-400 hover:text-rose-500 transition-colors p-1">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">Dimension Name</label>
                                  <input 
                                    type="text" 
                                    value={dim.name} 
                                    onChange={(e) => setCustomDimensions(prev => prev.map(d => d.id === dim.id ? { ...d, name: e.target.value } : d))}
                                    placeholder="e.g. Material, Style, Fit..."
                                    className="w-full text-sm px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-semibold text-slate-900 dark:text-white shadow-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">Options (Press Enter to Add)</label>
                                  <div className="w-full min-h-[46px] p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 flex flex-wrap gap-2 items-center focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-600 shadow-sm">
                                    {dim.values.map((v) => (
                                      <span key={v} className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-lg text-sm font-bold shadow-sm">
                                        {v}
                                        <button type="button" onClick={() => setCustomDimensions(prev => prev.map(d => d.id === dim.id ? { ...d, values: d.values.filter(val => val !== v) } : d))} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
                                      </span>
                                    ))}
                                    <input 
                                      type="text" 
                                      value={dim.currentInput} 
                                      onChange={(e) => setCustomDimensions(prev => prev.map(d => d.id === dim.id ? { ...d, currentInput: e.target.value } : d))}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && dim.currentInput.trim()) {
                                          e.preventDefault();
                                          setCustomDimensions(prev => prev.map(d => d.id === dim.id ? { ...d, values: [...d.values, d.currentInput.trim()], currentInput: "" } : d));
                                        }
                                      }} 
                                      placeholder="Type here..."
                                      className="flex-1 min-w-[120px] bg-transparent border-none focus:outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 ml-2"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          <button type="button" onClick={() => setCustomDimensions(prev => [...prev, { id: Math.random().toString(), name: "", values: [], currentInput: "" }])} className="w-full py-4 border-2 border-dashed border-indigo-200 dark:border-indigo-800/60 rounded-2xl text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-center gap-2 shadow-sm">
                            <Plus className="w-5 h-5" /> Add Custom Measurement / Advanced Dimension
                          </button>

                          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                            <ProductVariantMatrix
                              variants={variants}
                              storeCode={vendorStoreName}
                              categoryCode={selectedCategoryPath.length > 0 ? (selectedCategoryPath[selectedCategoryPath.length - 1].slug || "CAT").substring(0, 4).toUpperCase() : "CAT"}
                              onChange={setVariants}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
          {/* ─── FINAL REVIEW CARD ─── */}
          <div className="bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl p-5">
                <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  Final Review Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="block text-slate-500 mb-1">Category</span>
                    <strong className="text-slate-900 dark:text-white line-clamp-1">
                      {isSuggestingCustomCategory ? suggestedCategory : (selectedCategoryPath.length > 0 ? selectedCategoryPath[selectedCategoryPath.length - 1].name : "None")}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-slate-500 mb-1">Variants</span>
                    <strong className="text-slate-900 dark:text-white">
                      {productType === "SIMPLE" ? "Single SKU" : `${variants.length} SKUs`}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-slate-500 mb-1">Shipping Tier</span>
                    <strong className="text-slate-900 dark:text-white">{shippingClass}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-500 mb-1">Images</span>
                    <strong className="text-slate-900 dark:text-white">{images.length} Uploaded</strong>
                  </div>
                </div>
              </div>

            </div>
          </div>


            </div>
          </div>

          {/* ─── WIZARD NAVIGATION ─── */}
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              Back
            </button>
            
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-colors"
              >
                Next Step
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={loading}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : (
                  <><CheckCircle2 className="w-5 h-5" /> Submit Listing for Review</>
                )}
              </button>
            )}
          </div>

        </form>

    </div>
  </div>
  );
}
