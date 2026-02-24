"use client";
import { useState, useEffect } from "react";
import TranscriptPageContent from "./components/TranscriptPageContent";
import PlaylistPageContent from "./components/PlaylistPageContent";
import ChatApp from "./components/chat";

const TABS = [
  { key: "single", label: "Single Video" },
  { key: "playlist", label: "Playlist" },
  { key: "Chat", label: "Chat" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("single");

  useEffect(() => {
    const saved = sessionStorage.getItem("activeTab");
    if (saved) setActiveTab(saved);
  }, []);

  useEffect(() => {
    sessionStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  return (
    <div className="background flex flex-col    min-h-screen items-center justify-center">
    <div className="foreground flex w-[95vw] h-[95vh] max-h-[90vh]   borderDefault flex-col items-center px-5">
      {/* Hero */}
      <div className="flex flex-col items-center pt-[min(14vh,120px)] pb-6 w-full max-w-[640px]">
      <a href="https://www.github.com/miltonweiss" target="_blank" className="border-none">
            
        <div
          className="accent-bg hover:opacity-80 active:scale-90 transition-all duration-200 w-12 h-12 flex items-center justify-center mb-7"
          style={{ borderRadius: 14 }}
        >
          
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
    
            
          
         
        </div>
        </a>
        <h4 className="text-center mb-2">YouTube Transcript</h4>
        <p
          className="deemphasize text-center"
          style={{ fontSize: "0.95rem" }}
        >
          Extract transcripts from videos or playlists and chat with them.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="w-full max-w-[640px] mb-6">
        <div
          className="foreforeground borderDefault  flex p-1 gap-1"
          style={{
            borderRadius: 12,
            border: "1.5px solid var(--border-default)",
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2.5 transition-all duration-200"
              style={{
                borderRadius: 9,
                border: "none",
                fontSize: "0.85rem",
                fontWeight: 500,
                cursor: "pointer",
                background:
                  activeTab === tab.key
                    ? "var(--accent)"
                    : "transparent",
                color:
                  activeTab === tab.key
                    ? "#fff"
                    : "var(--text-muted)",
                boxShadow:
                  activeTab === tab.key
                    ? "0 1px 3px rgba(0,0,0,0.08)"
                    : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Single Video Tab */}
      {activeTab === "single" && <TranscriptPageContent />}

      {/* Playlist Tab */}
      {activeTab === "playlist" && <PlaylistPageContent />}

      {/* Channel Tab */}
      {activeTab === "Chat" && (
        <div className="w-full max-w-[640px] flex flex-col items-center">
          <ChatApp />
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
    </div>
  );
}