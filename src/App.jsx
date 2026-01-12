import { useState, useEffect } from "react";
import Answer from "./Answer.jsx";
import { URL, API_KEY } from "./constants.js";

function App() {
  // ============ STATE MANAGEMENT ============
  const [question, setQuestion] = useState(""); // User input text in the input field
  const [isClicked, setIsClicked] = useState(false); // Track if user has started chatting
  const [chatHistory, setChatHistory] = useState([]); // Array of current conversation messages
  const [err, setErr] = useState(null); // Error message from API call
  const [loading, setLoading] = useState(false); // Shows loading state during API request
  const [history, setHistory] = useState([]); // List of all past questions
  const [darkMode, setDarkMode] = useState(false); // Dark mode toggle state
  const [savedChats, setSavedChats] = useState({}); // Object storing all saved conversations

  // ============ EFFECT: LOAD DATA FROM LOCALSTORAGE ON MOUNT ============
  useEffect(() => {
    // Load previous question history from browser storage
    const savedHistory = localStorage.getItem("lastQuestion");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    // Load dark mode preference from browser storage
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode) {
      setDarkMode(JSON.parse(savedMode));
    }

    // Load all saved chat conversations from browser storage
    const savedChatHistory = localStorage.getItem("savedChats");
    if (savedChatHistory) {
      setSavedChats(JSON.parse(savedChatHistory));
    }
  }, []);

  // ============ FUNCTION: toggleDarkMode() - Switch between light/dark theme ============
  const toggleDarkMode = () => {
    const newMode = !darkMode; // Toggle the boolean value
    setDarkMode(newMode); // Update state
    localStorage.setItem("darkMode", JSON.stringify(newMode)); // Save to browser storage
  };

  // ============ FUNCTION: handleAsk() - Send question to AI and get response ============
  const handleAsk = async () => {
    // VALIDATION: Check if input is empty or already loading
    if (!question.trim() || loading) return;

    const currentQuestion = question;
    setQuestion(""); // Clear input field after user submits
    setIsClicked(true); // Show chat interface
    setLoading(true); // Show loading indicator
    setErr(null); // Clear any previous error messages

    // ADD QUESTION TO CHAT HISTORY
    setChatHistory((prev) => [
      ...prev,
      { type: "question", content: currentQuestion },
    ]);

    // SAVE QUESTION TO HISTORY LIST
    if (localStorage.getItem("lastQuestion")) {
      // If history exists, add new question to the beginning
      let lastQuestion = JSON.parse(localStorage.getItem("lastQuestion"));
      lastQuestion = [currentQuestion, ...lastQuestion];
      localStorage.setItem("lastQuestion", JSON.stringify(lastQuestion));
      setHistory(lastQuestion);
    } else {
      // If no history exists, create new array with this question
      localStorage.setItem("lastQuestion", JSON.stringify([currentQuestion]));
      setHistory([currentQuestion]);
    }

    try {
      // MAKE API CALL to OpenRouter
      const res = await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemma-3-4b-it:free",
          messages: [
            {
              role: "user",
              content: currentQuestion,
            },
          ],
        }),
      });

      // CHECK IF RESPONSE IS OK
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error?.message || res.statusText);
      }

      // PARSE RESPONSE DATA
      const data = await res.json();
      let dataString = data.choices[0].message.content;

      // SPLIT RESPONSE BY BULLET POINTS
      dataString = dataString.split("* ");

      // TRIM WHITESPACE FROM EACH ITEM
      dataString = dataString.map((item) => item.trim());

      // ADD AI RESPONSE TO CHAT HISTORY
      setChatHistory((prev) => {
        const newHistory = [
          ...prev,
          { type: "answer", content: dataString || "No response" },
        ];

        // SAVE THIS CONVERSATION TO LOCALSTORAGE
        const chatKey = currentQuestion; // Use question as unique identifier
        const updatedSavedChats = {
          ...savedChats,
          [chatKey]: newHistory, // Store entire conversation
        };
        setSavedChats(updatedSavedChats);
        localStorage.setItem("savedChats", JSON.stringify(updatedSavedChats));

        return newHistory;
      });
    } catch (err) {
      // HANDLE ANY ERRORS THAT OCCURRED
      console.error("Error fetching response:", err);
      setErr(err?.message || "Failed to get response");

      // ADD ERROR MESSAGE TO CHAT HISTORY
      setChatHistory((prev) => [
        ...prev,
        { type: "error", content: err?.message || "Failed to get response" },
      ]);
    } finally {
      // ALWAYS STOP LOADING INDICATOR
      setLoading(false);
    }
  };

  // ============ FUNCTION: deleteHistoryItem() - Remove single item from history ============
  const deleteHistoryItem = (index) => {
    const deletedQuestion = history[index]; // Get the question being deleted
    const updatedHistory = history.filter((_, i) => i !== index); // Remove it from array
    setHistory(updatedHistory); // Update state
    localStorage.setItem("lastQuestion", JSON.stringify(updatedHistory)); // Save to storage

    // ALSO DELETE THE SAVED CONVERSATION FOR THIS QUESTION
    const updatedSavedChats = { ...savedChats };
    delete updatedSavedChats[deletedQuestion]; // Remove saved chat
    setSavedChats(updatedSavedChats);
    localStorage.setItem("savedChats", JSON.stringify(updatedSavedChats));
  };

  // ============ FUNCTION: clearAllHistory() - Delete all history and saved chats ============
  const clearAllHistory = () => {
    setHistory([]); // Clear history array
    setSavedChats({}); // Clear saved chats object
    localStorage.removeItem("lastQuestion"); // Remove from storage
    localStorage.removeItem("savedChats"); // Remove from storage
  };

  // ============ FUNCTION: loadPreviousChat() - Load a conversation from history ============
  const loadPreviousChat = (chatQuestion) => {
    setIsClicked(true); // Show chat interface

    // LOAD THE SAVED CHAT HISTORY FOR THIS QUESTION
    if (savedChats[chatQuestion]) {
      setChatHistory(savedChats[chatQuestion]); // Restore full conversation
    } else {
      // If no saved chat found, just show the question
      setChatHistory([{ type: "question", content: chatQuestion }]);
    }
  };

  // ============ FUNCTION: startNewChat() - Reset everything for a new conversation ============
  const startNewChat = () => {
    setQuestion(""); // Clear input
    setIsClicked(false); // Hide chat, show welcome screen
    setChatHistory([]); // Clear conversation
  };

  // ============ MAIN RENDER - UI LAYOUT ============
  return (
    <div className={`flex h-screen ${darkMode ? "bg-zinc-900" : "bg-gray-50"}`}>
      {/* ========== LEFT SIDEBAR: CHAT HISTORY ========== */}
      <div
        className={`w-64 border-r ${
          darkMode ? "border-zinc-700 bg-zinc-800" : "border-gray-100 bg-white"
        } flex flex-col`}
      >
        {/* SIDEBAR HEADER: Title + Control Buttons */}
        <div
          className={`p-4 border-b ${
            darkMode ? "border-zinc-700" : "border-gray-100"
          } flex justify-between items-center`}
        >
          {/* History Title */}
          <h2
            className={`text-sm font-semibold ${
              darkMode ? "text-gray-300" : "text-gray-900"
            }`}
          >
            History
          </h2>

          {/* Control Buttons Container */}
          <div className="flex gap-2">
            {/* NEW CHAT BUTTON - Start fresh conversation */}
            <button
              onClick={startNewChat}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? "hover:bg-zinc-700" : "hover:bg-gray-100"
              }`}
              aria-label="New chat"
              title="New chat"
            >
              {/* Plus Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={darkMode ? "text-gray-300" : "text-gray-600"}
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>

            {/* DARK MODE TOGGLE BUTTON */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? "hover:bg-zinc-700" : "hover:bg-gray-100"
              }`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                // Sun Icon (shown in dark mode)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-300"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              ) : (
                // Moon Icon (shown in light mode)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-600"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* CHAT HISTORY LIST */}
        <div className="flex-1 overflow-y-auto p-3">
          {history.length === 0 ? (
            // Empty state message
            <p
              className={`text-xs p-2 ${
                darkMode ? "text-gray-500" : "text-gray-400"
              }`}
            >
              No chats yet
            </p>
          ) : (
            // Map through all history items
            history.map((item, index) => (
              <div
                key={index}
                className={`group rounded-lg p-3 mb-2 cursor-pointer relative transition-all ${
                  darkMode
                    ? "hover:bg-zinc-700"
                    : "hover:bg-gray-50 hover:shadow-sm border border-transparent hover:border-gray-200"
                }`}
                onClick={() => loadPreviousChat(item)}
              >
                {/* History Item Text */}
                <p
                  className={`text-xs truncate pr-6 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {item}
                </p>

                {/* DELETE BUTTON - Shows on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent loading chat when deleting
                    deleteHistoryItem(index);
                  }}
                  className={`absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                  aria-label="Delete"
                >
                  {/* Trash Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* CLEAR ALL HISTORY BUTTON - Only shows if history exists */}
        {history.length > 0 && (
          <div
            className={`p-3 border-t ${
              darkMode ? "border-zinc-700" : "border-gray-100"
            }`}
          >
            <button
              onClick={clearAllHistory}
              className={`w-full text-xs py-2 rounded-lg transition-colors ${
                darkMode
                  ? "text-gray-400 hover:text-gray-300 hover:bg-zinc-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* ========== RIGHT SIDE: MAIN CHAT AREA ========== */}
      <div className="flex-1 flex flex-col">
        {/* CHAT MESSAGES DISPLAY AREA */}
        <div className="flex-1 overflow-y-auto">
          {/* WELCOME SCREEN - Shown before first message */}
          {!isClicked && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h1
                  className={`text-3xl font-semibold mb-2 ${
                    darkMode ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  Ask anything
                </h1>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Start a conversation to get answers
                </p>
              </div>
            </div>
          )}

          {/* CHAT MESSAGES - Displayed after first message */}
          {isClicked && (
            <div className="max-w-3xl mx-auto px-4 py-8">
              {/* Map through all messages in current conversation */}
              {chatHistory.map((item, index) => (
                <div key={index}>
                  {/* USER QUESTION BUBBLE - Right-aligned, blue background */}
                  {item.type === "question" && (
                    <div className="flex justify-end mb-4">
                      <div
                        className={`px-5 py-3 rounded-2xl max-w-2xl shadow-sm ${
                          darkMode ? "bg-zinc-700" : "bg-blue-500 text-white"
                        }`}
                      >
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-200" : "text-white"
                          }`}
                        >
                          {item.content}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* AI ANSWER - Rendered with Answer component */}
                  {item.type === "answer" && (
                    <Answer
                      response={item.content}
                      err={null}
                      darkMode={darkMode}
                    />
                  )}

                  {/* ERROR MESSAGE - Rendered with Answer component */}
                  {item.type === "error" && (
                    <Answer
                      response={null}
                      err={item.content}
                      darkMode={darkMode}
                    />
                  )}
                </div>
              ))}

              {/* LOADING INDICATOR - Shows while waiting for response */}
              {loading && (
                <div
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Thinking...
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========== BOTTOM: INPUT AREA ========== */}
        <div
          className={`border-t p-4 ${
            darkMode
              ? "border-zinc-700 bg-zinc-900"
              : "border-gray-100 bg-white"
          }`}
        >
          <div className="max-w-3xl mx-auto flex gap-3">
            {/* QUESTION INPUT FIELD */}
            <input
              type="text"
              placeholder="Type your question..."
              className={`flex-1 px-5 py-3 border rounded-xl outline-none text-sm transition-all ${
                darkMode
                  ? "bg-zinc-800 border-zinc-700 text-gray-200 placeholder-gray-500 focus:border-zinc-600"
                  : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              }`}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()} // Send on Enter key
              disabled={loading} // Disable while loading
            />

            {/* SEND BUTTON */}
            <button
              type="button"
              onClick={handleAsk}
              className={`px-6 py-3 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm ${
                darkMode
                  ? "bg-white text-black hover:bg-gray-200"
                  : "bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md"
              }`}
              disabled={loading || !question.trim()}
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
