// ==========================================
// JARVIS V6.0 — WEB KNOWLEDGE + MEMORY API
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
        // SEARCH QUERY
        // ==========================================

        const searchURL =
            "https://en.wikipedia.org/w/api.php" +
            "?action=query" +
            "&list=search" +
            "&srsearch=" +
            encodeURIComponent(message) +
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
                    "I couldn't find useful information about that on the web. " +
                    "Try asking me to search Google for it."

            });

        }


        // ==========================================
        // BUILD WEB ANSWER
        // ==========================================

        let answer = "";


        const usefulResults =
            results.slice(0, 3);


        usefulResults.forEach(
            (item) => {

                let snippet =
                    item.snippet || "";


                // Remove HTML tags

                snippet =
                    snippet.replace(
                        /<[^>]*>/g,
                        ""
                    );


                // Decode HTML characters

                snippet =
                    snippet
                        .replace(
                            /&quot;/g,
                            '"'
                        )
                        .replace(
                            /&#39;/g,
                            "'"
                        )
                        .replace(
                            /&amp;/g,
                            "&"
                        )
                        .replace(
                            /&lt;/g,
                            "<"
                        )
                        .replace(
                            /&gt;/g,
                            ">"
                        );


                if (snippet) {

                    answer +=
                        snippet + " ";

                }

            }
        );


        answer =
            answer
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();


        // ==========================================
        // FALLBACK
        // ==========================================

        if (!answer) {

            answer =
                "I found information about " +
                results[0].title +
                " on Wikipedia.";

        }


        // ==========================================
        // MEMORY CONTEXT
        // ==========================================
        //
        // The browser sends recent conversation
        // history. We use it to improve follow-up
        // questions when possible.
        //

        const recentConversation =
            conversation
                .slice(-6)
                .filter(item =>
                    item &&
                    typeof item.content === "string"
                );


        if (
            recentConversation.length > 0 &&
            message.length < 40
        ) {

            const previousUserMessages =
                recentConversation
                    .filter(
                        item =>
                            item.role === "user"
                    )
                    .map(
                        item =>
                            item.content
                    );


            if (
                previousUserMessages.length > 0
            ) {

                answer =
                    answer +
                    " This answer relates to your recent question about " +
                    previousUserMessages[
                        previousUserMessages.length - 1
                    ] +
                    ".";

            }

        }


        // ==========================================
        // LIMIT ANSWER
        // ==========================================

        if (answer.length > 1100) {

            answer =
                answer.substring(
                    0,
                    1100
                );


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
        // RESPONSE
        // ==========================================

        return res.status(200).json({

            reply: answer,

            source: "Wikipedia",

            title: results[0].title,

            memoryUsed:
                recentConversation.length > 0

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
