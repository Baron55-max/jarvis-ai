// ==========================================
// JARVIS FREE WEB KNOWLEDGE API V2
// ==========================================

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const { message } = req.body || {};

        if (!message || !message.trim()) {
            return res.status(400).json({
                error: "No message provided"
            });
        }

        const question = message
            .replace(/^jarvis[:,]?\s*/i, "")
            .trim();


        // ==========================================
        // SEARCH WIKIPEDIA
        // ==========================================

        const searchURL =
            "https://en.wikipedia.org/w/api.php" +
            "?action=query" +
            "&list=search" +
            "&srsearch=" +
            encodeURIComponent(question) +
            "&srlimit=3" +
            "&format=json" +
            "&origin=*";

        const searchResponse =
            await fetch(searchURL);

        if (!searchResponse.ok) {
            throw new Error(
                "Wikipedia search failed"
            );
        }

        const searchData =
            await searchResponse.json();

        const results =
            searchData?.query?.search || [];


        // ==========================================
        // NO RESULTS
        // ==========================================

        if (results.length === 0) {

            return res.status(200).json({
                reply:
                    "I couldn't find useful information about that. " +
                    "You can ask me to search Google instead."
            });

        }


        // ==========================================
        // GET BEST ARTICLE
        // ==========================================

        const title =
            results[0].title;


        const summaryURL =
            "https://en.wikipedia.org/api/rest_v1/page/summary/" +
            encodeURIComponent(title);


        const summaryResponse =
            await fetch(summaryURL);


        if (!summaryResponse.ok) {
            throw new Error(
                "Wikipedia summary failed"
            );
        }


        const summaryData =
            await summaryResponse.json();


        let answer =
            summaryData?.extract;


        // ==========================================
        // FALLBACK
        // ==========================================

        if (!answer) {

            answer =
                "I found information about " +
                title +
                ", but I couldn't retrieve the full details.";
        }


        // ==========================================
        // LIMIT RESPONSE LENGTH
        // ==========================================

        if (answer.length > 1000) {

            answer =
                answer.substring(0, 1000);

            const lastSpace =
                answer.lastIndexOf(" ");

            if (lastSpace > 0) {

                answer =
                    answer.substring(
                        0,
                        lastSpace
                    );
            }

            answer += "...";
        }


        // ==========================================
        // SEND RESPONSE
        // ==========================================

        return res.status(200).json({

            reply: answer,

            source: "Wikipedia",

            title: title

        });

    } catch (error) {

        console.error(
            "JARVIS API ERROR:",
            error
        );

        return res.status(500).json({

            error:
                "JARVIS could not access web knowledge right now.",

            details:
                error.message

        });
    }
}
