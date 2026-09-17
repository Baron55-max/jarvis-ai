// ==========================================
// JARVIS V9.0 — CLEAN WEB KNOWLEDGE
// ==========================================

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const body = req.body || {};

        const message =
            typeof body.message === "string"
                ? body.message.trim()
                : "";

        const conversation =
            Array.isArray(body.conversation)
                ? body.conversation
                : [];

        if (!message) {
            return res.status(400).json({
                error: "No message provided"
            });
        }


        // ==========================================
        // RECENT USER CONTEXT
        // ==========================================

        const recentUsers =
            conversation
                .filter(item =>
                    item &&
                    item.role === "user" &&
                    typeof item.content === "string"
                )
                .map(item =>
                    item.content.trim()
                )
                .filter(Boolean)
                .slice(-5);


        // ==========================================
        // FOLLOW-UP DETECTION
        // ==========================================

        const lower =
            message.toLowerCase();

        const followUpPatterns = [
            /\bhe\b/,
            /\bhim\b/,
            /\bhis\b/,
            /\bshe\b/,
            /\bher\b/,
            /\bthey\b/,
            /\bthem\b/,
            /\btheir\b/,
            /\bit\b/,
            /\bthat\b/,
            /\bthis\b/,
            /\bwhat about\b/,
            /\band what\b/,
            /\bhow old\b/,
            /\bwhere does\b/,
            /\bwhere did\b/,
            /\bwhen did\b/,
            /\bwhen was\b/,
            /\bwhich club\b/,
            /\bwhat club\b/
        ];

        const isFollowUp =
            followUpPatterns.some(
                pattern =>
                    pattern.test(lower)
            );


        // ==========================================
        // BUILD SEARCH QUERY
        // ==========================================

        let searchQuestion =
            message;

        if (
            isFollowUp &&
            recentUsers.length > 0
        ) {

            const previousQuestion =
                recentUsers[
                    recentUsers.length - 1
                ];

            searchQuestion =
                previousQuestion +
                " " +
                message;
        }


        // ==========================================
        // WIKIPEDIA SEARCH
        // ==========================================

        const searchURL =
            "https://en.wikipedia.org/w/api.php" +
            "?action=query" +
            "&list=search" +
            "&srsearch=" +
            encodeURIComponent(searchQuestion) +
            "&srlimit=1" +
            "&srprop=" +
            "&format=json" +
            "&origin=*";


        const searchResponse =
            await fetch(searchURL, {
                headers: {
                    "User-Agent":
                        "JARVIS-AI/1.0"
                }
            });


        if (!searchResponse.ok) {
            throw new Error(
                "Wikipedia search failed"
            );
        }


        const searchData =
            await searchResponse.json();


        const results =
            searchData?.query?.search || [];


        if (!results.length) {

            return res.status(200).json({
                reply:
                    "I couldn't find useful information about that."
            });
        }


        // ==========================================
        // GET THE SINGLE MOST RELEVANT ARTICLE
        // ==========================================

        const title =
            results[0].title;


        const summaryURL =
            "https://en.wikipedia.org/api/rest_v1/page/summary/" +
            encodeURIComponent(title);


        const summaryResponse =
            await fetch(summaryURL, {
                headers: {
                    "User-Agent":
                        "JARVIS-AI/1.0"
                }
            });


        if (!summaryResponse.ok) {

            throw new Error(
                "Wikipedia article lookup failed"
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
                ", but I couldn't retrieve the full article summary.";
        }


        // ==========================================
        // CLEAN ANSWER
        // ==========================================

        answer =
            answer
                .replace(/\s+/g, " ")
                .trim();


        // ==========================================
        // LIMIT LENGTH
        // ==========================================

        if (answer.length > 900) {

            answer =
                answer.substring(0, 900);

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
        // RETURN
        // ==========================================

        return res.status(200).json({

            reply: answer,

            source: "Wikipedia",

            title: title,

            memoryUsed:
                isFollowUp &&
                recentUsers.length > 0

        });


    } catch (error) {

        console.error(
            "JARVIS WEB ERROR:",
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
