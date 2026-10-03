"use client";

import { Typography } from "@heroui/react";

export default function WorkspaceHeader({ workspace }) {
  if (!workspace) return null;

  return (
    <div className="flex flex-col gap-2">
      <Typography.Heading className="text-balance" level={2}>
        {workspace.heading}
      </Typography.Heading>
      <Typography.Paragraph className="max-w-2xl text-muted">
        {workspace.description}
      </Typography.Paragraph>
    </div>
  );
}
