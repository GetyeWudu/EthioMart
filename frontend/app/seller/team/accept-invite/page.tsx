"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/features/auth/services/auth-service";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Warehouse, ShieldAlert } from "lucide-react";

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing invitation token");
      router.push("/login");
      return;
    }

    authService.getInviteDetails(token)
      .then((data) => {
        setInviteData(data);
      })
      .catch((err) => {
        toast.error(err.message || "Invitation is invalid or has expired");
        router.push("/login");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!password) {
      toast.error("Please set a password");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.acceptInvite({
        token,
        password,
        first_name: firstName,
        last_name: lastName
      });
      setAuth(response.user, response.access, response.refresh);
      toast.success("Welcome to the team!");
      router.push("/seller/inventory");
    } catch (err: any) {
      toast.error(err.message || "Failed to accept invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!inviteData) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Accept Invitation
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You have been invited to join <span className="font-bold text-indigo-600">{inviteData.vendor_name}</span>
          </p>
        </div>

        <div className="bg-indigo-50 p-4 rounded-lg flex items-start gap-4">
          <ShieldAlert className="w-5 h-5 text-indigo-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-indigo-900">Role: {inviteData.role}</p>
            <p className="text-xs text-indigo-700 flex items-center gap-1 mt-1">
              <Warehouse className="w-3 h-3" />
              {inviteData.assigned_facility_name}
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <Input type="email" value={inviteData.email} disabled className="mt-1 bg-gray-100 cursor-not-allowed" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <Input 
                  type="text" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  required 
                  className="mt-1" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <Input 
                  type="text" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  required 
                  className="mt-1" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Create Password</label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="mt-1" 
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Accept & Join Workspace
          </Button>
        </form>
      </div>
    </div>
  );
}
