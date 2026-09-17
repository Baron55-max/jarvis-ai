import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                error: "No message provided"
            });
        }

        const result = await openai.responses.create({
            model: "gpt-5",
            instructions: `
You are JARVIS, a personal AI assistant.

Personality:
- Calm
- Intelligent
- Helpful
- Futuristic
- Professional but friendly

Keep responses concise unless the user asks for detail.
`,
            input: message
        });

        return res.status(200).json({
            reply: result.output_text
        });

    } catch (error) {
        console.error("JARVIS ERROR:", error);

        return res.status(500).json({
            error: "JARVIS encountered a system error."
        });
    }
}

