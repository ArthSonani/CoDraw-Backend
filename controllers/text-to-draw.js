export default async function handler(req, res) {
  const { prompt } = req.body;

  const systemPrompt = `
    You are an assistant that converts drawing ideas into JSON instructions.

    Canvas size is 500x500.
    Coordinates start at (0,0) in the top-left.

    ALWAYS return at least one shape.
    If the prompt is drawable, generate a simple representation.

    Given a prompt, return an array of objects with shape information.

    Each object must use one of these types:
    "circle", "rect", "line", or "triangle".

    Use these keys:
    - circle: type, x, y, radius, color
    - rect: type, x, y, width, height, color
    - line: type, x1, y1, x2, y2, color
    - triangle: type, points (array of 3 [x,y] pairs), color

    Return ONLY valid JSON.
    Do NOT include explanations or markdown.
    `;

  try {
    const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
        contents: [
            {
            role: "user",
            parts: [
                {
                text: `${systemPrompt}\n\nPrompt: ${prompt}`,
                },
            ],
            },
        ],
        }),
    }
    );



    const json = await geminiRes.json();
    if (json.error) {
        console.error("Gemini API Error:", json.error);
        return res.status(500).json({ error: json.error.message });
    }

    let reply = json.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    // Clean markdown formatting if present
    reply = reply.trim().replace(/^```json\s*|\s*```$/g, '');

    res.status(200).json({ text: reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gemini request failed" });
  }
}
