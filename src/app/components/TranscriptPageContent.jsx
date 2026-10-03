"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  Chip,
  ProgressBar,
  ScrollShadow,
  Tooltip,
  useOverlayState,
} from "@heroui/react";
import { motion } from "framer-motion";
import { BookmarkCheck, Check, Copy, Expand, Link2, X } from "lucide-react";
import { saveToLibrary } from "@/lib/storage/saveToLibrary";
import GridComponent from "./grid";
import UrlSubmitForm from "./ui/UrlSubmitForm";
import TranscriptReader from "./ui/TranscriptReader";
import { InlineFeedback, LoadingFeedback } from "./ui/ResultState";
import { copyText } from "./ui/clipboard";
import { getWorkspace } from "./ui/workspaces";
import { parseYouTubeUrl } from "./ui/youtubeUrl";

function ssGet(key, fallback) {
  if (typeof window === "undefined") return fallback;
  const val = sessionStorage.getItem(key);
  if (val === null) return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

function loadSavedTranscript() {
  if (typeof window === "undefined") return null;
  const saved = sessionStorage.getItem("single_transcript");
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function loadSavedPlaylist() {
  const saved = ssGet("playlist_result", null);
  if (!saved || saved.message != null) return null;
  return saved;
}

function getInitialUrl() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("single_videoUrl") || ssGet("playlist_url", "") || "";
}

function getInitialMode() {
  if (typeof window === "undefined") return null;
  if (sessionStorage.getItem("playlist_result")) return "playlist";
  if (sessionStorage.getItem("single_transcript")) return "video";
  return null;
}

export default function TranscriptPageContent() {
  const workspace = getWorkspace("single");
  const transcriptReader = useOverlayState();
  const [isHydrated, setIsHydrated] = useState(false);
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [playlistResult, setPlaylistResult] = useState(null);
  const [count, setCount] = useState(0);
  const [videoTranscriptPairs, setVideoTranscriptPairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copied, setCopied] = useState(false);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const copiedTimeoutRef = useRef(null);

  useEffect(() => {
    // Restore sessionStorage after hydration so server/client markup match.
    /* eslint-disable react-hooks/set-state-in-effect -- intentional post-hydration restore */
    setUrl(getInitialUrl());
    setMode(getInitialMode());
    setTranscript(loadSavedTranscript());
    setPlaylistResult(loadSavedPlaylist());
    setCount(ssGet("playlist_count", 0));
    setVideoTranscriptPairs(ssGet("playlist_pairs", []));
    setIsHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    sessionStorage.setItem("single_videoUrl", url);
  }, [url, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (transcript === null) {
      sessionStorage.removeItem("single_transcript");
    } else {
      sessionStorage.setItem("single_transcript", JSON.stringify(transcript));
    }
  }, [transcript, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (playlistResult === null) sessionStorage.removeItem("playlist_result");
    else sessionStorage.setItem("playlist_result", JSON.stringify(playlistResult));
  }, [playlistResult, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    sessionStorage.setItem("playlist_count", JSON.stringify(count));
  }, [count, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    sessionStorage.setItem("playlist_pairs", JSON.stringify(videoTranscriptPairs));
  }, [videoTranscriptPairs, isHydrated]);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, []);

  function clearAll() {
    setUrl("");
    setMode(null);
    setFeedback(null);
    clearVideoState();
    clearPlaylistState();
    sessionStorage.removeItem("single_videoUrl");
    sessionStorage.removeItem("playlist_url");
  }

  function clearVideoState() {
    setTranscript(null);
    setCopied(false);
    setSavedToLibrary(false);
    sessionStorage.removeItem("single_transcript");
  }

  function clearPlaylistState() {
    setPlaylistResult(null);
    setVideoTranscriptPairs([]);
    setCount(0);
    sessionStorage.removeItem("playlist_result");
    sessionStorage.removeItem("playlist_pairs");
    sessionStorage.removeItem("playlist_ingestStatus");
    sessionStorage.setItem("playlist_count", JSON.stringify(0));
  }

  function fetchTranscript(videoId) {
    setLoading(true);
    setFeedback(null);
    clearVideoState();
    fetch(`/api/transcript?videoId=${videoId}`)
      .then((res) =>
        res.json().then((data) =>
          !res.ok
            ? { message: data?.message || "Transcript unavailable for this video." }
            : data
        )
      )
      .then((data) => {
        setLoading(false);
        if (!Array.isArray(data)) {
          setFeedback({ description: data.message });
          return;
        }
        if (data.length === 0) {
          setFeedback({ description: "No transcript found for this video." });
          return;
        }
        setTranscript(data);
        transcriptReader.open();
        saveToLibrary({ videoId, segments: data })
          .then(() => setSavedToLibrary(true))
          .catch((err) => {
            console.error("Failed to save video transcript to library:", err);
          });
      })
      .catch(() => {
        setLoading(false);
        setFeedback({ description: "Something went wrong. Please try again." });
      });
  }

  function fetchPlaylist() {
    setCount(0);
    clearPlaylistState();
    setLoading(true);
    setFeedback(null);
    fetch(`/api/playlist?playlistId=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.message != null) {
          setFeedback({ description: data.message });
          return;
        }
        setPlaylistResult(data);
        if (!data.videoIds || !Array.isArray(data.videoIds) || data.videoIds.length === 0) {
          setFeedback({ description: "No videos found in this playlist." });
          return;
        }
        const ids = data.videoIds;
        setVideoTranscriptPairs(ids.map((videoId) => [videoId, null]));
        ids.forEach((videoId, index) => {
          fetch(`/api/transcript?videoId=${videoId}`)
            .then((res) => res.json())
            .then((transcriptData) => {
              setVideoTranscriptPairs((prev) => {
                const next = [...prev];
                next[index] = [videoId, transcriptData];
                return next;
              });

              if (!Array.isArray(transcriptData) || transcriptData.length === 0) return;

              saveToLibrary({
                videoId,
                segments: transcriptData,
                playlistId: data?.playlistId || url,
              }).catch((err) => {
                console.error("Failed to save playlist video to library:", err);
              });
            })
            .catch(() => {
              setVideoTranscriptPairs((prev) => {
                const next = [...prev];
                next[index] = [videoId, { message: "Failed to load transcript." }];
                return next;
              });
            })
            .finally(() => {
              setCount((prev) => prev + 1);
            });
        });
      })
      .catch(() => {
        setLoading(false);
        setFeedback({ description: "Something went wrong. Please try again." });
      });
  }

  function handleSubmit(e) {
    e?.preventDefault();
    if (!url.trim()) return;

    const parsed = parseYouTubeUrl(url);
    if (parsed.type === "invalid") {
      setFeedback({
        description: "That doesn't look like a valid YouTube video or playlist URL.",
      });
      return;
    }

    if (parsed.type === "playlist") {
      setMode("playlist");
      clearVideoState();
      fetchPlaylist();
    } else {
      setMode("video");
      clearPlaylistState();
      fetchTranscript(parsed.videoId);
    }
  }

  const hasTranscriptText = Array.isArray(transcript) && transcript.length > 0;
  const transcriptText = hasTranscriptText
    ? transcript.map((item) => item.text).join(" ")
    : null;

  async function handleCopyTranscript() {
    const ok = await copyText(transcriptText, { toast: false });
    if (!ok) return;

    setCopied(true);
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    copiedTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
  }

  const totalVideos = playlistResult?.videoIds?.length || 0;
  const hasPlaylistResults = !loading && playlistResult != null;
  const isFetchingTranscripts =
    hasPlaylistResults && totalVideos > 0 && count < totalVideos;

  const loadingTitle =
    mode === "playlist" ? "Loading playlist…" : "Fetching transcript…";
  const loadingDescription =
    mode === "playlist"
      ? "Collecting video IDs from the playlist."
      : "This usually takes a few seconds.";

  return (
    <div className="flex w-full flex-col items-center justify-center gap-5 text-center transition-all duration-500 ease-in-out">
      <p className="mx-auto max-w-sm text-balance text-lg font-medium text-foreground">
        {workspace.heroTagline}
      </p>

      <div className="w-full max-w-xl space-y-4">
        <UrlSubmitForm
          hint="or click the arrow to fetch"
          icon={<Link2 aria-hidden="true" className="size-4 text-muted" />}
          isLoading={loading}
          placeholder="Paste a YouTube URL…"
          submitLabel="Fetch transcript"
          value={url}
          onChange={setUrl}
          onClear={clearAll}
          onSubmit={handleSubmit}
        />

        {loading ? (
          <LoadingFeedback description={loadingDescription} title={loadingTitle} />
        ) : null}

        {!loading && feedback ? <InlineFeedback description={feedback.description} /> : null}

        {!loading && hasTranscriptText ? (
          <motion.div
            key={transcriptText}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-default/20 p-4 text-left shadow-sm"
            initial={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">Transcript</p>
                {savedToLibrary ? (
                  <Chip color="success" size="sm" variant="soft">
                    <BookmarkCheck className="size-3.5" />
                    <Chip.Label>Saved to library</Chip.Label>
                  </Chip>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={transcriptReader.open}
                >
                  <Expand aria-hidden="true" className="size-4" />
                  Open reader
                </Button>
                <Tooltip>
                  <Tooltip.Trigger>
                    <Button
                      className="transition-all duration-200"
                      color={copied ? "success" : "default"}
                      size="sm"
                      variant={copied ? "primary" : "secondary"}
                      onPress={handleCopyTranscript}
                    >
                      {copied ? (
                        <>
                          <Check aria-hidden="true" className="size-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy aria-hidden="true" className="size-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>
                    {copied ? "Copied to clipboard" : "Copy the full transcript"}
                  </Tooltip.Content>
                </Tooltip>
                <Tooltip>
                  <Tooltip.Trigger>
                    <Button
                      aria-label="Clear transcript"
                      className="text-muted hover:text-foreground"
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      onPress={clearAll}
                    >
                      <X aria-hidden="true" className="size-4" />
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>Clear</Tooltip.Content>
                </Tooltip>
              </div>
            </div>
            <ScrollShadow className="max-h-72">
              <p className="whitespace-pre-wrap text-[15px] leading-7 text-foreground/80">
                {transcriptText}
              </p>
            </ScrollShadow>
          </motion.div>
        ) : null}
      </div>

      <TranscriptReader
        state={transcriptReader}
        text={transcriptText}
        title="Transcript"
      />

      {hasPlaylistResults ? (
        <div className="w-full max-w-3xl space-y-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Playlist results</p>
              <p className="text-xs text-muted">
                {isFetchingTranscripts
                  ? "Fetching transcripts for each video."
                  : `All ${totalVideos} transcripts have been requested.`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Chip color={isFetchingTranscripts ? "accent" : "success"} size="sm" variant="soft">
                <Chip.Label>
                  {count}/{totalVideos} videos
                </Chip.Label>
              </Chip>
              <Button
                className="text-muted hover:text-foreground"
                size="sm"
                variant="ghost"
                onPress={clearAll}
              >
                Clear
              </Button>
            </div>
          </div>

          {totalVideos > 0 ? (
            <ProgressBar
              aria-label="Playlist transcript progress"
              className="w-full"
              color={count >= totalVideos ? "success" : "accent"}
              maxValue={totalVideos}
              value={count}
            >
              <ProgressBar.Output />
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-border bg-default/20 shadow-sm">
            <GridComponent
              count={count}
              data={videoTranscriptPairs}
              setCount={setCount}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
