"use client";

import {
  Accordion,
  Button,
  Chip,
  Link,
  ScrollShadow,
  Tooltip,
} from "@heroui/react";
import { ChevronDown, Copy } from "lucide-react";
import { copyText } from "./ui/clipboard";

function getTranscriptStatus(transcript) {
  if (transcript === null) return "loading";
  if (Array.isArray(transcript) && transcript.length > 0) return "success";
  if (transcript?.message) return "error";
  if (Array.isArray(transcript) && transcript.length === 0) return "empty";
  return "unknown";
}

function getFullText(transcript) {
  if (Array.isArray(transcript) && transcript.length > 0) {
    return transcript.map((item) => item.text).join(" ");
  }
  return null;
}

function getErrorText(transcript) {
  if (transcript?.message) return transcript.message;
  return "No transcript found.";
}

function statusChip(status) {
  if (status === "loading") {
    return { color: "default", label: "Fetching" };
  }
  if (status === "success") {
    return { color: "success", label: "Ready" };
  }
  if (status === "error" || status === "empty" || status === "unknown") {
    return { color: "danger", label: "Unavailable" };
  }
  return { color: "default", label: status };
}

function VideoItem({ videoId, transcript }) {
  const status = getTranscriptStatus(transcript);
  const fullText = getFullText(transcript);
  const chip = statusChip(status);

  return (
    <Accordion.Item id={videoId}>
      <Accordion.Heading>
        <Accordion.Trigger>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Chip color={chip.color} size="sm" variant="soft">
              <Chip.Label>{chip.label}</Chip.Label>
            </Chip>
            <span className="truncate text-sm font-medium">{videoId}</span>
          </div>
          <Accordion.Indicator>
            <ChevronDown />
          </Accordion.Indicator>
        </Accordion.Trigger>
      </Accordion.Heading>
      <Accordion.Panel>
        <Accordion.Body className="flex flex-col gap-3">
          <Link
            href={`https://youtube.com/watch?v=${videoId}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            Open on YouTube
            <Link.Icon />
          </Link>
          {status === "loading" ? (
            <p className="text-sm text-muted">Fetching transcript…</p>
          ) : null}
          {status === "success" ? (
            <>
              <div className="flex justify-end">
                <Tooltip>
                  <Tooltip.Trigger>
                    <Button
                      size="sm"
                      variant="secondary"
                      onPress={() => copyText(fullText, "Transcript copied")}
                    >
                      <Copy className="size-4" />
                      Copy
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>Copy this transcript</Tooltip.Content>
                </Tooltip>
              </div>
              <ScrollShadow className="max-h-72">
                <p className="whitespace-pre-wrap text-sm leading-6 text-muted">
                  {fullText}
                </p>
              </ScrollShadow>
            </>
          ) : null}
          {(status === "error" || status === "empty" || status === "unknown") && (
            <p className="text-sm text-muted">{getErrorText(transcript)}</p>
          )}
        </Accordion.Body>
      </Accordion.Panel>
    </Accordion.Item>
  );
}

function GridComponent({ data }) {
  if (!data || data.length === 0) return null;

  const allTranscripts = data
    .filter(
      (pair) =>
        Array.isArray(pair) &&
        Array.isArray(pair[1]) &&
        pair[1].length > 0
    )
    .map((pair) => pair[1].map((item) => item.text).join(" "));

  const allDone = data.every((pair) => Array.isArray(pair) && pair[1] !== null);

  return (
    <div className="flex flex-col gap-3 p-4">
      {allDone && allTranscripts.length > 0 ? (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            onPress={() =>
              copyText(allTranscripts.join("\n\n---\n\n"), "All transcripts copied")
            }
          >
            <Copy className="size-4" />
            Copy all
          </Button>
        </div>
      ) : null}

      <Accordion allowsMultipleExpanded className="w-full">
        {data.map((pair, index) => {
          const [videoId, transcript] = Array.isArray(pair) ? pair : [pair, null];
          return (
            <VideoItem
              key={`${videoId}-${index}`}
              transcript={transcript}
              videoId={videoId}
            />
          );
        })}
      </Accordion>
    </div>
  );
}

export default GridComponent;
