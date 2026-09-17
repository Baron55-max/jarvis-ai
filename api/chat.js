// ==========================================
// JARVIS FREE WEB KNOWLEDGE API
// ==========================================

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

        // Clean the user's question
        const question = message
            .replace(/^jarvis[:,]?\s*/i, "")
            .trim();

        // ==========================================
        // WIKIPEDIA SEARCH
        // ==========================================

        const searchURL =
            "https://en.wikipedia.org/w/api.php" +
            "?action=query" +
            "&list=search" +
            "&srsearch=" +
            encodeURIComponent(question) +
            "&format=json" +
            "&origin=*";

        const searchResponse =
            await fetch(searchURL);

        if (!searchResponse.ok) {
            throw new Error("Wikipedia search failed");
        }

        const searchData =
            await searchResponse.json();

        const results =
            searchData?.query?.search || [];

        if (results.length === 0) {

            return res.status(200).json({
                reply:
                    "I couldn't find useful information about that. " +
                    "Try asking me to search Google for it."
            });

        }

        // ==========================================
        // GET BEST RESULT
        // ==========================================

        const title = results[0].title;

        const summaryURL =
            "https://en.wikipedia.org/api/rest_v1/page/summary/" +
            encodeURIComponent(title);

        const summaryResponse =
            await fetch(summaryURL);

        if (!summaryResponse.ok) {
            throw new Error("Wikipedia summary failed");
        }

        const summaryData =
            await summaryResponse.json();

        const extract =
            summaryData?.extract;

        if (!extract) {

            return res.status(200).json({
                reply:
                    "I found information about " +
                    title +
                    ", but I couldn't retrieve the details."
            });

        }

        // ==========================================
        // KEEP RESPONSE SHORT
        // ==========================================

        let answer = extract;

        if (answer.length > 900) {
            answer = answer.substring(0, 900);

            const lastSpace =
                answer.lastIndexOf(" ");

            if (lastSpace > 0) {
                answer =
                    answer.substring(0, lastSpace);
            }

            answer += "...";
        }

        return res.status(200).json({
            reply: answer,
            source: "Wikipedia"
        });

    } catch (error) {

        console.error("JARVIS WEB ERROR:", error);

        return res.status(500).json({
            error:
                "JARVIS could not access web knowledge right now."
        });
    }
}
