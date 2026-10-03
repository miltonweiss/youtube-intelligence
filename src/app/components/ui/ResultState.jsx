"use client";

import { EmptyState, Spinner, Typography } from "@heroui/react";

export function LoadingFeedback({ title, description }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center" role="status">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Spinner color="current" size="sm" />
        <span>{title}</span>
      </div>
      {description ? <p className="text-xs text-muted">{description}</p> : null}
    </div>
  );
}

export function InlineFeedback({ description }) {
  if (!description) return null;

  return (
    <p className="text-center text-xs text-danger" role="alert">
      {description}
    </p>
  );
}

export function EmptyHint({ title, children }) {
  return (
    <EmptyState className="flex flex-col items-center gap-2 py-2 text-center">
      {title ? (
        <Typography.Paragraph className="text-foreground">{title}</Typography.Paragraph>
      ) : null}
      <Typography.Paragraph className="text-muted">{children}</Typography.Paragraph>
    </EmptyState>
  );
}
