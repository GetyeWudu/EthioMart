"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Shield, 
  Globe, 
  Terminal, 
  Key, 
  ShieldAlert, 
  AlertTriangle, 
  Save, 
  Loader2, 
  CheckCircle2, 
  Lock, 
  CreditCard,
  Building2,
  Clock
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function AdminSettingsPage() {
  const { data: publicData, mutate: mutatePublic } = useSWR('/settings/public/', fetcher);
  const { data: adminSettingsData, mutate: mutateAdmin } = useSWR('/settings/', fetcher);

  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Form states initialized with seeded defaults
  const [siteName, setSiteName] = useState("GechExpress Platform");
  const [supportEmail, setSupportEmail] = useState("admin@gechexpress.com");
  const [baseCommission, setBaseCommission] = useState("10.0");
  const [escrowHoldHours, setEscrowHoldHours] = useState("48");
  const [freeShippingMin, setFreeShippingMin] = useState("2500.00");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [enforce2fa, setEnforce2fa] = useState(true);
  const [strictPasswords, setStrictPasswords] = useState(true);
  const [chapaEnv, setChapaEnv] = useState("test");

  // Sync state once data loads
  React.useEffect(() => {
    if (publicData?.settings) {
      const s = publicData.settings;
      if (s.platform_name) setSiteName(s.platform_name);
      if (s.support_email) setSupportEmail(s.support_email);
      if (s.base_commission_rate !== undefined) setBaseCommission(String(s.base_commission_rate));
      if (s.escrow_hold_hours !== undefined) setEscrowHoldHours(String(s.escrow_hold_hours));
      if (s.free_shipping_minimum_etb !== undefined) setFreeShippingMin(String(s.free_shipping_minimum_etb));
      if (s.maintenance_mode !== undefined) setMaintenanceMode(Boolean(s.maintenance_mode));
      if (s.enforce_seller_2fa !== undefined) setEnforce2fa(Boolean(s.enforce_seller_2fa));
      if (s.strict_passwords !== undefined) setStrictPasswords(Boolean(s.strict_passwords));
      if (s.chapa_environment) setChapaEnv(s.chapa_environment);
    }
  }, [publicData]);

  const handleSaveSetting = async (key: string, value: any, description?: string) => {
    setSavingKey(key);
    try {
      await api.patch(`/settings/${key}/`, {
        value: String(value),
        description: description || `Updated ${key}`,
      });
      toast.success(`Setting '${key}' saved successfully!`);
      mutatePublic();
      mutateAdmin();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || `Failed to update ${key}.`);
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveAllPlatform = async () => {
    setIsSavingAll(true);
    try {
      await Promise.all([
        handleSaveSetting("platform_name", siteName),
        handleSaveSetting("support_email", supportEmail),
        handleSaveSetting("base_commission_rate", baseCommission),
        handleSaveSetting("escrow_hold_hours", escrowHoldHours),
        handleSaveSetting("free_shipping_minimum_etb", freeShippingMin),
        handleSaveSetting("maintenance_mode", maintenanceMode),
      ]);
      toast.success("Platform configuration updated successfully!");
    } catch (e) {
      // Handled in individual calls
    } finally {
      setIsSavingAll(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <Settings className="h-7 w-7" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Global Platform Settings</h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
              Production Active
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure financial rules, escrow dispute hold windows, Chapa payment rails, and platform security policies.
          </p>
        </div>
      </div>

      <Tabs defaultValue="platform" className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 mb-6 border border-slate-200 dark:border-slate-800 flex flex-wrap w-full sm:w-fit gap-1 rounded-xl">
          <TabsTrigger value="platform" className="text-xs font-bold gap-1.5 py-2 px-4 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-xs">
            <Globe className="h-3.5 w-3.5" /> Platform Configuration
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs font-bold gap-1.5 py-2 px-4 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-xs">
            <Shield className="h-3.5 w-3.5" /> Security & Access
          </TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs font-bold gap-1.5 py-2 px-4 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-xs">
            <CreditCard className="h-3.5 w-3.5" /> Chapa Payment Gateway
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Platform Configuration */}
        <TabsContent value="platform" className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-600" />
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Marketplace Core Rules</h2>
            </div>
            
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="siteName" className="font-bold text-slate-700 dark:text-slate-300">Site Name</Label>
                <Input 
                  id="siteName" 
                  value={siteName} 
                  onChange={(e) => setSiteName(e.target.value)} 
                  className="rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="supportEmail" className="font-bold text-slate-700 dark:text-slate-300">Global Support Email</Label>
                <Input 
                  id="supportEmail" 
                  type="email" 
                  value={supportEmail} 
                  onChange={(e) => setSupportEmail(e.target.value)} 
                  className="rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="baseCommission" className="font-bold text-slate-700 dark:text-slate-300">Base Commission Rate (%)</Label>
                <Input 
                  id="baseCommission" 
                  type="number" 
                  step="0.1" 
                  value={baseCommission} 
                  onChange={(e) => setBaseCommission(e.target.value)} 
                  className="rounded-xl border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                />
                <p className="text-[11px] text-slate-400">Default cut taken on seller sub-order dispatch.</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="currency" className="font-bold text-slate-700 dark:text-slate-300">Default Marketplace Currency</Label>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Immutable
                  </span>
                </div>
                <Input 
                  id="currency" 
                  value="ETB (Ethiopian Birr)" 
                  disabled 
                  className="rounded-xl bg-slate-50 dark:bg-slate-950 cursor-not-allowed opacity-80 font-mono font-bold text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-400">All escrow settlements and payouts are executed in ETB.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="escrowHold" className="font-bold text-slate-700 dark:text-slate-300">Escrow Dispute Hold Window (Hours)</Label>
                <Input 
                  id="escrowHold" 
                  type="number" 
                  value={escrowHoldHours} 
                  onChange={(e) => setEscrowHoldHours(e.target.value)} 
                  className="rounded-xl border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                />
                <p className="text-[11px] text-slate-400">Delivery inspection dispute window (defaults to 48 Hours).</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="freeShipping" className="font-bold text-slate-700 dark:text-slate-300">Free Shipping Minimum Threshold (ETB)</Label>
                <Input 
                  id="freeShipping" 
                  type="number" 
                  value={freeShippingMin} 
                  onChange={(e) => setFreeShippingMin(e.target.value)} 
                  className="rounded-xl border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                />
                <p className="text-[11px] text-slate-400">Cart subtotal qualifying for free doorstep shipping.</p>
              </div>
            </div>

            {/* Maintenance Mode Toggle */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between p-4 rounded-xl border border-rose-200 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-rose-700 dark:text-rose-400">Storefront Maintenance Mode</Label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md">
                    Take the customer storefront offline for database maintenance. Admins retain full dashboard access.
                  </p>
                </div>
                <Switch 
                  id="maintenance-mode" 
                  checked={maintenanceMode} 
                  onCheckedChange={(val) => setMaintenanceMode(val)}
                  className="data-[state=checked]:bg-rose-600" 
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex justify-end">
              <Button 
                onClick={handleSaveAllPlatform}
                disabled={isSavingAll}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 shadow-sm"
              >
                {isSavingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Platform Configuration
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Security & Access Policies */}
        <TabsContent value="security" className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-indigo-600" />
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Security & Access Policies</h2>
            </div>
            
            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                <div className="space-y-0.5">
                  <Label className="font-bold text-slate-900 dark:text-white">Enforce Merchant Two-Factor Authentication (2FA)</Label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Require all verified sellers to enable TOTP 2FA before requesting payouts.</p>
                </div>
                <Switch 
                  checked={enforce2fa} 
                  onCheckedChange={(val) => {
                    setEnforce2fa(val);
                    handleSaveSetting("enforce_seller_2fa", val);
                  }} 
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                <div className="space-y-0.5">
                  <Label className="font-bold text-slate-900 dark:text-white">Strict Password Complexity Policy</Label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Require 12+ characters, alphanumeric, and symbol complexity across all roles.</p>
                </div>
                <Switch 
                  checked={strictPasswords} 
                  onCheckedChange={(val) => {
                    setStrictPasswords(val);
                    handleSaveSetting("strict_passwords", val);
                  }} 
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Chapa Gateway & Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-indigo-600" />
                <h2 className="font-bold text-slate-900 dark:text-white text-sm">Chapa Payment Gateway & Transfer API</h2>
              </div>
              <Badge className={chapaEnv === "live" ? "bg-rose-100 text-rose-800 border-rose-200" : "bg-amber-100 text-amber-800 border-amber-200"}>
                Mode: {chapaEnv.toUpperCase()}
              </Badge>
            </div>
            
            <div className="p-6 space-y-5 text-xs">
              {/* Sandbox / Live Safeguard Alert Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                chapaEnv === "live" 
                  ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300"
                  : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300"
              }`}>
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-sm">
                    {chapaEnv === "live" ? "⚠️ LIVE PRODUCTION DISBURSEMENT MODE ACTIVE" : "🧪 CHAPA TEST / SANDBOX MODE"}
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    {chapaEnv === "live" 
                      ? "Transfers dispatched via /v1/transfers will debit real platform funds and disburse real ETB to seller bank accounts and Telebirr."
                      : "Transactions and seller payout disbursements are simulated using Chapa Sandbox test keys (CHASECK_TEST-...). No real funds are moved."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-700 dark:text-slate-300">Gateway Environment Mode</Label>
                  <select 
                    value={chapaEnv}
                    onChange={(e) => {
                      const newEnv = e.target.value;
                      setChapaEnv(newEnv);
                      handleSaveSetting("chapa_environment", newEnv);
                    }}
                    className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold px-3 text-slate-700 dark:text-slate-300"
                  >
                    <option value="test">Test Mode (Sandbox: CHASECK_TEST-...)</option>
                    <option value="live">Live Production (CHASECK_LIVE-...)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-700 dark:text-slate-300">Webhook Cryptographic Verification</Label>
                  <div className="h-9 px-3 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/30 dark:border-emerald-900/40 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> HMAC SHA-256 Webhook Active
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
