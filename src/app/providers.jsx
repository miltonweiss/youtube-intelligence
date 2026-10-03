"use client";

import { ToastProvider } from "@heroui/react";

export default function Providers({ children }) {
  return (
    <>
      <ToastProvider placement="bottom-right" />
      {children}
    </>
  );
}
