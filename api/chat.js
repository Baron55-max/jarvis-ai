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

        const response = await client.responses.create({

            model: "gpt-5",

            instructions: `
You are JARVIS, a highly capable personal AI assistant.

Your personality:
- Calm
- Intelligent
- Helpful
- Slightly futuristic
- Professional but friendly

Address the user naturally.
Keep responses concise unless the user asks for detail.

You are currently the user's personal JARVIS assistant.
            `,

            input: message

        });

        return res.status(200).json({
            reply: response.output_text
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "JARVIS encountered a system error."
        });
    }
}
