"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { CHAT_RAG_API } from "@/lib/chat";
import { retrieveChunks } from "@/lib/ai/retrieve";

// Parses [Source X] references in text and replaces them with interactive chips
function RagMarkdown({ content, ragChunks }) {
  const parts = [];
  const regex = /\[Source (\d+)\]/g;
  let last = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > last) {
      parts.push({ type: "text", value: content.slice(last, match.index) });
    }
    const sourceNum = parseInt(match[1], 10);
    const chunk = ragChunks?.find((c) => c.source === sourceNum);
    parts.push({ type: "source", num: sourceNum, chunk });
    last = match.index + match[0].length;
  }
  if (last < content.length) {
    parts.push({ type: "text", value: content.slice(last) });
  }

  return (
    <div className="rag-markdown">
      {parts.map((part, i) => {
        if (part.type === "source") {
          return (
            <SourceChip key={i} num={part.num} chunk={part.chunk} />
          );
        }
        return (
          <div key={i} className="markdown-content inline">
            <ReactMarkdown>{part.value}</ReactMarkdown>
          </div>
        );
      })}
    </div>
  );
}

function SourceChip({ num, chunk }) {
  return (
    <span className="source-ref" tabIndex={0}>
      {num}
      {chunk && (
        <span className="source-tooltip">
          <span className="source-tooltip-header">
            <span className="source-tooltip-title">
              {chunk.title || `Source ${num}`}
            </span>
            <span className="source-tooltip-score">
              {(chunk.score * 100).toFixed(0)}% match
            </span>
          </span>
          <span className="source-tooltip-body">{chunk.preview}</span>
        </span>
      )}
    </span>
  );
}

function AssistantMessage({ message, ragChunks }) {
  const textContent =
    typeof message.content === "string"
      ? message.content
      : message.parts
          ?.filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("") ?? "";

  const hasSourceRefs = /\[Source \d+\]/.test(textContent);

  return (
    <div className="message-row message-row-assistant">
      <div className="message-bubble-assistant">
        {hasSourceRefs ? (
          <RagMarkdown content={textContent} ragChunks={ragChunks} />
        ) : (
          <div className="markdown-content">
            <ReactMarkdown>{textContent}</ReactMarkdown>
          </div>
        )}
        {ragChunks && ragChunks.length > 0 && (
          <div className="source-footer" style={{ marginTop: 12 }}>
            <span className="source-footer-label">Sources:</span>
            {ragChunks.map((c) => (
              <SourceChip key={c.source} num={c.source} chunk={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserMessage({ message }) {
  const text =
    typeof message.content === "string"
      ? message.content
      : message.parts
          ?.filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("") ?? "";

  return (
    <div className="message-row message-row-user">
      <div
        className="message-bubble-user"
        style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}
      >
        {text}
      </div>
    </div>
  );
}

function ChatAppInner({ initialMessages }) {
  const [inputFocused, setInputFocused] = useState(false);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: CHAT_RAG_API }),
    initialMessages,
  });

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem("chat_messages", JSON.stringify(messages));
    }
  }, [messages]);

  const isStreaming = status === "streaming" || status === "submitted";

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const text = (input ?? "").trim();
    if (!text || isStreaming) return;
    setInput("");
    try {
      const ragChunks = await retrieveChunks(text, { topK: 3 });
      sendMessage({ text }, { body: { ragChunks } });
    } catch (err) {
      console.error("[Chat] Retrieval error:", err);
      sendMessage({ text });
    }
  };

  // Extract RAG chunks from each assistant message's data parts
  function getRagChunks(message) {
    if (!Array.isArray(message.parts)) return null;
    for (const part of message.parts) {
      if (part?.type === "data-rag_context" && Array.isArray(part?.data?.chunks)) {
        return part.data.chunks;
      }
    }
    return null;
  }

  // Auto-scroll to bottom on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const isEmpty = messages.length === 0;

  return (
    <div
      className="w-full max-w-[640px] flex flex-col"
      style={{ minHeight: "60vh" }}
    >
     
      {!isEmpty && (
        <div
          className="chat-thread"
          style={{ animation: "fadeUp 0.25s ease-out" }}
        >
          {messages.map((msg) => {
            if (msg.role === "user") return <UserMessage key={msg.id} message={msg} />;
            if (msg.role === "assistant") {
              return (
                <AssistantMessage
                  key={msg.id}
                  message={msg}
                  ragChunks={getRagChunks(msg)}
                />
              );
            }
            return null;
          })}

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="message-row message-row-assistant">
              <div className="message-bubble-assistant">
                <span className="typing-indicator">
                  <span className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </span>
                  <span className="typing-label deemphasize">Thinking…</span>
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[640px] mt-auto px-5"
        style={{ paddingBottom: 8 }}
      >
        <div
          className="foreground transition-all duration-200"
          style={{
            borderRadius: 14,
            padding: 6,
            border: inputFocused
              ? "1.5px solid var(--accent)"
              : "1.5px solid var(--border-default)",
            boxShadow: inputFocused
              ? "0 0 0 3px rgba(232, 139, 90, 0.12)"
              : "none",
          }}
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Ask about your transcripts…"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-grow
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
              }}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if ((input ?? "").trim() && !isStreaming) {
                    handleSubmit(e);
                    // Reset height
                    e.target.style.height = "auto";
                  }
                }
              }}
              className="flex-1 min-w-0 bg-transparent py-3 px-2 resize-none"
              style={{
                border: "none",
                outline: "none",
                fontSize: "0.95rem",
                color: "var(--text-primary)",
                lineHeight: 1.5,
                minHeight: "44px",
                maxHeight: "160px",
                overflowY: "auto",
              }}
            />
            <button
              type="submit"
              disabled={!(input ?? "").trim() || isStreaming}
              className="accent-bg flex-shrink-0 w-[42px] h-[42px] flex items-center justify-center mr-0.5 mb-0.5"
              style={{
                borderRadius: 12,
                border: "none",
                opacity: !(input ?? "").trim() || isStreaming ? 0.35 : 1,
                cursor: !(input ?? "").trim() || isStreaming ? "not-allowed" : "pointer",
                alignSelf: "flex-end",
              }}
            >
              {isStreaming ? (
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ animation: "spin 1s linear infinite" }}
                >
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
              ) : (
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <p
          className="deemphasize text-center mt-2"
          style={{ fontSize: "0.72rem" }}
        >
          Press{" "}
          <span
            className="foreforeground"
            style={{
              fontSize: "0.68rem",
              border: "1px solid var(--border-default)",
              borderRadius: 5,
              padding: "2px 7px",
              margin: "0 2px",
            }}
          >
            Enter
          </span>{" "}
          to send &middot; Shift+Enter for newline
        </p>
      </form>

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
  );
}

export default function ChatApp() {
  const [initialMessages, setInitialMessages] = useState(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("chat_messages");
      setInitialMessages(saved ? JSON.parse(saved) : []);
    } catch {
      setInitialMessages([]);
    }
  }, []);

  if (initialMessages === null) return null;

  return <ChatAppInner initialMessages={initialMessages} />;
}
