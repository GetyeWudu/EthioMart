"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useGoogleLogin } from "@react-oauth/google";
import { authService } from "@/features/auth/services/auth-service";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  rememberMe: z.boolean().default(false).optional(),
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const handleRedirect = (role: string, isStaff: boolean) => {
    let target = "/customer/orders";
    if (redirectUrl) {
      target = redirectUrl;
    } else if (role === "ADMIN" || isStaff) {
      target = "/admin";
    } else if (role === "SELLER") {
      target = "/seller";
    }
    window.location.href = target;
  };

  const mergeCartAndWishlist = async () => {
    try {
      await useCartStore.getState().mergeCart();
      await useCartStore.getState().initializeCart();
      const { useWishlistStore } = await import("@/stores/wishlist-store");
      await useWishlistStore.getState().syncGuestWishlist();
      await useWishlistStore.getState().fetchWishlistIds();
    } catch (e) {
      console.error("Cart/Wishlist merge failed:", e);
    }
  };

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const res = await authService.login({
        email: values.email,
        password: values.password,
      });

      setAuth(res.user, res.access, res.refresh);
      await mergeCartAndWishlist();
      toast.success(`Welcome back, ${res.user.first_name || res.user.email}!`);
      handleRedirect(res.user.role, res.user.is_staff);
    } catch (error: any) {
      toast.error(error.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        // Exchange access token or id_token
        const res = await authService.googleAuth({
          id_token: tokenResponse.access_token,
          role: "CUSTOMER",
        });
        setAuth(res.user, res.access, res.refresh);
        await mergeCartAndWishlist();
        toast.success("Successfully signed in with Google!");
        handleRedirect(res.user.role, res.user.is_staff);
      } catch (error: any) {
        toast.error(error.message || "Google sign in failed.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => toast.error("Google Login cancelled or failed."),
  });

  return (
    <div className="w-full max-w-[440px] space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Sign in to your GechExpress account
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-lg shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 dark:text-slate-300">Email address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="name@example.com" 
                      disabled={isLoading} 
                      className="bg-slate-50 dark:bg-slate-900/50"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-slate-700 dark:text-slate-300">Password</FormLabel>
                    <Link href="/reset-password" className="text-sm font-medium text-primary hover:underline transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      disabled={isLoading} 
                      className="bg-slate-50 dark:bg-slate-900/50"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal text-slate-600 dark:text-slate-400 cursor-pointer">
                      Remember me
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full h-12 text-base font-medium mt-6 shadow-md" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign in to account"
              )}
            </Button>
          </form>
        </Form>

        <div className="my-8 flex items-center">
          <Separator className="flex-1 dark:bg-slate-800" />
          <span className="mx-4 text-xs font-medium uppercase tracking-wider text-slate-400">Or continue with</span>
          <Separator className="flex-1 dark:bg-slate-800" />
        </div>

        <div className="w-full">
          <Button variant="outline" className="h-12 w-full font-medium" onClick={() => googleLogin()} disabled={isLoading}>
            <svg className="mr-3 h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            Sign in with Google
          </Button>
        </div>
        
        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline transition-colors">
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );
}
