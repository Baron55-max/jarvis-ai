export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const { text } = req.body || {};

        if (!text) {
            return res.status(400).json({
                error: "No text provided"
            });
        }

        const apiKey = process.env.ELEVENLABS_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "ElevenLabs API key is not configured"
            });
        }

        const voiceId = "21m00Tcm4TlvDq8ikWAM";

        const elevenResponse = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                method: "POST",

                headers: {
                    "xi-api-key": apiKey,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg"
                },

                body: JSON.stringify({
                    text: text,
                    model_id: "eleven_flash_v2_5",
                    voice_settings: {
                        stability: 0.45,
                        similarity_boost: 0.8,
                        style: 0.25,
                        use_speaker_boost: true
                    }
                })
            }
        );

        if (!elevenResponse.ok) {
            const errorText = await elevenResponse.text();

            console.error(
                "ElevenLabs error:",
                errorText
            );

            return res.status(
                elevenResponse.status
            ).json({
                error: "ElevenLabs request failed"
            });
        }

        const audioBuffer = Buffer.from(
            await elevenResponse.arrayBuffer()
        );

        res.setHeader(
            "Content-Type",
            "audio/mpeg"
        );

        res.setHeader(
            "Cache-Control",
            "no-store"
        );

        return res.status(200).send(
            audioBuffer
        );

    } catch (error) {

        console.error(
            "TTS error:",
            error
        );

        return res.status(500).json({
            error: "Voice generation failed"
        });
    }
}
