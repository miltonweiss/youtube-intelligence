export const WORKSPACES = [
  {
    key: "single",
    label: "Extract",
    navLabel: "Extract",
    heading: "Extract transcripts",
    navDescription: "Videos and playlists",
    heroTagline: "Paste a YouTube video or playlist URL.",
    description:
      "Paste a YouTube URL to fetch video or playlist transcripts and add them to your local library.",
  },
  {
    key: "library",
    label: "Library",
    navLabel: "Library",
    heading: "Your library",
    navDescription: "Saved transcripts",
    heroTagline: "Browse and search your saved transcripts.",
    description: "Browse, read, copy, and export every transcript you have ever fetched.",
  },
];

export function getWorkspace(key) {
  return WORKSPACES.find((workspace) => workspace.key === key) ?? WORKSPACES[0];
}
