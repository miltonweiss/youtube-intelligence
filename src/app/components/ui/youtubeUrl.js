export function getYouTubeVideoId(url) {
  const match = url.match(
    /(?:v=|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export function getYouTubePlaylistId(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (/^[A-Za-z0-9_-]{10,}$/.test(trimmed) && !trimmed.startsWith("http")) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.includes("/playlist") || parsed.searchParams.has("list")) {
      return parsed.searchParams.get("list");
    }
    return null;
  } catch {
    return null;
  }
}

export function parseYouTubeUrl(url) {
  const trimmed = url?.trim();
  if (!trimmed) return { type: "invalid" };

  try {
    const parsed = new URL(trimmed);
    const listId = parsed.searchParams.get("list");
    const isPlaylistPath = /\/playlist\b/.test(parsed.pathname);
    const videoId = getYouTubeVideoId(trimmed);

    if (isPlaylistPath && listId) {
      return { type: "playlist", playlistId: listId };
    }

    if (listId && !videoId) {
      return { type: "playlist", playlistId: listId };
    }

    if (videoId) {
      return { type: "video", videoId };
    }
  } catch {
    // fall through
  }

  return { type: "invalid" };
}
