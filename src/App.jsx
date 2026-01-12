import { useState } from "react";
import { URL, API_KEY } from "./constants.js";
import Answer from "./Answer.jsx";

function App() {
  const [question, setQuestion] = useState("");
  const [isClicked, setIsClicked] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim() || loading) return;

    const currentQuestion = question;
    setQuestion("");
    setIsClicked(true);
    setLoading(true);
    setErr(null);

    // Add question to chat history
    setChatHistory((prev) => [
      ...prev,
      { type: "question", content: currentQuestion },
    ]);

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
      let dataString = data.choices[0].message.content;
      dataString = dataString.split("* ");
      dataString = dataString.map((item) => item.trim());

      // Add answer to chat history
      setChatHistory((prev) => [
        ...prev,
        { type: "answer", content: dataString || "No response" },
      ]);
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

  return (
    <div className="grid grid-cols-5 h-screen">
      {/* Sidebar */}
      <div className="col-span-1 bg-zinc-800 text-white p-4"></div>

      {/* Main Content */}
      <div className="col-span-4 text-white p-4 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-20">
          {!isClicked && (
            <div className="flex items-center justify-center h-full">
              <h1 className="text-2xl font-bold">AI Chatbot</h1>
            </div>
          )}

          {isClicked && (
            <div className="flex flex-col justify-center max-w-3xl mx-auto">
              {chatHistory.map((item, index) => (
                <div key={index}>
                  {item.type === "question" && (
                    <div className="flex justify-end">
                      <div className="bg-zinc-600 px-4 py-2 rounded-2xl max-w-2xl mt-5">
                        <p className="text-white">{item.content}</p>
                      </div>
                    </div>
                  )}
                  {item.type === "answer" && (
                    <Answer response={item.content} err={null} />
                  )}
                  {item.type === "error" && (
                    <Answer response={null} err={item.content} />
                  )}
                </div>
              ))}
              {loading && <div className="text-gray-400">Thinking...</div>}
            </div>
          )}
        </div>

        <div
          className={` ${
            isClicked
              ? "fixed bottom-6 ml-66"
              : ""
          } flex bg-zinc-700 p-4 rounded-2xl w-2/4 mx-auto shadow-lg border border-zinc-600`}
        >
          <input
            type="text"
            placeholder="Ask anything"
            className="ml-4 text-xl outline-0 bg-transparent text-white placeholder-gray-400 flex-1"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            disabled={loading}
          />
          <button
            type="button"
            onClick={handleAsk}
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
