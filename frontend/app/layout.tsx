import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EthioMart",
  description: "Ethiopia's Premier Multi-Vendor Marketplace — Shop Local, Support Ethiopia, Build the Future.",
  icons: {
    icon: "/logo/abukii.png",
    apple: "/logo/abukii.png",
  },
};

import { ThemeProvider } from "@/components/theme-provider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Use a mock client ID or environment variable
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "mock-google-client-id-for-dev";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-full flex flex-col antialiased`}>
        <GoogleOAuthProvider clientId={googleClientId}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
