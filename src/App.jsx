import { useState } from "react";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");

  async function generate() {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    setResult(
      data.candidates?.[0]?.content?.parts?.[0]?.text || "No response"
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>AI App Working</h1>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter prompt"
        style={{ width: "100%", height: 80 }}
      />

      <br /><br />

      <button onClick={generate}>Generate</button>

      <pre style={{ marginTop: 20 }}>{result}</pre>
    </div>
  );
}

