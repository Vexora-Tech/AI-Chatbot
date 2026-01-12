import React, { useEffect, useState } from "react";

export default function Answer({ response, err, darkMode = false }) {
  // ============ STATE MANAGEMENT ============
  const [displayedText, setDisplayedText] = useState(""); // Text being animated character by character
  const [isStreaming, setIsStreaming] = useState(false); // Whether animation is still playing

  // ============ EFFECT: HANDLE RESPONSE STREAMING ANIMATION ============
  useEffect(() => {
    // If no response provided, clear text and return
    if (!response) {
      setDisplayedText("");
      return;
    }

    // CONVERT RESPONSE TO STRING
    // If response is array, join with line breaks; otherwise convert to string
    const fullText = Array.isArray(response)
      ? response.join("\n\n")
      : String(response);

    // RESET ANIMATION
    setDisplayedText(""); // Clear previous text
    setIsStreaming(true); // Start streaming animation

    let currentIndex = 0; // Track which character we're on

    // STREAMING ANIMATION INTERVAL
    const streamInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        // Add next character to displayed text
        setDisplayedText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        // Animation complete
        setIsStreaming(false); // Stop streaming
        clearInterval(streamInterval); // Stop interval
      }
    }, 10); // Update every 10ms for smooth animation

    // CLEANUP: Stop interval when component unmounts or response changes
    return () => clearInterval(streamInterval);
  }, [response]);

  // ============ FUNCTION: formatText() - Parse and style markdown-like formatting ============
  const formatText = (text) => {
    // SPLIT TEXT INTO LINES
    const lines = text.split("\n");
    let isIntroSection = true; // Track if we're in intro paragraph

    // MAP EACH LINE TO APPROPRIATE JSX ELEMENT
    return lines.map((line, idx) => {
      // CHECK IF LINE IS A MAIN HEADING (**text**)
      if (/^\*\*.*\*\*$/.test(line.trim())) {
        isIntroSection = false; // End intro section when heading found
        const headingText = line.trim().replace(/^\*\*|\*\*$/g, ""); // Remove ** markers
        return (
          <h2
            key={idx}
            className={`text-2xl font-medium mt-6 mb-3 first:mt-0 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {headingText}
          </h2>
        );
      }

      // CHECK IF LINE IS A SUBHEADING (**text*)
      if (/^\*\*.*\*$/.test(line.trim())) {
        isIntroSection = false;
        const subheadingText = line
          .trim()
          .replace(/^\*\*/, "") // Remove opening **
          .replace(/\*$/, ""); // Remove closing *
        return (
          <h3
            key={idx}
            className={`text-xl font-medium mt-2 mb-2 ${
              darkMode ? "text-gray-200" : "text-gray-800"
            }`}
          >
            {subheadingText}
          </h3>
        );
      }

      // CHECK IF LINE IS NON-EMPTY TEXT
      if (line.trim()) {
        // MAKE INTRODUCTION TEXT BOLDER AND LARGER
        if (isIntroSection) {
          return (
            <p
              key={idx}
              className={`leading-relaxed mb-2 font-bold text-[15px] ${
                darkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              {line}
            </p>
          );
        }

        // REGULAR TEXT STYLING
        return (
          <p
            key={idx}
            className={`leading-relaxed mb-2 ${
              darkMode ? "text-gray-100" : "text-gray-700"
            }`}
          >
            {line}
          </p>
        );
      }

      // EMPTY LINE - Create spacing
      return <div key={idx} className="h-2" />;
    });
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
          <p className={darkMode ? "text-red-400" : "text-red-600"}>{err}</p>
        </div>
      </div>
    );
  }

  // ============ RENDER: AI RESPONSE WITH STREAMING ANIMATION ============
  return (
    <div
      className={`max-w-3xl mx-auto my-4 pb-14 rounded-2xl ${
        darkMode ? "" : "bg-white shadow-sm border border-gray-100"
      }`}
    >
      {/* RESPONSE CONTENT AREA */}
      <div className="p-6">
        <div className="prose prose-invert max-w-none">
          {/* FORMATTED AND ANIMATED TEXT */}
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
