import { useState } from "react";
import { API_KEY } from "./constants.js";

function App() {
  const [question, setQuestion] = useState("");
  const [isclicked, setIsClicked] = useState(false);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleask = async () => {
    if (!question.trim() || loading) return;

    setIsClicked(true);
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
              content: question,
            },
          ],
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error?.message || res.statusText);
      }

      const data = await res.json();
      setResponse(data.choices?.[0]?.message?.content || "No response");
    } catch (err) {
      console.error("Error fetching response:", err);
      setError(err?.message || "Failed to get response");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleask();
    }
  };

  return (
    <div className="grid grid-cols-5 h-screen">
      <div className="col-span-1 bg-zinc-800 text-white p-4"></div>
      <div className="col-span-4 text-white p-4 flex justify-center items-center flex-col gap-4">
        <div className="flex items-center mb-4">
          <h1 className={`${isclicked ? "hidden" : ""} text-2xl font-bold`}>
            AI Chatbot
          </h1>
        </div>

        {isclicked && (response || error) && (
          <div className="bg-zinc-700 p-4 rounded-2xl shadow-zinc-700 shadow-lg border border-zinc-600 w-2/4 max-h-64 overflow-y-auto">
            {error && <p className="text-red-400">{error}</p>}
            {response && (
              <p className="text-white whitespace-pre-wrap">{response}</p>
            )}
          </div>
        )}

        <div
          className={`flex ${
            isclicked ? "absolute bottom-24" : ""
          } bg-zinc-700 p-4 rounded-2xl w-2/4 justify-between items-center mx-auto shadow-zinc-700 shadow-lg border border-zinc-600`}
        >
          <input
            type="text"
            placeholder="Ask anything"
            className="ml-4 text-xl outline-0 bg-transparent text-white placeholder-gray-400 flex-1"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            type="button"
            onClick={handleask}
            className="bg-zinc-600 text-white px-4 py-2 rounded-2xl mr-1 disabled:opacity-50"
            disabled={loading || !question.trim()}
          >
            {loading ? "Thinking..." : "Ask"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
