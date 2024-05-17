"use client";

import { SDKProvider } from '@tma.js/sdk-react';
import { Toaster } from '~/components/ui/toaster';
import UserProvider from "~/components/userProvider";
import "~/styles/globals.css";

import { TRPCReactProvider } from "~/trpc/react";


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TRPCReactProvider>
          <SDKProvider>
            <UserProvider>
              {children}
              <Toaster />
            </UserProvider>
          </SDKProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
