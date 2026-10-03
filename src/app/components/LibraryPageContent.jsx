"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  Button,
  Chip,
  InputGroup,
  Link,
  ScrollShadow,
  TextField,
  Tooltip,
  useOverlayState,
} from "@heroui/react";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  Download,
  Expand,
  ExternalLink,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { deleteYoutubeVideo, getYoutubeVideos, updateYoutubeVideo } from "@/lib/storage/videos";
import { copyText } from "./ui/clipboard";
import TranscriptReader from "./ui/TranscriptReader";
import { EmptyHint, LoadingFeedback } from "./ui/ResultState";
import { getWorkspace } from "./ui/workspaces";

function countWords(str) {
  if (!str) return 0;
  const match = str.trim().match(/\S+/g);
  return match ? match.length : 0;
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function downloadTranscript(video) {
  const filename = `${(video.title || video.videoId).slice(0, 50).replace(/[^a-z0-9_-]/gi, "_")}.txt`;
  const blob = new Blob([video.text || ""], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function VideoCard({ video, onOpenReader, onDelete }) {
  const [copied, setCopied] = useState(false);
  const wordCount = useMemo(() => countWords(video.text), [video.text]);
  const formattedDate = useMemo(() => formatDate(video.createdAt), [video.createdAt]);

  async function handleCopy() {
    const ok = await copyText(video.text, { toast: false });
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const hasRealTitle = Boolean(video.title && video.title !== video.videoId);
  const displayTitle = hasRealTitle
    ? video.title
    : video.name && video.name !== video.videoId
    ? video.name
    : `YouTube Video (${video.videoId})`;

  const thumbnailUrl =
    video.thumbnailUrl || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-default/20 p-4 shadow-sm transition-colors hover:border-border/80">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-default/40 sm:w-56 md:w-60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={displayTitle}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            src={thumbnailUrl}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-0.5">
                <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground sm:text-lg">
                  {displayTitle}
                </h3>
                {hasRealTitle ? (
                  <p className="text-[11px] font-mono text-muted/80">
                    ID: {video.videoId}
                  </p>
                ) : null}
              </div>
              <Tooltip>
                <Tooltip.Trigger>
                  <Button
                    aria-label="Delete from library"
                    className="shrink-0 text-muted hover:text-danger"
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    onPress={() => onDelete(video.videoId)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>Remove from library</Tooltip.Content>
              </Tooltip>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              {video.author ? <span className="font-medium text-foreground/80">{video.author}</span> : null}
              {video.author && formattedDate ? <span>·</span> : null}
              {formattedDate ? <span>{formattedDate}</span> : null}
              <span>·</span>
              <Chip size="sm" variant="soft">
                <Chip.Label>{wordCount.toLocaleString()} words</Chip.Label>
              </Chip>
            </div>
          </div>

          <p className="line-clamp-2 text-xs leading-relaxed text-muted">
            {video.text}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Link
              className="flex items-center gap-1 text-xs text-muted hover:text-foreground"
              href={`https://youtube.com/watch?v=${video.videoId}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span>Watch</span>
              <ExternalLink className="size-3" />
            </Link>

            <div className="flex items-center gap-1.5">
              <Tooltip>
                <Tooltip.Trigger>
                  <Button
                    color={copied ? "success" : "default"}
                    size="sm"
                    variant={copied ? "primary" : "secondary"}
                    onPress={handleCopy}
                  >
                    {copied ? (
                      <>
                        <Check className="size-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>Copy transcript to clipboard</Tooltip.Content>
              </Tooltip>

              <Tooltip>
                <Tooltip.Trigger>
                  <Button
                    aria-label="Download transcript"
                    isIconOnly
                    size="sm"
                    variant="secondary"
                    onPress={() => downloadTranscript(video)}
                  >
                    <Download className="size-3.5" />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>Download .txt</Tooltip.Content>
              </Tooltip>

              <Button
                size="sm"
                variant="secondary"
                onPress={() => onOpenReader(video)}
              >
                <Expand className="size-3.5" />
                Read
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LibraryPageContent() {
  const workspace = getWorkspace("library");
  const [videos, setVideos] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);
  const readerState = useOverlayState();
  const clearDialogState = useOverlayState();

  async function loadVideos() {
    setLoading(true);
    try {
      const all = await getYoutubeVideos();
      setVideos(all || []);

      // Auto-enrich any existing transcripts that only have videoId as title/name
      (all || []).forEach((v) => {
        const vid = v.videoId || v.id;
        const needsEnrich =
          !v.title ||
          v.title === vid ||
          !v.author;

        if (vid && needsEnrich) {
          fetch(`/api/video-info?videoId=${encodeURIComponent(vid)}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((info) => {
              if (info && info.title && info.title !== vid) {
                const updates = {
                  title: info.title,
                  author: info.author || v.author || "",
                  thumbnailUrl: info.thumbnailUrl || v.thumbnailUrl,
                };
                updateYoutubeVideo(vid, updates);
                setVideos((prev) =>
                  prev.map((item) =>
                    item.videoId === vid || item.id === vid
                      ? { ...item, ...updates }
                      : item
                  )
                );
              }
            })
            .catch(() => {});
        }
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVideos();
  }, []);

  async function handleDelete(videoId) {
    await deleteYoutubeVideo(videoId);
    setVideos((prev) => prev.filter((v) => v.videoId !== videoId && v.id !== videoId));
  }

  async function handleClearAll() {
    clearDialogState.close();
    for (const v of videos) {
      await deleteYoutubeVideo(v.videoId || v.id);
    }
    setVideos([]);
  }

  function handleOpenReader(video) {
    setActiveVideo(video);
    readerState.open();
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter((v) => {
      const title = (v.title || v.name || v.videoId || "").toLowerCase();
      const author = (v.author || "").toLowerCase();
      const text = (v.text || "").toLowerCase();
      return title.includes(q) || author.includes(q) || text.includes(q);
    });
  }, [videos, search]);

  const totalWords = useMemo(
    () => videos.reduce((acc, v) => acc + countWords(v.text), 0),
    [videos]
  );

  return (
    <div className="flex w-full flex-col items-center justify-center gap-5 text-center transition-all duration-500 ease-in-out">
      <p className="mx-auto max-w-sm text-balance text-lg font-medium text-foreground">
        {workspace.heroTagline}
      </p>

      {videos.length > 0 ? (
        <div className="w-full max-w-xl space-y-3">
          <TextField
            aria-label="Search transcripts"
            className="w-full"
            fullWidth
            value={search}
            onChange={setSearch}
          >
            <InputGroup fullWidth className="rounded-full">
              <InputGroup.Prefix className="rounded-s-full">
                <Search aria-hidden="true" className="size-4 text-muted" />
              </InputGroup.Prefix>
              <InputGroup.Input placeholder="Search by title, channel, or text…" />
              {search ? (
                <InputGroup.Suffix className="rounded-e-full pe-1">
                  <Tooltip>
                    <Tooltip.Trigger>
                      <Button
                        aria-label="Clear search"
                        className="text-muted hover:text-foreground"
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        onPress={() => setSearch("")}
                      >
                        <X aria-hidden="true" className="size-3.5" />
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>Clear search</Tooltip.Content>
                  </Tooltip>
                </InputGroup.Suffix>
              ) : null}
            </InputGroup>
          </TextField>

          <p className="text-center text-xs text-muted">
            {search
              ? `Showing ${filtered.length} of ${videos.length} ${videos.length === 1 ? "transcript" : "transcripts"}`
              : `${videos.length} ${videos.length === 1 ? "transcript" : "transcripts"} saved${totalWords > 0 ? ` · ${totalWords.toLocaleString()} words` : ""}`}
          </p>
        </div>
      ) : null}

      {loading ? (
        <LoadingFeedback
          description="Retrieving saved transcripts from your browser."
          title="Loading your library…"
        />
      ) : videos.length === 0 ? (
        <EmptyHint title="No transcripts yet">
          Paste a YouTube URL in the Extract tab to fetch your first transcript. It will
          automatically appear here.
        </EmptyHint>
      ) : filtered.length === 0 ? (
        <EmptyHint title="No transcripts found">
          No saved transcripts match &ldquo;{search}&rdquo;.
        </EmptyHint>
      ) : (
        <div className="w-full max-w-3xl space-y-4 text-left">
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">Saved transcripts</p>
              <Chip size="sm" variant="soft">
                <Chip.Label>
                  {filtered.length} {filtered.length === 1 ? "video" : "videos"}
                </Chip.Label>
              </Chip>
            </div>
            <Button
              className="text-muted hover:text-danger"
              size="sm"
              variant="ghost"
              onPress={clearDialogState.open}
            >
              Clear library
            </Button>
          </div>

          <ScrollShadow className="max-h-[60vh]">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3 pb-6"
              initial={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {filtered.map((video) => (
                <VideoCard
                  key={video.videoId || video.id}
                  video={video}
                  onDelete={handleDelete}
                  onOpenReader={handleOpenReader}
                />
              ))}
            </motion.div>
          </ScrollShadow>
        </div>
      )}

      <TranscriptReader
        state={readerState}
        text={activeVideo?.text}
        title={activeVideo?.title || activeVideo?.name || activeVideo?.videoId || "Transcript"}
      />

      <AlertDialog state={clearDialogState}>
        <AlertDialog.Backdrop variant="blur">
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Heading>Clear entire library?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                This will delete all {videos.length} saved transcripts from your browser.
                This action cannot be undone.
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant="secondary" onPress={clearDialogState.close}>
                  Cancel
                </Button>
                <Button color="danger" variant="primary" onPress={handleClearAll}>
                  Clear all
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}
