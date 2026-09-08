"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useGoogleLogin } from "@react-oauth/google";
import {
  ShoppingBag,
  Store,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Check,
  Search,
  X,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { authService } from "@/features/auth/services/auth-service";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { catalogService } from "@/features/products/services/catalog-service";
import { cn } from "@/lib/utils";

const registerBaseSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(9, { message: "Please enter a valid Ethiopian phone number." }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and numeric digits."),
  confirmPassword: z.string(),
  shopFocus: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, { message: "You must accept the terms and conditions." }),
  newsletter: z.boolean().optional(),
});

const registerSchema = registerBaseSchema.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerBaseSchema>;

type Role = "CUSTOMER" | "SELLER";

export default function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  return (
    <div className="w-full max-w-4xl mx-auto my-4 sm:my-8 px-4 sm:px-6">
      {/* Main Glassmorphic Container with Brand Gradients */}
      <div className="relative overflow-hidden rounded-[2.5rem] sm:rounded-[3rem] border border-white/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl shadow-2xl shadow-[#1261C9]/10 dark:shadow-none p-5 sm:p-8 md:p-10">
        
        {/* Brand Ambient Glows: EthioMart Blue (#1261C9) & EthioMart Orange (#FF7900) */}
        <div className="absolute top-[-10%] left-[-10%] w-[320px] h-[320px] rounded-full bg-[#1261C9]/15 blur-[90px] pointer-events-none dark:bg-[#1261C9]/10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[320px] h-[320px] rounded-full bg-[#FF7900]/15 blur-[90px] pointer-events-none dark:bg-[#FF7900]/10" />

        <div className="relative z-10">
          {/* Top Brand Logo Banner */}
          <div className="flex flex-col items-center justify-center mb-6">
            <Link href="/" className="group flex items-center gap-3 transition-transform hover:scale-105">
              <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-2xl overflow-hidden shadow-lg shadow-[#1261C9]/25 border border-white/40 dark:border-slate-700">
                <Image
                  src="/logo/abukii.png"
                  alt="EthioMart Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="text-left">
                <span className="text-xl sm:text-2xl font-black tracking-tight">
                  <span className="text-[#1261C9]">Ethio</span><span className="text-[#FF7900]">Mart</span>
                </span>
                <span className="block text-[11px] font-semibold tracking-normal text-[#1261C9] dark:text-blue-400 mt-0.5">
                  Ethiopia&apos;s local marketplace
                </span>
              </div>
            </Link>
          </div>

          {/* Dynamic Content */}
          <div className="relative min-h-[300px]">
            {selectedRole === null ? (
              <div className="animate-in zoom-in-95 fade-in duration-500">
                <div className="text-center mb-8">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Create Your Account
                  </h1>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Choose how you want to use EthioMart to get customized features for buying or selling.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  {/* Customer Role Card (Brand Blue #1261C9) */}
                  <button
                    onClick={() => setSelectedRole("CUSTOMER")}
                    className="group relative flex flex-col items-center justify-center p-8 h-[270px] rounded-[2rem] border-2 border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-500 hover:-translate-y-1.5 hover:border-[#1261C9] hover:shadow-2xl hover:shadow-[#1261C9]/20 overflow-hidden text-left"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1261C9]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10 flex flex-col items-center text-center gap-4">
                      <div className="p-5 rounded-3xl bg-[#1261C9]/10 text-[#1261C9] group-hover:scale-110 group-hover:bg-[#1261C9] group-hover:text-white transition-all duration-500 shadow-inner">
                        <ShoppingBag className="w-10 h-10" strokeWidth={1.75} />
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#1261C9]/10 text-[#1261C9] mb-1.5">
                          Personal Shopper
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                          Customer
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[240px]">
                          Shop thousands of verified products nationwide with escrow protection
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Merchant Seller Role Card (Brand Orange #FF7900) */}
                  <button
                    onClick={() => setSelectedRole("SELLER")}
                    className="group relative flex flex-col items-center justify-center p-8 h-[270px] rounded-[2rem] border-2 border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-500 hover:-translate-y-1.5 hover:border-[#FF7900] hover:shadow-2xl hover:shadow-[#FF7900]/20 overflow-hidden text-left"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF7900]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10 flex flex-col items-center text-center gap-4">
                      <div className="p-5 rounded-3xl bg-[#FF7900]/10 text-[#FF7900] group-hover:scale-110 group-hover:bg-[#FF7900] group-hover:text-white transition-all duration-500 shadow-inner">
                        <Store className="w-10 h-10" strokeWidth={1.75} />
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FF7900]/10 text-[#FF7900] mb-1.5">
                          Business & Vendors
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                          Merchant Seller
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[240px]">
                          Grow your business, accept Telebirr & CBE, and fulfill orders across Ethiopia
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-[460px] mx-auto animate-in slide-in-from-bottom-6 fade-in duration-500">
                <button 
                  onClick={() => setSelectedRole(null)}
                  className="group flex items-center text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#1261C9] dark:hover:text-blue-400 mb-6 transition-colors bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm w-fit"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5 group-hover:-translate-x-1 transition-transform" />
                  Change Account Type
                </button>

                <div className="text-center mb-5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider mb-2",
                      selectedRole === "SELLER"
                        ? "bg-[#FF7900]/10 text-[#FF7900]"
                        : "bg-[#1261C9]/10 text-[#1261C9]"
                    )}
                  >
                    {selectedRole === "SELLER" ? (
                      <>
                        <Store className="w-3.5 h-3.5" /> Merchant Onboarding
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" /> Customer Registration
                      </>
                    )}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Create {selectedRole === "SELLER" ? "Seller" : "Customer"} Account
                  </h1>
                </div>

                <RegistrationForm role={selectedRole} />
              </div>
            )}
          </div>

          {/* Footer - Login Link */}
          {selectedRole === null && (
            <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 flex justify-center">
              <div className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60 shadow-xs backdrop-blur-md transition-transform hover:scale-105 duration-300">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                  Already have an account?{" "}
                  <Link href="/login" className="font-bold text-[#1261C9] hover:underline ml-1">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function RegistrationForm({ role }: { role: Role }) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [rootCategories, setRootCategories] = useState<{ id: string; name: string; name_am?: string; slug: string }[]>([]);
  const [selectedRootCats, setSelectedRootCats] = useState<string[]>([]);

  // Dropdown state for Seller Category Focus
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchCatQuery, setSearchCatQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Click outside listener for category dropdown
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    catalogService.getRootCategories()
      .then((roots) => {
        if (roots && roots.length > 0) {
          setRootCategories(roots);
        } else {
          return catalogService.getCategoryTree().then((tree) => {
            if (tree && tree.length > 0) {
              setRootCategories(tree.map((t) => ({ id: t.id, name: t.name, name_am: t.name_am, slug: t.slug })));
            }
          });
        }
      })
      .catch(async () => {
        try {
          const tree = await catalogService.getCategoryTree();
          if (tree && tree.length > 0) {
            setRootCategories(tree.map((t) => ({ id: t.id, name: t.name, name_am: t.name_am, slug: t.slug })));
            return;
          }
        } catch {}
        setRootCategories([
          { id: "electronics", name: "Consumer Electronics", name_am: "ኤሌክትሮኒክስ", slug: "consumer-electronics" },
          { id: "fashion", name: "Fashion & Apparel", name_am: "ፋሽንና አልባሳት", slug: "fashion-apparel" },
          { id: "home-kitchen", name: "Home & Kitchen", name_am: "የቤትና ማብሰያ ዕቃዎች", slug: "home-kitchen" },
          { id: "beauty", name: "Beauty & Personal Care", name_am: "ውበትና የግል እንክብካቤ", slug: "beauty-personal-care" },
          { id: "sports", name: "Sports & Outdoors", name_am: "ስፖርትና መዝናኛ", slug: "sports-outdoors" },
          { id: "automotive", name: "Automotive & Tools", name_am: "ተሽከርካሪና መሣሪያዎች", slug: "automotive-tools" },
        ]);
      });
  }, []);

  const isSeller = role === "SELLER";
  const totalSteps = isSeller ? 2 : 1;

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema) as any,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      shopFocus: "",
      termsAccepted: false,
      newsletter: false,
    },
  });

  const nextStep = async () => {
    const fieldsToValidate = ["firstName", "lastName", "email", "phone"] as const;
    const isValid = await form.trigger(fieldsToValidate as any);
    if (!isValid) return;
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    if (isSeller && selectedRootCats.length === 0) {
      toast.error("Please select at least one primary category focus for your store.");
      setIsDropdownOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      if (isSeller) {
        const res = await authService.registerSeller({
          first_name: values.firstName,
          last_name: values.lastName,
          email: values.email,
          phone_number: values.phone,
          password: values.password,
          confirm_password: values.confirmPassword,
          allowed_category_ids: selectedRootCats,
        });
        setAuth(res.user, res.access, res.refresh);
        toast.success("Seller account registered! Welcome to EthioMart.");
        window.location.href = "/seller";
      } else {
        const res = await authService.registerCustomer({
          first_name: values.firstName,
          last_name: values.lastName,
          email: values.email,
          phone_number: values.phone || undefined,
          password: values.password,
          confirm_password: values.confirmPassword,
          newsletter: values.newsletter,
        });
        setAuth(res.user, res.access, res.refresh);
        toast.success("Welcome to EthioMart! Account created.");
        window.location.href = "/customer/orders";
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth — Restricted to Customers Only
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const res = await authService.googleAuth({
          id_token: tokenResponse.access_token,
          role: "CUSTOMER",
        });
        setAuth(res.user, res.access, res.refresh);
        toast.success("Account created successfully with Google!");
        window.location.href = "/customer/orders";
      } catch (error: any) {
        toast.error(error.message || "Google signup failed.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => toast.error("Google sign up cancelled or failed."),
  });

  // Filter categories inside dropdown based on search query
  const filteredCategories = useMemo(() => {
    if (!searchCatQuery.trim()) return rootCategories;
    const q = searchCatQuery.toLowerCase();
    return rootCategories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        (cat.name_am && cat.name_am.includes(q))
    );
  }, [rootCategories, searchCatQuery]);

  // Brand button themes
  const submitButtonClass = isSeller
    ? "bg-gradient-to-r from-[#FF7900] to-[#E66800] hover:from-[#E66800] hover:to-[#CC5C00] text-white shadow-lg shadow-[#FF7900]/25"
    : "bg-gradient-to-r from-[#1261C9] to-[#0D4FA8] hover:from-[#0D4FA8] hover:to-[#0A3D82] text-white shadow-lg shadow-[#1261C9]/25";

  const brandFocusRingClass = isSeller
    ? "focus-visible:ring-2 focus-visible:ring-[#FF7900]/30 focus-visible:border-[#FF7900]"
    : "focus-visible:ring-2 focus-visible:ring-[#1261C9]/30 focus-visible:border-[#1261C9]";

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none w-full">
      {/* Seller Two-Step Progress Bar */}
      {isSeller && (
        <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className={cn("transition-colors", currentStep === 1 ? "text-[#FF7900]" : "text-slate-400")}>
              1. Contact Info
            </span>
            <span className={cn("transition-colors", currentStep === 2 ? "text-[#FF7900]" : "text-slate-400")}>
              2. Store Focus & Security
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#1261C9] to-[#FF7900] transition-all duration-300 rounded-full"
              style={{ width: currentStep === 1 ? "50%" : "100%" }}
            />
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
          
          {/* Step 1: Personal Info & Contact */}
          {(currentStep === 1 || !isSeller) && (
            <div className="flex flex-col gap-4 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300">First name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Abebe"
                          disabled={isLoading}
                          className={`bg-slate-50 dark:bg-slate-950/50 rounded-xl h-11 ${brandFocusRingClass}`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300">Last name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Bikila"
                          disabled={isLoading}
                          className={`bg-slate-50 dark:bg-slate-950/50 rounded-xl h-11 ${brandFocusRingClass}`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300">Email address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        disabled={isLoading}
                        className={`bg-slate-50 dark:bg-slate-950/50 rounded-xl h-11 ${brandFocusRingClass}`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Phone number {isSeller ? "(Required for Merchant KYC)" : "(Optional)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+251 911 234 567"
                        disabled={isLoading}
                        className={`bg-slate-50 dark:bg-slate-950/50 rounded-xl h-11 ${brandFocusRingClass}`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isSeller && (
                <>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300">Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            disabled={isLoading}
                            className={`bg-slate-50 dark:bg-slate-950/50 rounded-xl h-11 ${brandFocusRingClass}`}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300">Confirm password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            disabled={isLoading}
                            className={`bg-slate-50 dark:bg-slate-950/50 rounded-xl h-11 ${brandFocusRingClass}`}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="termsAccepted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-[#1261C9] data-[state=checked]:border-[#1261C9] rounded-md"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-normal text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                            I agree to the{" "}
                            <Link href="/terms" className="text-[#1261C9] font-semibold hover:underline">
                              Terms of Service
                            </Link>{" "}
                            and Privacy Policy
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
          )}
          
          {/* Step 2 (Seller): Store Focus Dropdown, Password & Merchant Terms */}
          {currentStep === 2 && isSeller && (
            <div className="flex flex-col gap-4 animate-in slide-in-from-right-4 fade-in duration-300">
              
              {/* DROPDOWN FOR SELLER CATEGORY FOCUS */}
              <FormField
                control={form.control}
                name="shopFocus"
                render={({ field }) => {
                  const selectedCats = rootCategories.filter((cat) =>
                    selectedRootCats.includes(cat.id)
                  );

                  return (
                    <FormItem className="space-y-2 relative" ref={dropdownRef}>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-[#FF7900]" />
                          <span>Store Category Focus</span>
                        </FormLabel>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {selectedRootCats.length > 0
                            ? `${selectedRootCats.length}/3 selected`
                            : "Select 1 to 3 categories"}
                        </span>
                      </div>

                      {/* Dropdown Trigger Button */}
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen((prev) => !prev)}
                        className={cn(
                          "w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950/50 text-left transition-all flex items-center justify-between gap-2 shadow-xs",
                          isDropdownOpen
                            ? "border-[#FF7900] ring-2 ring-[#FF7900]/20 bg-white dark:bg-slate-900"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        )}
                      >
                        <div className="flex-1 flex flex-wrap items-center gap-1.5 overflow-hidden">
                          {selectedCats.length === 0 ? (
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-2">
                              <span>Choose primary category focus...</span>
                            </span>
                          ) : (
                            selectedCats.map((cat) => (
                              <span
                                key={cat.id}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#FF7900]/10 text-[#FF7900] border border-[#FF7900]/20 dark:bg-[#FF7900]/20 dark:text-orange-300"
                              >
                                <span>{cat.name}</span>
                                <span
                                  role="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const updated = selectedRootCats.filter((id) => id !== cat.id);
                                    setSelectedRootCats(updated);
                                    field.onChange(updated.join(","));
                                  }}
                                  className="hover:bg-[#FF7900]/20 rounded p-0.5 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </span>
                              </span>
                            ))
                          )}
                        </div>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200",
                            isDropdownOpen && "rotate-180 text-[#FF7900]"
                          )}
                        />
                      </button>

                      {/* Dropdown Options Popover */}
                      {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-[#FF7900]/10 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
                          {/* Search Filter in Dropdown */}
                          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={searchCatQuery}
                                onChange={(e) => setSearchCatQuery(e.target.value)}
                                placeholder="Search category focus..."
                                className="w-full h-8 pl-8 pr-3 text-xs bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF7900]"
                                autoFocus
                              />
                            </div>
                          </div>

                          {/* Options List */}
                          <div className="max-h-56 overflow-y-auto p-1.5 space-y-1 scrollbar-none">
                            {filteredCategories.length > 0 ? (
                              filteredCategories.map((cat) => {
                                const isSelected = selectedRootCats.includes(cat.id);
                                return (
                                  <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                      let updated: string[];
                                      if (isSelected) {
                                        updated = selectedRootCats.filter((id) => id !== cat.id);
                                      } else {
                                        if (selectedRootCats.length >= 3) {
                                          toast.error("You can select up to 3 primary categories at registration.");
                                          return;
                                        }
                                        updated = [...selectedRootCats, cat.id];
                                      }
                                      setSelectedRootCats(updated);
                                      field.onChange(updated.join(","));
                                    }}
                                    className={cn(
                                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all",
                                      isSelected
                                        ? "bg-[#FF7900]/10 text-[#FF7900] font-bold dark:bg-[#FF7900]/20 dark:text-orange-300"
                                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                                    )}
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-xs">{cat.name}</span>
                                      {cat.name_am && (
                                        <span className="text-[10px] text-slate-400 font-normal">
                                          {cat.name_am}
                                        </span>
                                      )}
                                    </div>

                                    <div
                                      className={cn(
                                        "w-4 h-4 rounded-md border flex items-center justify-center text-[10px] shrink-0 transition-colors",
                                        isSelected
                                          ? "bg-[#FF7900] border-[#FF7900] text-white"
                                          : "border-slate-300 dark:border-slate-600"
                                      )}
                                    >
                                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                  </button>
                                );
                              })
                            ) : (
                              <div className="p-4 text-center text-xs text-slate-400 font-medium">
                                No matching categories found
                              </div>
                            )}
                          </div>

                          {/* Dropdown Action Footer */}
                          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between">
                            <span className="text-[11px] font-medium text-slate-500">
                              {selectedRootCats.length} selected (max 3)
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsDropdownOpen(false)}
                              className="px-3 py-1 text-xs font-bold rounded-lg bg-[#FF7900] text-white hover:bg-[#E66800] transition-colors"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}

                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300">Create password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        disabled={isLoading}
                        className={`bg-slate-50 dark:bg-slate-950/50 rounded-xl h-11 ${brandFocusRingClass}`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-slate-700 dark:text-slate-300">Confirm password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        disabled={isLoading}
                        className={`bg-slate-50 dark:bg-slate-950/50 rounded-xl h-11 ${brandFocusRingClass}`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-[#FF7900] data-[state=checked]:border-[#FF7900] rounded-md"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-normal text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                        I agree to Merchant Terms & Commission Policy (10% base rate with nationwide escrow)
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>
          )}
          
          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={nextStep}
              className={`w-full h-11 sm:h-12 text-sm font-bold mt-6 rounded-xl transition-all ${submitButtonClass}`}
              disabled={isLoading}
            >
              Next Step: Store Details <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              className={`w-full h-11 sm:h-12 text-sm font-bold mt-6 rounded-xl transition-all ${submitButtonClass}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating account...
                </span>
              ) : (
                `Create ${isSeller ? 'Merchant Seller' : 'Customer'} Account`
              )}
            </Button>
          )}

          {currentStep > 1 && (
            <div className="text-center mt-3">
              <button
                type="button"
                onClick={prevStep}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                ← Back to Contact Info
              </button>
            </div>
          )}
        </form>
      </Form>
      
      {/* Google OAuth (Customer Registration view ONLY) */}
      {!isSeller && (
        <>
          <div className="my-6 flex items-center">
            <Separator className="flex-1 dark:bg-slate-800" />
            <span className="mx-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Or continue with</span>
            <Separator className="flex-1 dark:bg-slate-800" />
          </div>

          <div className="w-full">
            <Button
              variant="outline"
              className="h-11 w-full text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              onClick={() => googleLogin()}
              disabled={isLoading}
            >
              <svg className="mr-2.5 h-4 w-4" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Sign up with Google
            </Button>
          </div>
        </>
      )}

      <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-[#1261C9] hover:underline transition-colors">
          Sign in here
        </Link>
      </p>

    </div>
  );
}
