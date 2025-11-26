import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, AnalysisMode } from "../types";

// Note: For Veo, we should instantiate a new client to ensure the latest key is used if the user selects one.
// For general usage, we can use a default instance.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeChatEnergy = async (files: File[], mode: AnalysisMode): Promise<AnalysisResult> => {
  const model = "gemini-2.5-flash"; // Good reasoning + vision capabilities
  
  const imageParts = await Promise.all(files.map(fileToGenerativePart));

  const systemPrompt = `
  You are the "Group Chat Energy Decoder". Your task is to analyze screenshots of a chat group (${mode} context) and generate a JSON dataset alongside a qualitative report.
  
  **Your Capabilities:**
  1. OCR & Attribution: Identify speakers, timestamps, and text.
  2. Subtext Analysis: Detect latency, tone, emojis, and unsaid words.
  3. Role Classification: Assign roles (Anchor, Spark, Glue, Ghost, Void, NPC).
  4. Reaction Analysis: Identify emoji reactions attached to messages, categorizing them by sentiment (positive, negative, neutral) and attributing them (Link Source = Reactor, Target = Message Author).
  5. Topic Necromancy: Identify who kills topics (silence follows) and who revives them.

  **CRITICAL ALGORITHM UPDATE:**
  When detecting roles and influence, you MUST consider:
  - **Message Frequency:** How often does a user speak? High volume doesn't always mean high influence (could be "The Spark" or noise).
  - **Response Latency:** How quickly do others reply to this user? Short latency = High Interest/Power. Long latency or ignored messages = Low Power or "The Void".
  - **Topic Initiation vs. Reply Ratio:** "Anchors" often have high reply rates to them but fewer initiations.
  - **Emoji Reactions:** If User A reacts to User B's message, create a link with type 'react' (or add to existing link) and include the reaction details.
  - **Topic Necromancy:**
    - **Topic Killer:** A user whose message is frequently followed by a long silence or the end of a thread. Award badge "Cold Shoulder King" or "Conversation Sniper".
    - **Topic Reviver:** A user who speaks after a long silence or successfully changes the topic when things get stale. Award badge "Hype Man", "Necromancer", or "Resurrector".

  **Output Requirements:**
  You must return a JSON object. The strict schema is defined below. DO NOT wrap the JSON in markdown code blocks. Just return the raw JSON string if possible, or wrap it in a recognizable block I can parse.

  **JSON Structure:**
  {
    "nodes": [
      {"id": "UserNames", "role": "The Anchor|The Spark|The Glue|The Ghost|The Void|NPC", "influence_score": 1-10, "sentiment_color": "#HexCode"}
    ],
    "links": [
      {
        "source": "UserA", 
        "target": "UserB", 
        "weight": 1-10, 
        "type": "reply|mention|react|conflict",
        "reactions": [
          { "emoji": "👍", "sentiment": "positive|negative|neutral", "count": 1 }
        ]
      }
    ],
    "energy_flow": {
      "peak_time": "e.g. 20:30",
      "dominant_emotion": "e.g. Anxious, Excited, Chill",
      "tension_level": "Low|Medium|High",
      "topic_summary": "Brief summary of what they are talking about"
    },
    "insights": [
       {
         "title": "Short catchy title (e.g. Secret Crush, Topic Killer)",
         "description": "Explanation of the finding",
         "type": "crush|beef|topic_killer|topic_saver",
         "involved_users": ["UserA", "UserB"]
       }
    ],
    "topic_badges": [
      {
        "user": "UserX",
        "title": "Cold Shoulder King",
        "type": "killer",
        "description": "Ended 3 active threads with one word answers.",
        "icon": "❄️"
      },
      {
        "user": "UserY",
        "title": "Hype Man",
        "type": "reviver",
        "description": "Started 4 new topics after silence.",
        "icon": "🔥"
      }
    ],
    "markdown_report": "A formatted markdown string containing: 1. Executive Summary. 2. Detailed Role Breakdown. 3. Suggestions for a specific user (pick one randomly) to improve their standing."
  }

  **Analysis Logic:**
  - **Power:** Who controls the flow? Who stops arguments?
  - **Mode Specifics:** 
    - If 'work': Focus on decision makers and bottlenecks.
    - If 'social': Focus on crushes, drama, and emotional support.
  - **Colors:** Use warm colors (Red/Orange) for high energy/conflict, Cool colors (Blue/Green) for calm/logic, Purple/Pink for mystery/flirting.

  Analyze the images provided now.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [...imageParts, { text: systemPrompt }],
      },
      config: {
        responseMimeType: "application/json", // Force JSON output
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    // Attempt to parse strictly
    try {
      const data = JSON.parse(text) as AnalysisResult;
      // Basic validation
      if (!data.nodes || !data.links) throw new Error("Invalid schema");
      return data;
    } catch (parseError) {
      console.error("JSON Parse failed", text);
      throw new Error("Failed to parse AI response. Please try again with clearer images.");
    }
  } catch (error) {
    console.error("Gemini API Error", error);
    throw error;
  }
};

// --- NEW FEATURES ---

export const editImageWithPrompt = async (imageFile: File, prompt: string) => {
  const imagePart = await fileToGenerativePart(imageFile);
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        imagePart,
        { text: prompt }
      ]
    }
  });

  // Extract image from response
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated.");
};

export const generateVeoVideo = async (imageFile: File, prompt: string, ratio: '16:9' | '9:16') => {
  // We must ensure we have a paid key selected for Veo
  // Assuming window.aistudio.hasSelectedApiKey() is checked in the UI
  
  // Create a fresh instance to pick up the key if it was just selected
  const videoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const imagePart = await fileToGenerativePart(imageFile);

  let operation = await videoAi.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt || "Animate this image",
    image: {
      imageBytes: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType,
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p', // standard for fast preview
      aspectRatio: ratio
    }
  });

  // Polling
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await videoAi.operations.getVideosOperation({operation: operation});
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed");

  // Fetch with key
  const res = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

export const searchWithGrounding = async (query: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return {
    text: response.text,
    groundingMetadata: response.candidates?.[0]?.groundingMetadata
  };
};