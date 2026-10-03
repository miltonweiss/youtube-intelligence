"use client";

import { useEffect } from "react";
import AppShell from "./components/ui/AppShell";
import TranscriptPageContent from "./components/TranscriptPageContent";
import LibraryPageContent from "./components/LibraryPageContent";
import { setSessionValue, useSessionValue } from "./components/ui/session";

export default function Home() {
  const activeTab = useSessionValue("activeTab", "single");
  const isExtractWorkspace = activeTab === "single" || activeTab === "playlist";

  useEffect(() => {
    if (activeTab === "playlist") {
      setSessionValue("activeTab", "single");
    } else if (activeTab === "Chat") {
      setSessionValue("activeTab", "library");
    }
  }, [activeTab]);

  const resolvedTab =
    activeTab === "playlist"
      ? "single"
      : activeTab === "Chat"
      ? "library"
      : activeTab;

  return (
    <AppShell
      activeWorkspace={resolvedTab}
      hideHeader
      heroLayout
      onWorkspaceChange={(key) => setSessionValue("activeTab", key)}
    >
      {isExtractWorkspace && <TranscriptPageContent />}
      {resolvedTab === "library" && <LibraryPageContent />}
    </AppShell>
  );
}
