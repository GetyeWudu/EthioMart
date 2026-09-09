"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/features/auth/services/auth-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Lock,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Request Reset State (when no token)
  const [email, setEmail] = useState("");
  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Confirm Reset State (when token is present)
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [isConfirmSuccess, setIsConfirmSuccess] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Handle requesting the reset link
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setRequestError("Please enter a valid email address.");
      return;
    }

    setIsRequestLoading(true);
    setRequestError(null);

    try {
      await authService.requestPasswordReset(email.trim());
      setIsRequestSent(true);
      toast.success("Reset link sent! Please check your email inbox.");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        "Unable to send reset email. Please check the address and try again.";
      setRequestError(msg);
      toast.error(msg);
    } finally {
      setIsRequestLoading(false);
    }
  };

  // Handle submitting the new password using the token
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmError(null);

    if (newPassword.length < 8) {
      setConfirmError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmError("Passwords do not match. Please re-enter.");
      return;
    }

    if (!token) {
      setConfirmError("Invalid or missing reset token.");
      return;
    }

    setIsConfirmLoading(true);

    try {
      await authService.confirmPasswordReset({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setIsConfirmSuccess(true);
      toast.success("Password reset successfully! You can now log in.");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        "The reset link is invalid or has expired. Please request a new one.";
      setConfirmError(msg);
      toast.error(msg);
    } finally {
      setIsConfirmLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // VIEW 1: Token Present -> Confirm New Password View
  // --------------------------------------------------------------------------
  if (token) {
    if (isConfirmSuccess) {
      return (
        <div className="w-full max-w-md space-y-6">
          <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-lg dark:border-emerald-900/50 dark:bg-slate-950">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/80">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Password Reset Complete!
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Your password has been securely updated. You can now sign in to your EthioMart account with your new password.
            </p>
            <Button
              onClick={() => router.push("/login")}
              className="mt-6 w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90"
            >
              Sign In to EthioMart
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Set New Password
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Please enter and confirm your new secure password below.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          {confirmError && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{confirmError}</span>
            </div>
          )}

          <form onSubmit={handleConfirmReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isConfirmLoading}
                  required
                  className="pr-10 bg-slate-50 dark:bg-slate-900/50"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isConfirmLoading}
                  required
                  className="pr-10 bg-slate-50 dark:bg-slate-900/50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isConfirmLoading}
              className="w-full h-11 text-base font-semibold mt-4"
            >
              {isConfirmLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                "Save New Password"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          <Link
            href="/reset-password"
            className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Request a new reset link
          </Link>
        </p>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // VIEW 2: No Token -> Request Password Reset Email View
  // --------------------------------------------------------------------------
  if (isRequestSent) {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
            <Mail className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Check Your Email
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            We have sent a password reset link to:
          </p>
          <p className="mt-1 font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 py-1 px-3 rounded-md inline-block text-sm">
            {email}
          </p>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Click the link in the email to set your new password. If you don&apos;t see the email within a few minutes, please check your spam or junk folder.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsRequestSent(false);
                setEmail("");
              }}
              className="w-full h-10 text-sm font-medium"
            >
              Send to a different email
            </Button>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline mt-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Reset Password
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {requestError && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{requestError}</span>
          </div>
        )}

        <form onSubmit={handleRequestReset} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isRequestLoading}
                required
                className="bg-slate-50 dark:bg-slate-900/50"
                autoFocus
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isRequestLoading}
            className="w-full h-11 text-base font-semibold mt-4"
          >
            {isRequestLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Reset Link...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Remember your password?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md p-8 text-center flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-slate-500">Loading reset password...</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
