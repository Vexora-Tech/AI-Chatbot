import { useState, useEffect, useRef } from "react";
import Answer from "./Answer.jsx";
import { URL, API_KEY } from "./constants.js";

function App() {
  // ============ STATE MANAGEMENT ============
  const [question, setQuestion] = useState("");
  const [isClicked, setIsClicked] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [savedChats, setSavedChats] = useState({});
  const chatContainerRef = useRef(null);

  // ============ EFFECT: LOAD DATA FROM LOCALSTORAGE ON MOUNT ============
  useEffect(() => {
    const savedHistory = localStorage.getItem("lastQuestion");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    const savedMode = localStorage.getItem("darkMode");
    if (savedMode) {
      setDarkMode(JSON.parse(savedMode));
    }

    const savedChatHistory = localStorage.getItem("savedChats");
    if (savedChatHistory) {
      setSavedChats(JSON.parse(savedChatHistory));
    }
  }, []);

  // ============ EFFECT: AUTO-SCROLL TO BOTTOM WHEN CHAT UPDATES ============
  useEffect(() => {
    if (chatContainerRef.current && isClicked) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatHistory, loading, isClicked]);

  // ============ FUNCTION: toggleDarkMode() ============
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", JSON.stringify(newMode));
  };

  // ============ FUNCTION: handleAsk() ============
  const handleAsk = async () => {
    if (!question.trim() || loading) return;

    const currentQuestion = question;
    setQuestion("");
    setIsClicked(true);
    setLoading(true);
    setErr(null);

    setChatHistory((prev) => [
      ...prev,
      { type: "question", content: currentQuestion },
    ]);

    // Save to history
    const existingHistory = localStorage.getItem("lastQuestion");
    let updatedHistory;
    if (existingHistory) {
      updatedHistory = [currentQuestion, ...JSON.parse(existingHistory)];
    } else {
      updatedHistory = [currentQuestion];
    }
    localStorage.setItem("lastQuestion", JSON.stringify(updatedHistory));
    setHistory(updatedHistory);

    try {
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

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error?.message || res.statusText);
      }

      const data = await res.json();
      const dataString = data.choices[0].message.content;

      setChatHistory((prev) => {
        const newHistory = [
          ...prev,
          { type: "answer", content: dataString || "No response" },
        ];

        const updatedSavedChats = {
          ...savedChats,
          [currentQuestion]: newHistory,
        };
        setSavedChats(updatedSavedChats);
        localStorage.setItem("savedChats", JSON.stringify(updatedSavedChats));

        return newHistory;
      });
    } catch (err) {
      console.error("Error fetching response:", err);
      setErr(err?.message || "Failed to get response");

      setChatHistory((prev) => [
        ...prev,
        { type: "error", content: err?.message || "Failed to get response" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ============ FUNCTION: deleteHistoryItem() ============
  const deleteHistoryItem = (index) => {
    const deletedQuestion = history[index];
    const updatedHistory = history.filter((_, i) => i !== index);
    setHistory(updatedHistory);
    localStorage.setItem("lastQuestion", JSON.stringify(updatedHistory));

    const updatedSavedChats = { ...savedChats };
    delete updatedSavedChats[deletedQuestion];
    setSavedChats(updatedSavedChats);
    localStorage.setItem("savedChats", JSON.stringify(updatedSavedChats));
  };

  // ============ FUNCTION: clearAllHistory() ============
  const clearAllHistory = () => {
    setHistory([]);
    setSavedChats({});
    localStorage.removeItem("lastQuestion");
    localStorage.removeItem("savedChats");
  };

  // ============ FUNCTION: loadPreviousChat() ============
  const loadPreviousChat = (chatQuestion) => {
    setIsClicked(true);

    if (savedChats[chatQuestion]) {
      setChatHistory(savedChats[chatQuestion]);
    } else {
      setChatHistory([{ type: "question", content: chatQuestion }]);
    }

    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  // ============ FUNCTION: startNewChat() ============
  const startNewChat = () => {
    setQuestion("");
    setIsClicked(false);
    setChatHistory([]);
  };

  // ============ MAIN RENDER ============
  return (
    <div className={`flex h-screen ${darkMode ? "bg-zinc-900" : "bg-gray-50"}`}>
      {/* ========== LEFT SIDEBAR: CHAT HISTORY ========== */}
      <div
        className={`w-64 border-r ${
          darkMode ? "border-zinc-700 bg-zinc-800" : "border-gray-100 bg-white"
        } flex flex-col`}
      >
        <div
          className={`p-4 border-b ${
            darkMode ? "border-zinc-700" : "border-gray-100"
          } flex justify-between items-center`}
        >
          <h2
            className={`text-sm font-semibold ${
              darkMode ? "text-gray-300" : "text-gray-900"
            }`}
          >
            History
          </h2>

          <div className="flex gap-2">
            <button
              onClick={startNewChat}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? "hover:bg-zinc-700" : "hover:bg-gray-100"
              }`}
              aria-label="New chat"
              title="New chat"
            >
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

            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? "hover:bg-zinc-700" : "hover:bg-gray-100"
              }`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
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

        <div className="flex-1 overflow-y-auto p-3">
          {history.length === 0 ? (
            <p
              className={`text-xs p-2 ${
                darkMode ? "text-gray-500" : "text-gray-400"
              }`}
            >
              No chats yet
            </p>
          ) : (
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
                <p
                  className={`text-xs truncate pr-6 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {item}
                </p>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteHistoryItem(index);
                  }}
                  className={`absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                  aria-label="Delete"
                >
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
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto scroll-smooth"
        >
          {!isClicked && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h1
                  className={`text-3xl font-semibold mb-2 ${
                    darkMode ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  Welcome to AI Chatbot
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

          {isClicked && (
            <div className="max-w-3xl mx-auto px-4 py-8">
              {chatHistory.map((item, index) => (
                <div key={index}>
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

                  {item.type === "answer" && (
                    <Answer
                      response={item.content}
                      err={null}
                      darkMode={darkMode}
                    />
                  )}

                  {item.type === "error" && (
                    <Answer
                      response={null}
                      err={item.content}
                      darkMode={darkMode}
                    />
                  )}
                </div>
              ))}

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
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              disabled={loading}
            />

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
              {loading ? "..." : "Ask"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
