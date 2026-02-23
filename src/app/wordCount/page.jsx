"use client";
import { useState, useMemo, useCallback } from "react";

// ─── ANALYSIS ENGINE ────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  "der","die","das","den","dem","des","ein","eine","einer","einem","einen","eines",
  "und","oder","aber","doch","nicht","auch","noch","schon","nun","ja","nein",
  "ich","du","er","sie","es","wir","ihr","sie","mich","dich","sich","uns","euch",
  "mir","dir","ihm","ihr","uns","euch","ihnen","mein","dein","sein","ihr","unser",
  "ist","sind","war","waren","hat","haben","wird","werden","wurde","wurden",
  "auf","in","an","zu","mit","von","bei","nach","vor","über","unter","durch",
  "für","um","bis","aus","als","wie","so","dass","ob","wenn","weil","da","seit",
  "the","a","an","and","or","but","not","in","on","at","to","for","of","with",
  "is","are","was","were","has","have","will","be","been","that","this","it",
  "he","she","we","they","i","you","my","your","his","her","our","their",
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-zäöüß\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function analyze(text) {
  if (!text.trim()) return null;

  const raw = text.trim();
  const tokens = tokenize(raw);
  const sentences = raw.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = raw.split(/\n{2,}/).filter(p => p.trim().length > 0);
  const lines = raw.split(/\n/).length;
  const chars = raw.length;
  const charsNoSpaces = raw.replace(/\s/g, "").length;
  const words = tokens.length;
  const uniqueWords = new Set(tokens).size;
  const avgWordLength = words > 0 ? (tokens.reduce((a, w) => a + w.length, 0) / words).toFixed(2) : 0;
  const avgSentenceLength = sentences.length > 0 ? (words / sentences.length).toFixed(1) : 0;
  const lexicalDiversity = words > 0 ? ((uniqueWords / words) * 100).toFixed(1) : 0;

  // Word frequency
  const wordFreq = {};
  for (const t of tokens) wordFreq[t] = (wordFreq[t] || 0) + 1;
  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  const topWordsFiltered = Object.entries(wordFreq)
    .filter(([w]) => !STOPWORDS.has(w) && w.length > 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  // Bigrams
  const bigramFreq = {};
  for (let i = 0; i < tokens.length - 1; i++) {
    const bg = `${tokens[i]} ${tokens[i + 1]}`;
    bigramFreq[bg] = (bigramFreq[bg] || 0) + 1;
  }
  const topBigrams = Object.entries(bigramFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  // Trigrams
  const trigramFreq = {};
  for (let i = 0; i < tokens.length - 2; i++) {
    const tg = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
    trigramFreq[tg] = (trigramFreq[tg] || 0) + 1;
  }
  const topTrigrams = Object.entries(trigramFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Word length distribution
  const lenDist = {};
  for (const t of tokens) {
    const l = t.length;
    lenDist[l] = (lenDist[l] || 0) + 1;
  }
  const lenDistSorted = Object.entries(lenDist)
    .map(([l, c]) => ({ len: Number(l), count: c }))
    .sort((a, b) => a.len - b.len);

  // Char frequency (letters only)
  const charFreq = {};
  for (const c of raw.toLowerCase()) {
    if (/[a-zäöüß]/.test(c)) charFreq[c] = (charFreq[c] || 0) + 1;
  }
  const topChars = Object.entries(charFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Sentence length distribution
  const sentLengths = sentences.map(s => tokenize(s).length).filter(n => n > 0);
  const minSentLen = sentLengths.length ? Math.min(...sentLengths) : 0;
  const maxSentLen = sentLengths.length ? Math.max(...sentLengths) : 0;

  // Readability (Flesch-Kincaid approximation via syllables)
  function countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-zäöüß]/g, "");
    if (!word) return 0;
    const matches = word.match(/[aeiouäöü]+/g);
    return matches ? matches.length : 1;
  }
  const totalSyllables = tokens.reduce((a, w) => a + countSyllables(w), 0);
  const avgSyllablesPerWord = words > 0 ? (totalSyllables / words).toFixed(2) : 0;
  // Flesch Reading Ease (EN approximation)
  const fleschScore = sentences.length > 0 && words > 0
    ? Math.max(0, Math.min(100, (206.835 - 1.015 * (words / sentences.length) - 84.6 * (totalSyllables / words)).toFixed(1)))
    : null;

  // Hapax legomena (words appearing only once)
  const hapax = Object.entries(wordFreq).filter(([, c]) => c === 1).length;
  const hapaxRatio = words > 0 ? ((hapax / uniqueWords) * 100).toFixed(1) : 0;

  // Estimated reading time (200 wpm average)
  const readingTimeSec = Math.ceil((words / 200) * 60);
  const readingTimeStr = readingTimeSec < 60
    ? `${readingTimeSec}s`
    : `${Math.floor(readingTimeSec / 60)}m ${readingTimeSec % 60}s`;

  // Longest words
  const longestWords = [...new Set(tokens)]
    .sort((a, b) => b.length - a.length)
    .slice(0, 10);

  // Punctuation stats
  const punctuation = (raw.match(/[.,;:!?]/g) || []).length;
  const exclamations = (raw.match(/!/g) || []).length;
  const questions = (raw.match(/\?/g) || []).length;
  const commas = (raw.match(/,/g) || []).length;

  // Uppercase words
  const uppercaseWords = (raw.match(/\b[A-ZÄÖÜ]{2,}\b/g) || []);
  const topUppercase = [...new Set(uppercaseWords)].slice(0, 10);

  // Sentence starters
  const starters = {};
  for (const s of sentences) {
    const firstWord = tokenize(s)[0];
    if (firstWord) starters[firstWord] = (starters[firstWord] || 0) + 1;
  }
  const topStarters = Object.entries(starters)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    chars, charsNoSpaces, words, uniqueWords, sentences: sentences.length,
    paragraphs: paragraphs.length, lines,
    avgWordLength, avgSentenceLength, lexicalDiversity,
    topWords, topWordsFiltered, topBigrams, topTrigrams,
    lenDistSorted, topChars, minSentLen, maxSentLen,
    avgSyllablesPerWord, fleschScore, hapax, hapaxRatio,
    readingTimeStr, longestWords, punctuation, exclamations,
    questions, commas, topUppercase, topStarters, totalSyllables,
  };
}

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

function StatBox({ label, value, sub }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      padding: "16px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}>
      <span style={{ fontSize: 11, color: "#888", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "monospace" }}>{label}</span>
      <span style={{ fontSize: 28, fontWeight: 700, color: "#e8e0d0", fontFamily: "'DM Serif Display', Georgia, serif", lineHeight: 1 }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: "#666" }}>{sub}</span>}
    </div>
  );
}

function FreqBar({ items, maxCount, color = "#c8a96e" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map(([word, count]) => (
        <div key={word} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontFamily: "monospace", fontSize: 13, color: "#b0a898",
            width: 160, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
          }}>{word}</span>
          <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${(count / maxCount) * 100}%`,
              background: color,
              borderRadius: 3,
              transition: "width 0.4s ease",
            }} />
          </div>
          <span style={{ fontFamily: "monospace", fontSize: 12, color: "#666", width: 30, textAlign: "right", flexShrink: 0 }}>{count}</span>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{
        fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
        color: "#c8a96e", fontFamily: "monospace", marginBottom: 16, margin: "0 0 16px 0",
        borderLeft: "2px solid #c8a96e", paddingLeft: 12,
      }}>{title}</h3>
      {children}
    </div>
  );
}

function FleschMeter({ score }) {
  const label =
    score >= 90 ? "Sehr einfach" :
    score >= 70 ? "Einfach" :
    score >= 60 ? "Mittelmäßig" :
    score >= 50 ? "Anspruchsvoll" :
    score >= 30 ? "Schwierig" : "Sehr schwierig";
  const color =
    score >= 70 ? "#7ec87e" :
    score >= 50 ? "#c8a96e" : "#e07070";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "monospace", fontSize: 12, color: "#888" }}>{label}</span>
        <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color, fontWeight: 700 }}>{score}</span>
      </div>
      <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${score}%`, background: color,
          borderRadius: 4, transition: "width 0.5s ease"
        }} />
      </div>
    </div>
  );
}

function LenDistChart({ data }) {
  const max = Math.max(...data.map(d => d.count));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
      {data.map(({ len, count }) => (
        <div key={len} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: 1 }}>
          <div style={{
            width: "100%", background: "#c8a96e44",
            border: "1px solid #c8a96e66",
            borderRadius: "3px 3px 0 0",
            height: `${(count / max) * 64}px`,
            transition: "height 0.4s ease",
          }} />
          <span style={{ fontSize: 9, color: "#666", fontFamily: "monospace" }}>{len}</span>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function TextAnalyzer() {
  const [text, setText] = useState("");
  const [showStopwords, setShowStopwords] = useState(false);

  const data = useMemo(() => analyze(text), [text]);

  const handleChange = useCallback((e) => setText(e.target.value), []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0e0c",
      color: "#e8e0d0",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Subtle grain overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.4,
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1400, margin: "0 auto", width: "100%", padding: "0 24px" }}>
        {/* Header */}
        <header style={{ padding: "48px 0 32px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <h1 style={{
              margin: 0, fontSize: 40, fontWeight: 700,
              fontFamily: "'DM Serif Display', Georgia, serif",
              color: "#e8e0d0", letterSpacing: "-0.02em",
            }}>Textanalyse</h1>
            <span style={{ fontSize: 13, color: "#c8a96e", fontFamily: "monospace", letterSpacing: "0.1em" }}>// corpus inspector</span>
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "#666" }}>
            Paste text. Get everything.
          </p>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>
          {/* Left: Input */}
          <div style={{ position: "sticky", top: 24 }}>
            <textarea
              value={text}
              onChange={handleChange}
              placeholder="Text hier eingeben oder einfügen..."
              style={{
                width: "100%",
                height: 520,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
                padding: 24,
                fontSize: 15,
                lineHeight: 1.7,
                color: "#e8e0d0",
                resize: "vertical",
                outline: "none",
                fontFamily: "'DM Sans', system-ui, sans-serif",
                boxSizing: "border-box",
                caretColor: "#c8a96e",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(200,169,110,0.4)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
            {!data && (
              <div style={{
                marginTop: 24, padding: 20, background: "rgba(200,169,110,0.06)",
                border: "1px solid rgba(200,169,110,0.15)", borderRadius: 12,
                fontSize: 13, color: "#888", textAlign: "center", fontFamily: "monospace",
              }}>
                Warte auf Eingabe...
              </div>
            )}
            {data && (
              <div style={{ marginTop: 24 }}>
                <Section title="Schnellübersicht">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <StatBox label="Wörter" value={data.words} />
                    <StatBox label="Zeichen" value={data.chars} sub={`${data.charsNoSpaces} ohne Leerzeichen`} />
                    <StatBox label="Einzigartige Wörter" value={data.uniqueWords} sub={`${data.lexicalDiversity}% Diversität`} />
                    <StatBox label="Sätze" value={data.sentences} sub={`∅ ${data.avgSentenceLength} Wörter/Satz`} />
                    <StatBox label="Lesezeit" value={data.readingTimeStr} sub="bei 200 WPM" />
                    <StatBox label="Silben" value={data.totalSyllables} sub={`∅ ${data.avgSyllablesPerWord}/Wort`} />
                    <StatBox label="Hapax Legomena" value={data.hapax} sub={`${data.hapaxRatio}% der Einzigartigen`} />
                    <StatBox label="Satzzeichen" value={data.punctuation} sub={`${data.exclamations}! / ${data.questions}? / ${data.commas},`} />
                  </div>
                </Section>
              </div>
            )}
          </div>

          {/* Right: Analysis */}
          <div style={{ paddingBottom: 60 }}>
            {!data && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: 400, color: "#444", fontSize: 14, fontFamily: "monospace",
                flexDirection: "column", gap: 12,
              }}>
                <div style={{ fontSize: 48, opacity: 0.3 }}>◈</div>
                <span>Analyse startet automatisch beim Tippen</span>
              </div>
            )}

            {data && (
              <>
                {/* Readability */}
                {data.fleschScore !== null && (
                  <Section title="Lesbarkeit (Flesch)">
                    <FleschMeter score={Number(data.fleschScore)} />
                    <p style={{ fontSize: 12, color: "#555", marginTop: 10, fontFamily: "monospace" }}>
                      0 = unleserlich · 100 = kindergerecht
                    </p>
                  </Section>
                )}

                {/* Word length dist */}
                {data.lenDistSorted.length > 0 && (
                  <Section title="Wortlängenverteilung">
                    <LenDistChart data={data.lenDistSorted} />
                    <p style={{ fontSize: 12, color: "#555", marginTop: 8, fontFamily: "monospace" }}>
                      X-Achse = Buchstaben pro Wort · ∅ {data.avgWordLength} Buchstaben
                    </p>
                  </Section>
                )}

                {/* Top words */}
                <Section title={
                  <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    Häufigste Wörter
                    <button
                      onClick={() => setShowStopwords(s => !s)}
                      style={{
                        fontSize: 10, fontFamily: "monospace", background: "transparent",
                        border: "1px solid rgba(200,169,110,0.3)", color: "#c8a96e",
                        borderRadius: 4, padding: "2px 8px", cursor: "pointer", letterSpacing: "0.08em",
                      }}
                    >{showStopwords ? "MIT Stopwörter" : "OHNE Stopwörter"}</button>
                  </span>
                }>
                  <FreqBar
                    items={(showStopwords ? data.topWords : data.topWordsFiltered).slice(0, 15)}
                    maxCount={(showStopwords ? data.topWords : data.topWordsFiltered)[0]?.[1] || 1}
                    color="#c8a96e"
                  />
                </Section>

                {/* Bigrams */}
                {data.topBigrams.length > 0 && (
                  <Section title="Häufigste Wortpaare (Bigrams)">
                    <FreqBar
                      items={data.topBigrams.slice(0, 10)}
                      maxCount={data.topBigrams[0]?.[1] || 1}
                      color="#7ec8c8"
                    />
                  </Section>
                )}

                {/* Trigrams */}
                {data.topTrigrams.length > 0 && (
                  <Section title="Häufigste Trigramme">
                    <FreqBar
                      items={data.topTrigrams.slice(0, 8)}
                      maxCount={data.topTrigrams[0]?.[1] || 1}
                      color="#c87ec8"
                    />
                  </Section>
                )}

                {/* Char frequency */}
                {data.topChars.length > 0 && (
                  <Section title="Häufigste Buchstaben">
                    <FreqBar
                      items={data.topChars}
                      maxCount={data.topChars[0]?.[1] || 1}
                      color="#7ec87e"
                    />
                  </Section>
                )}

                {/* Sentence starters */}
                {data.topStarters.length > 0 && (
                  <Section title="Häufigste Satzanfänge">
                    <FreqBar
                      items={data.topStarters}
                      maxCount={data.topStarters[0]?.[1] || 1}
                      color="#e07070"
                    />
                  </Section>
                )}

                {/* Longest words */}
                {data.longestWords.length > 0 && (
                  <Section title="Längste Wörter">
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {data.longestWords.map(w => (
                        <span key={w} style={{
                          fontFamily: "monospace", fontSize: 12,
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 6, padding: "4px 10px",
                          color: "#b0a898",
                        }}>
                          {w} <span style={{ color: "#555" }}>({w.length})</span>
                        </span>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Extra stats */}
                <Section title="Weitere Metriken">
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: "monospace", fontSize: 13, color: "#888" }}>
                    {[
                      ["Absätze", data.paragraphs],
                      ["Zeilen", data.lines],
                      ["Min. Satzlänge", `${data.minSentLen} Wörter`],
                      ["Max. Satzlänge", `${data.maxSentLen} Wörter`],
                      ["Ausrufezeichen", data.exclamations],
                      ["Fragezeichen", data.questions],
                      ["Großgeschriebene Akronyme", data.topUppercase.length > 0 ? data.topUppercase.join(", ") : "–"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: 6 }}>
                        <span style={{ color: "#666" }}>{k}</span>
                        <span style={{ color: "#b0a898" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        textarea::placeholder { color: #444; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>
    </div>
  );
}