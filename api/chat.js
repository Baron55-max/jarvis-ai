// ==========================================
// JARVIS FREE WEB KNOWLEDGE API V3
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
        // WIKIPEDIA SEARCH
        // ==========================================

        const searchURL =
            "https://en.wikipedia.org/w/api.php" +
            "?action=query" +
            "&list=search" +
            "&srsearch=" +
            encodeURIComponent(question) +
            "&srlimit=5" +
            "&srprop=snippet" +
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
                "Web search failed"
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
                    "I couldn't find information about that on the web. " +
                    "Try asking me to search Google."
            });

        }


        // ==========================================
        // BUILD ANSWER FROM SEARCH RESULTS
        // ==========================================

        let answer = "";


        const usefulResults =
            results.slice(0, 3);


        usefulResults.forEach((item, index) => {

            let snippet =
                item.snippet || "";


            // Remove HTML tags from Wikipedia snippets
            snippet =
                snippet.replace(
                    /<[^>]*>/g,
                    ""
                );


            // Decode common HTML entities
            snippet =
                snippet
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&amp;/g, "&")
                    .replace(/&lt;/g, "<")
                    .replace(/&gt;/g, ">");


            if (snippet) {

                if (index === 0) {

                    answer +=
                        snippet + " ";

                } else {

                    answer +=
                        snippet + " ";

                }
            }

        });


        // ==========================================
        // CLEAN ANSWER
        // ==========================================

        answer =
            answer.replace(
                /\s+/g,
                " "
            ).trim();


        // ==========================================
        // FALLBACK TO ARTICLE TITLE
        // ==========================================

        if (!answer) {

            answer =
                "I found information about " +
                results[0].title +
                " on Wikipedia.";

        }


        // ==========================================
        // KEEP ANSWER SHORT
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
        // SEND ANSWER
        // ==========================================

        return res.status(200).json({

            reply: answer,

            source: "Wikipedia",

            title: results[0].title

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
