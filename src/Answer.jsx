import React, { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";

export default function Answer({ response, err, darkMode = false }) {
  // ============ STATE MANAGEMENT ============
  const [displayedText, setDisplayedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  // ============ EFFECT: HANDLE RESPONSE STREAMING ANIMATION ============
  useEffect(() => {
    if (!response) {
      setDisplayedText("");
      return;
    }

    const fullText = Array.isArray(response)
      ? response.join("\n\n")
      : String(response);

    setDisplayedText("");
    setIsStreaming(true);

    let currentIndex = 0;
    const streamInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsStreaming(false);
        clearInterval(streamInterval);
      }
    }, 5);

    return () => clearInterval(streamInterval);
  }, [response]);

  // ============ FUNCTION: formatText() - Parse markdown and code blocks ============
  const formatText = (text) => {
    const lines = text.split("\n");
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // ========== DETECT CODE BLOCKS (```language) ==========
      if (line.trim().startsWith("```")) {
        const language = line.trim().slice(3).trim() || "text";
        let codeLines = [];
        i++;

        // Collect all lines until closing ```
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }

        const code = codeLines.join("\n");

        elements.push(
          <div key={`code-${i}`} className="my-4 rounded-lg overflow-hidden">
            {/* CODE HEADER with language and copy button */}
            <div
              className={`flex items-center justify-between px-4 py-2 text-xs ${
                darkMode
                  ? "bg-zinc-800 text-gray-300 border-b border-zinc-700"
                  : "bg-gray-100 text-gray-700 border-b border-gray-200"
              }`}
            >
              <span className="font-mono font-semibold uppercase">
                {language}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(code);
                }}
                className={`px-3 py-1 rounded transition-colors font-medium ${
                  darkMode
                    ? "hover:bg-zinc-700 text-gray-400 hover:text-gray-200"
                    : "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
                }`}
              >
                Copy
              </button>
            </div>
            {/* SYNTAX HIGHLIGHTED CODE */}
            <SyntaxHighlighter
              language={language}
              style={darkMode ? vscDarkPlus : vs}
              customStyle={{
                margin: 0,
                padding: "1rem",
                fontSize: "0.875rem",
                lineHeight: "1.5",
                background: darkMode ? "#1e1e1e" : "#f8f8f8",
              }}
              showLineNumbers={code.split("\n").length > 3}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        );
        i++;
        continue;
      }

      // ========== DETECT INLINE CODE (`code`) ==========
      if (line.includes("`") && !line.trim().startsWith("```")) {
        const parts = line.split(/(`[^`]+`)/g);
        elements.push(
          <p
            key={`line-${i}`}
            className={`leading-relaxed mb-2 ${
              darkMode ? "text-gray-100" : "text-gray-700"
            }`}
          >
            {parts.map((part, idx) => {
              if (part.startsWith("`") && part.endsWith("`")) {
                const code = part.slice(1, -1);
                return (
                  <code
                    key={idx}
                    className={`px-1.5 py-0.5 rounded text-sm font-mono ${
                      darkMode
                        ? "bg-zinc-800 text-pink-300 border border-zinc-700"
                        : "bg-gray-100 text-pink-600 border border-gray-200"
                    }`}
                  >
                    {code}
                  </code>
                );
              }
              return <span key={idx}>{part}</span>;
            })}
          </p>
        );
        i++;
        continue;
      }

      // ========== DETECT MAIN HEADINGS (**text**) ==========
      if (/^\*\*.*\*\*$/.test(line.trim())) {
        const headingText = line.trim().replace(/^\*\*|\*\*$/g, "");
        elements.push(
          <h2
            key={`heading-${i}`}
            className={`text-2xl font-semibold mt-6 mb-3 first:mt-0 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {headingText}
          </h2>
        );
        i++;
        continue;
      }

      // ========== DETECT SUBHEADINGS (**text*) ==========
      if (/^\*\*.*\*$/.test(line.trim())) {
        const subheadingText = line.trim().replace(/^\*\*|\*$/g, "");
        elements.push(
          <h3
            key={`subheading-${i}`}
            className={`text-xl font-semibold mt-4 mb-2 ${
              darkMode ? "text-gray-200" : "text-gray-800"
            }`}
          >
            {subheadingText}
          </h3>
        );
        i++;
        continue;
      }

      // ========== DETECT BOLD TEXT WITHIN PARAGRAPHS ==========
      if (line.includes("**") && !line.trim().startsWith("**")) {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        elements.push(
          <p
            key={`bold-${i}`}
            className={`leading-relaxed mb-2 ${
              darkMode ? "text-gray-100" : "text-gray-700"
            }`}
          >
            {parts.map((part, idx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={idx} className="font-semibold">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={idx}>{part}</span>;
            })}
          </p>
        );
        i++;
        continue;
      }

      // ========== DETECT BULLET POINTS (- or *) ==========
      if (line.trim().match(/^[-*]\s+/)) {
        const bulletText = line.trim().replace(/^[-*]\s+/, "");
        elements.push(
          <li
            key={`bullet-${i}`}
            className={`ml-6 mb-1 list-disc ${
              darkMode ? "text-gray-100" : "text-gray-700"
            }`}
          >
            {bulletText}
          </li>
        );
        i++;
        continue;
      }

      // ========== DETECT NUMBERED LISTS (1. 2. etc.) ==========
      if (line.trim().match(/^\d+\.\s+/)) {
        const listText = line.trim().replace(/^\d+\.\s+/, "");
        elements.push(
          <li
            key={`number-${i}`}
            className={`ml-6 mb-1 list-decimal ${
              darkMode ? "text-gray-100" : "text-gray-700"
            }`}
          >
            {listText}
          </li>
        );
        i++;
        continue;
      }

      // ========== REGULAR TEXT ==========
      if (line.trim()) {
        elements.push(
          <p
            key={`text-${i}`}
            className={`leading-relaxed mb-2 ${
              darkMode ? "text-gray-100" : "text-gray-700"
            }`}
          >
            {line}
          </p>
        );
      } else {
        // Empty line for spacing
        elements.push(<div key={`space-${i}`} className="h-2" />);
      }

      i++;
    }

    return elements;
  };

  // ============ RENDER: EMPTY STATE ============
  if (!response && !err) return null;

  // ============ RENDER: ERROR MESSAGE ============
  if (err) {
    return (
      <div className="max-w-3xl mx-auto my-4">
        <div
          className={`border p-4 rounded-lg ${
            darkMode
              ? "border-red-500/50 bg-red-950/20"
              : "border-red-200 bg-red-50"
          }`}
        >
          <div className="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={darkMode ? "text-red-400" : "text-red-600"}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className={darkMode ? "text-red-400" : "text-red-600"}>{err}</p>
          </div>
        </div>
      </div>
    );
  }

  // ============ RENDER: AI RESPONSE WITH STREAMING ANIMATION ============
  return (
    <div
      className={`max-w-3xl mx-auto my-4 pb-6 rounded-2xl ${
        darkMode ? "" : "bg-white shadow-sm border border-gray-100"
      }`}
    >
      <div className="p-6">
        <div className="prose prose-invert max-w-none">
          {formatText(displayedText)}

          {/* CURSOR ANIMATION - Shows while streaming */}
          {isStreaming && (
            <span
              className={`inline-block w-2 h-5 ml-1 animate-pulse ${
                darkMode ? "bg-gray-100" : "bg-gray-900"
              }`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
