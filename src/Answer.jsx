import React, { useEffect, useState } from "react";

export default function Answer({ response, err }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (!response) {
      setDisplayedText("");
      return;
    }

    const fullText = Array.isArray(response)
      ? response.join("\n\n")
      : String(response);

    // Reset and start streaming
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
    }, 10);

    return () => clearInterval(streamInterval);
  }, [response]);

  const formatText = (text) => {
    const lines = text.split("\n");
    let isIntroSection = true; // Track if we're still in the intro

    return lines.map((line, idx) => {
      // Check if line is a heading (**text**)
      if (/^\*\*.*\*\*$/.test(line.trim())) {
        isIntroSection = false; // After first heading, intro is over
        const headingText = line.trim().replace(/^\*\*|\*\*$/g, "");
        return (
          <h2
            key={idx}
            className="text-2xl font-medium text-white mt-6 mb-3 first:mt-0"
          >
            {headingText}
          </h2>
        );
      }

      // Check if line is a subheading (**text*)
      if (/^\*\*.*\*$/.test(line.trim())) {
        isIntroSection = false; // After first subheading, intro is over
        const subheadingText = line
          .trim()
          .replace(/^\*\*/, "")
          .replace(/\*$/, "");
        return (
          <h3 key={idx} className="text-xl font-medium text-gray-200 mt-2 mb-2">
            {subheadingText}
          </h3>
        );
      }

      // Regular text
      if (line.trim()) {
        // Make introduction text bolder
        if (isIntroSection) {
          return (
            <p
              key={idx}
              className="text-gray-100 leading-relaxed mb-2 font-bold text-[15px]"
            >
              {line}
            </p>
          );
        }
        return (
          <p key={idx} className="text-gray-100 leading-relaxed mb-2">
            {line}
          </p>
        );
      }

      // Empty line
      return <div key={idx} className="h-2" />;
    });
  };

  if (!response && !err) return null;

  if (err) {
    return (
      <div className="max-w-3xl mx-auto my-4">
        <div className="border border-red-500/50 p-4 rounded-lg">
          <p className="text-red-400">{err}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-4 pb-14">
      <div className="p-6">
        <div className="prose prose-invert max-w-none">
          {formatText(displayedText)}
          {isStreaming && (
            <span className="inline-block w-2 h-5 bg-gray-100 ml-1 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
