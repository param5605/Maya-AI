require("dotenv").config();

const express = require("express");

const app = express();

app.use(express.json({ limit: "20kb" }));

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Check whether Maya's backend is running
app.get("/health", (req, res) => {
  res.json({
    status: "online",
    assistant: "Maya",
    aiConfigured: Boolean(GEMINI_API_KEY),
    provider: "Gemini"
  });
});

// Chat with Maya
app.post("/chat", async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(503).json({
        error: "Maya's Gemini API key is not configured."
      });
    }

    const message = req.body?.message;

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  "Your name is Maya. You are a friendly, " +
                  "warm, helpful AI companion. Speak naturally " +
                  "and casually, like a close friend. " +
                  "Keep simple answers concise. Be honest, " +
                  "kind, and respectful. Never claim you have " +
                  "performed an action unless you actually have."
              }
            ]
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: message.trim()
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 500
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Gemini API error:",
        response.status,
        JSON.stringify(data.error || {})
      );

      return res.status(502).json({
        error: "Maya couldn't reach Gemini. Please try again."
      });
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      return res.status(502).json({
        error: "Maya received an empty response. Try again."
      });
    }

    res.json({
      assistant: "Maya",
      reply: reply
    });

  } catch (error) {
    console.error("Maya backend error:", error.message);

    res.status(500).json({
      error: "Something went wrong. Please try again."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Maya backend listening on port ${PORT}`);
});