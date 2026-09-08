"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { 
  User, 
  Lock, 
  Bell, 
  MapPin, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Save, 
  Plus, 
  CheckCircle2, 
  Trash2, 
  RotateCw,
  KeyRound,
  Shield,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [activeTab, setActiveTab] = useState<"profile" | "security" | "addresses" | "notifications">("profile");

  // Profile Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Addresses State
  const { data: addressData, mutate: mutateAddresses } = useSWR("/auth/addresses/", fetcher);
  const addresses: any[] = Array.isArray(addressData) ? addressData : (addressData?.results || []);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addrFullName, setAddrFullName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrCity, setAddrCity] = useState("Addis Ababa");
  const [addrSubCity, setAddrSubCity] = useState("Bole");
  const [addrWoreda, setAddrWoreda] = useState("");
  const [addrHouseNo, setAddrHouseNo] = useState("");
  const [addrLandmark, setAddrLandmark] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Initialize from user state
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setPhoneNumber(user.phone_number || "");
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      const res = await api.patch("/auth/me/", {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
      });

      if (res.data?.user) {
        setUser(res.data.user);
      }
      toast.success("Profile details updated successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.phone_number?.[0] || err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Please provide both current and new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    try {
      setIsChangingPassword(true);
      await api.post("/auth/password/change/", {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to change password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrFullName || !addrPhone || !addrSubCity) {
      toast.error("Please fill in recipient name, phone, and sub-city.");
      return;
    }

    try {
      setIsSavingAddress(true);
      await api.post("/auth/addresses/", {
        full_name: addrFullName,
        phone_number: addrPhone,
        city: addrCity,
        subcity: addrSubCity,
        woreda: addrWoreda,
        house_no: addrHouseNo,
        landmark: addrLandmark,
        is_default: addresses.length === 0,
      });

      toast.success("Delivery address saved!");
      setIsAddressModalOpen(false);
      setAddrFullName("");
      setAddrPhone("");
      setAddrWoreda("");
      setAddrHouseNo("");
      setAddrLandmark("");
      mutateAddresses();
    } catch (err: any) {
      toast.error(err?.response?.data?.phone_number?.[0] || err?.response?.data?.message || "Failed to save address.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await api.delete(`/auth/addresses/${id}/`);
      toast.success("Address removed.");
      mutateAddresses();
    } catch (err) {
      toast.error("Failed to delete address.");
    }
  };

  const initials = user?.first_name 
    ? `${user.first_name[0]}${user.last_name ? user.last_name[0] : ""}`.toUpperCase()
    : (user?.email ? user.email[0].toUpperCase() : "G");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-2xl shadow-inner">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ""}` : (user?.email?.split("@")[0] || "My Account")}
                </h1>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-mono font-bold">
                  <ShieldCheck className="w-3 h-3 mr-1 inline" /> Verified Customer
                </Badge>
              </div>
              <p className="text-xs text-indigo-200 mt-1 font-mono">{user?.email || "customer@ethiomart.com"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-indigo-200 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm border border-white/10 font-mono">
              Country: Ethiopia (ET)
            </span>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "profile"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <User className="w-4 h-4" /> Personal Profile
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "security"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <KeyRound className="w-4 h-4" /> Security & Password
        </button>

        <button
          onClick={() => setActiveTab("addresses")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "addresses"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <MapPin className="w-4 h-4" /> Delivery Addresses
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "notifications"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Bell className="w-4 h-4" /> Notifications
        </button>
      </div>

      {/* Tab 1: Profile Information */}
      {activeTab === "profile" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Update your full name and primary Ethiopian contact number used for courier delivery coordination.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">First Name</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Abebe"
                  className="bg-slate-50/60 dark:bg-slate-950/60 text-xs font-medium h-10 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Last Name</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Kebede"
                  className="bg-slate-50/60 dark:bg-slate-950/60 text-xs font-medium h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address (Immutable)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={user?.email || ""}
                  disabled
                  className="pl-9 bg-slate-100/80 dark:bg-slate-800/80 text-xs font-mono text-slate-500 cursor-not-allowed h-10 rounded-xl"
                />
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Linked to your verified EthioMart security account.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ethiopian Contact Phone (SMS Dispatch Updates)
              </Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0911234567 or +251911234567"
                  className="pl-9 bg-slate-50/60 dark:bg-slate-950/60 text-xs font-mono h-10 rounded-xl"
                />
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">Format: +251 9XX XXX XXX or 09XX XXX XXX</span>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button
                type="submit"
                disabled={isSavingProfile}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 shadow-sm rounded-xl h-10 px-5"
              >
                {isSavingProfile ? <RotateCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === "security" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security & Password</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ensure your account is protected with a strong, complex passphrase.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-5 max-w-lg">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="bg-slate-50/60 dark:bg-slate-950/60 text-xs h-10 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters with numbers & symbols"
                className="bg-slate-50/60 dark:bg-slate-950/60 text-xs h-10 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="bg-slate-50/60 dark:bg-slate-950/60 text-xs h-10 rounded-xl"
                required
              />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 shadow-sm rounded-xl h-10 px-5"
              >
                {isChangingPassword ? <RotateCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Update Password
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Delivery Addresses */}
      {activeTab === "addresses" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ethiopian Delivery Addresses</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Saved addresses for fast, one-tap doorstep courier delivery across Addis Ababa and regional zones.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setIsAddressModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 shadow-sm rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Address
            </Button>
          </div>

          {/* Address Modal */}
          {isAddressModalOpen && (
            <div className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/40 dark:border-indigo-900/40 dark:bg-indigo-950/20 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" /> New Delivery Location
              </h3>

              <form onSubmit={handleCreateAddress} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Recipient Full Name</Label>
                  <Input 
                    value={addrFullName} 
                    onChange={(e) => setAddrFullName(e.target.value)} 
                    placeholder="e.g. Almaz Ayana" 
                    className="text-xs bg-white dark:bg-slate-900" 
                    required 
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Contact Phone</Label>
                  <Input 
                    value={addrPhone} 
                    onChange={(e) => setAddrPhone(e.target.value)} 
                    placeholder="+251 9XX XXX XXX" 
                    className="text-xs bg-white dark:bg-slate-900 font-mono" 
                    required 
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">City</Label>
                  <Input 
                    value={addrCity} 
                    onChange={(e) => setAddrCity(e.target.value)} 
                    placeholder="Addis Ababa" 
                    className="text-xs bg-white dark:bg-slate-900" 
                    required 
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Sub-City / Zone</Label>
                  <Input 
                    value={addrSubCity} 
                    onChange={(e) => setAddrSubCity(e.target.value)} 
                    placeholder="e.g. Bole, Kirkos, Yeka, Nifas Silk" 
                    className="text-xs bg-white dark:bg-slate-900" 
                    required 
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Woreda / Kebele</Label>
                  <Input 
                    value={addrWoreda} 
                    onChange={(e) => setAddrWoreda(e.target.value)} 
                    placeholder="e.g. Woreda 03" 
                    className="text-xs bg-white dark:bg-slate-900" 
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">House / Apt No.</Label>
                  <Input 
                    value={addrHouseNo} 
                    onChange={(e) => setAddrHouseNo(e.target.value)} 
                    placeholder="e.g. House #142" 
                    className="text-xs bg-white dark:bg-slate-900" 
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs">Nearby Landmark / Delivery Instructions</Label>
                  <Input 
                    value={addrLandmark} 
                    onChange={(e) => setAddrLandmark(e.target.value)} 
                    placeholder="e.g. Near Medhanialem Mall, behind Edna Mall" 
                    className="text-xs bg-white dark:bg-slate-900" 
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsAddressModalOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSavingAddress} 
                    size="sm" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                  >
                    {isSavingAddress ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Address
                  </Button>
                </div>
              </form>
            </div>
          )}

          {addresses.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500 space-y-2">
              <MapPin className="w-8 h-8 mx-auto text-slate-400" />
              <p className="font-bold text-slate-800 dark:text-slate-200">No delivery addresses saved yet</p>
              <p>Add your home or office address for fast checkout with Ethiopian couriers.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div 
                  key={addr.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex justify-between items-start"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{addr.full_name}</span>
                      {addr.is_default && (
                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 text-[9px] font-bold">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-mono">{addr.phone_number}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {addr.subcity}, {addr.city} {addr.woreda ? `• Woreda ${addr.woreda}` : ""} {addr.house_no ? `• House ${addr.house_no}` : ""}
                    </p>
                    {addr.landmark && (
                      <p className="text-[11px] text-slate-400 italic">Landmark: {addr.landmark}</p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="h-8 w-8 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Notifications */}
      {activeTab === "notifications" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Communication & Notification Preferences</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Control which SMS notifications and order alerts you receive.
            </p>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Order & Dispatch Status SMS</span>
                <p className="text-[11px] text-slate-500">Receive real-time courier tracking and delivery PIN codes via Ethiopian SMS.</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Escrow & Refund Confirmation Emails</span>
                <p className="text-[11px] text-slate-500">Detailed receipt of Chapa / Telebirr transaction settlements and invoices.</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Promotional Deals & Flash Sales</span>
                <p className="text-[11px] text-slate-500">Alerts when saved wishlist items go on discount or holiday promotions.</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
