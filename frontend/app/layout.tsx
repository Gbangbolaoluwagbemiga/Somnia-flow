import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Web3Provider } from "@/contexts/web3-context";
import { SmartAccountProvider } from "@/contexts/smart-account-context";
import { DelegationProvider } from "@/contexts/delegation-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { SomniaStreamsProvider } from "@/contexts/somnia-streams-context";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/toaster";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { AppKit } from "@/lib/web3/reown-config";
import { FarcasterSDKProvider } from "@/components/farcaster-sdk-provider";

export const metadata: Metadata = {
  title: "SecureFlow - Trustless Escrow on Somnia",
  description:
    "Trustless payments with transparent milestones powered by Somnia Data Streams",
  generator: "SecureFlow",
  manifest: "/manifest.json",
  icons: {
    icon: "/secureflow-favicon.svg?v=2",
    apple: "/secureflow-favicon.svg?v=2",
    shortcut: "/secureflow-favicon.svg?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Suppress AppKit localhost:8545 errors - these are harmless initialization errors */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress AppKit's localhost:8545 connection errors
              (function() {
                const originalError = console.error;
                console.error = function(...args) {
                  const errorString = String(args[0] || '');
                  if (
                    errorString.includes('localhost:8545') ||
                    errorString.includes('ERR_CONNECTION_REFUSED') ||
                    errorString.includes('JsonRpcProvider failed to detect network')
                  ) {
                    // Silently ignore - these are expected during AppKit initialization
                    return;
                  }
                  originalError.apply(console, args);
                };
                
                // Also intercept fetch requests to localhost:8545
                const originalFetch = window.fetch;
                window.fetch = function(...args) {
                  const url = args[0];
                  if (typeof url === 'string' && url.includes('localhost:8545')) {
                    return Promise.reject(new Error('Suppressed localhost:8545 request'));
                  }
                  return originalFetch.apply(window, args);
                };
                
                // Intercept XMLHttpRequest to localhost:8545
                const originalOpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                  if (typeof url === 'string' && url.includes('localhost:8545')) {
                    this.addEventListener('error', function(e) {
                      e.stopImmediatePropagation();
                    }, true);
                  }
                  return originalOpen.apply(this, [method, url, ...rest]);
                };
              })();
              console.log('[AppKit] Script loaded in head');
            `,
          }}
        />
        <link
          rel="icon"
          href="/secureflow-favicon.svg?v=2"
          type="image/svg+xml"
        />
        <link rel="apple-touch-icon" href="/secureflow-favicon.svg?v=2" />
        <link rel="manifest" href="/manifest.json" />

        {/* Farcaster Mini App Embed Metadata */}
        <meta
          name="fc:miniapp"
          content='{
          "version":"next",
          "imageUrl":"https://secure-flow-base.vercel.app/secureflow-favicon.svg?v=2",
          "button":{
            "title":"Launch SecureFlow",
            "action":{
              "type":"launch_miniapp",
              "name":"SecureFlow",
              "url":"https://secure-flow-base.vercel.app"
            }
          }
        }'
        />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FarcasterSDKProvider>
            <AppKit>
              <Suspense fallback={<div>Loading...</div>}>
                <Web3Provider>
                  <SomniaStreamsProvider>
                    <DelegationProvider>
                      <SmartAccountProvider>
                        <NotificationProvider>
                          <Navbar />
                          <main className="pt-16">{children}</main>
                          <Toaster />
                        </NotificationProvider>
                      </SmartAccountProvider>
                    </DelegationProvider>
                  </SomniaStreamsProvider>
                </Web3Provider>
              </Suspense>
            </AppKit>
          </FarcasterSDKProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
