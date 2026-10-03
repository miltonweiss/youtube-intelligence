"use client";

import { motion } from "framer-motion";
import { Globe, Library, Link2 } from "lucide-react";
import { WORKSPACES } from "./workspaces";

const ICONS = {
  single: Link2,
  library: Library,
};

const pillTransition = {
  type: "spring",
  stiffness: 500,
  damping: 38,
};

const linkClassName =
  "relative flex min-h-9 w-full items-center gap-3 rounded-2xl px-3 py-1.5 text-left text-sm font-medium outline-none transition-transform hover:bg-default/40 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/40";

function GitHubIcon() {
  return (
    <svg aria-hidden="true" className="size-4 shrink-0" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8" />
    </svg>
  );
}

export default function WorkspaceNav({ activeKey, onChange, siteUrl, repoUrl }) {
  return (
    <nav aria-label="Workspaces" className="relative flex flex-col gap-0.5">
      <p className="px-3 py-1.5 text-sm font-semibold tracking-tight text-muted">
        Read-the-Video
      </p>
      {WORKSPACES.map((workspace) => {
        const isActive = workspace.key === activeKey;
        const Icon = ICONS[workspace.key];

        return (
          <button
            key={workspace.key}
            type="button"
            aria-current={isActive ? "page" : undefined}
            className={`${linkClassName} data-[inactive=true]:hover:bg-default/40`}
            data-inactive={!isActive || undefined}
            onClick={() => onChange(workspace.key)}
          >
            {isActive ? (
              <motion.span
                layoutId="workspace-nav-pill"
                className="absolute inset-0 rounded-2xl bg-default"
                transition={pillTransition}
              />
            ) : null}
            <Icon aria-hidden="true" className="relative z-10 size-4 shrink-0" />
            <span className="relative z-10">{workspace.navLabel}</span>
          </button>
        );
      })}

      {siteUrl || repoUrl ? (
        <div className="mt-1 flex flex-col gap-0.5 border-t border-border pt-1.5">
          {siteUrl ? (
            <a
              className={linkClassName}
              href={siteUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Globe aria-hidden="true" className="size-4 shrink-0" />
              <span>miltonweiss</span>
            </a>
          ) : null}
          {repoUrl ? (
            <a
              aria-label="GitHub"
              className={linkClassName}
              href={repoUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <GitHubIcon />
              <span>GitHub</span>
            </a>
          ) : null}
        </div>
      ) : null}
    </nav>
  );
}
