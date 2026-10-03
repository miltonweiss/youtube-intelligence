"use client";

import { Button, Drawer, Link, Separator, useOverlayState } from "@heroui/react";
import { motion } from "framer-motion";
import { Globe, Menu } from "lucide-react";
import { getWorkspace } from "./workspaces";
import WorkspaceHeader from "./WorkspaceHeader";
import WorkspaceNav from "./WorkspaceNav";

const SITE_URL = "https://miltonweiss.de";
const REPO_URL = "https://github.com/miltonweiss/youtube-intelligence";
const sidebarClass = "rounded-2xl p-1.5 shadow-lg backdrop-blur";
const badgeClass = "rounded-2xl border border-border p-1.5 shadow-lg backdrop-blur";

const sidebarTransition = {
  type: "spring",
  stiffness: 500,
  damping: 38,
};

export default function AppShell({
  activeWorkspace,
  onWorkspaceChange,
  hideHeader = false,
  heroLayout = false,
  children,
}) {
  const workspace = getWorkspace(activeWorkspace);
  const drawer = useOverlayState();

  function handleWorkspaceChange(key) {
    onWorkspaceChange(key);
    drawer.close();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Drawer state={drawer}>
        <Button
          aria-label="Open navigation"
          className="fixed top-4 left-4 z-20 md:hidden"
          isIconOnly
          variant="ghost"
        >
          <Menu className="size-5" />
        </Button>
        <Drawer.Backdrop>
          <Drawer.Content placement="left">
            <Drawer.Dialog>
              <Drawer.CloseTrigger />
              <Drawer.Header>
                <Drawer.Heading>Read-the-Video</Drawer.Heading>
              </Drawer.Header>
              <Drawer.Body>
                <WorkspaceNav
                  activeKey={activeWorkspace}
                  onChange={handleWorkspaceChange}
                  siteUrl={SITE_URL}
                  repoUrl={REPO_URL}
                />
              </Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>

      <motion.aside
        className={`fixed left-4 z-20 hidden w-max md:block ${sidebarClass}`}
        initial={false}
        animate={{
          top: heroLayout ? "50%" : "2.5rem",
          y: heroLayout ? "-50%" : 0,
        }}
        transition={sidebarTransition}
      >
        <WorkspaceNav
          activeKey={activeWorkspace}
          onChange={onWorkspaceChange}
          siteUrl={SITE_URL}
          repoUrl={REPO_URL}
        />
      </motion.aside>

      <main
        className={`flex min-h-screen justify-center px-4 pt-16 pb-20 md:pt-10 md:pb-10 ${
          heroLayout ? "items-center" : "items-start"
        }`}
      >
        <div
          className={`mx-auto flex w-full max-w-3xl flex-col gap-6 ${
            heroLayout
              ? "min-h-[calc(100vh-8rem)] justify-center overflow-y-auto py-8 md:min-h-[calc(100vh-5rem)]"
              : "min-h-[85vh] max-h-[90vh] overflow-y-auto"
          }`}
        >
          {!hideHeader ? (
            <>
              <WorkspaceHeader workspace={workspace} />
              <Separator />
            </>
          ) : null}
          {children}
        </div>
      </main>

      <div
        className={`fixed bottom-4 left-4 z-30 flex items-center gap-0.5 md:hidden ${badgeClass}`}
      >
        <Link
          className="flex min-h-9 items-center gap-3 rounded-2xl px-3 py-1.5 text-sm font-medium outline-none transition-transform hover:bg-default/40"
          href={SITE_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Globe aria-hidden="true" className="size-4 shrink-0" />
          miltonweiss
        </Link>
        <Link
          aria-label="GitHub"
          className="flex size-9 items-center justify-center rounded-2xl text-muted outline-none transition-transform hover:bg-default/40"
          href={REPO_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          <svg aria-hidden="true" className="size-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
