// ==========================================
// JARVIS V7.0 — WEB KNOWLEDGE + CONTEXT
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
        // GET RECENT USER QUESTIONS
        // ==========================================

        const recentUsers =
            conversation
                .filter(item =>
                    item &&
                    item.role === "user" &&
                    typeof item.content === "string"
                )
                .map(item => item.content.trim())
                .filter(Boolean)
                .slice(-5);


        // ==========================================
        // DETECT FOLLOW-UP QUESTIONS
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
            /\bthere\b/,
            /\bthat person\b/,
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
            recentUsers.length >= 2
        ) {

            const previousQuestion =
                recentUsers[
                    recentUsers.length - 2
                ];

            searchQuestion =
                previousQuestion +
                " " +
                message;

        } else if (
            isFollowUp &&
            recentUsers.length === 1
        ) {

            searchQuestion =
                recentUsers[0] +
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
        // BUILD ANSWER
        // ==========================================

        let answer = "";


        const usefulResults =
            results.slice(0, 3);


        usefulResults.forEach(
            (item) => {

                let snippet =
                    item.snippet || "";


                snippet =
                    snippet.replace(
                        /<[^>]*>/g,
                        ""
                    );


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
        // REMOVE DUPLICATE SENTENCES
        // ==========================================

        const sentences =
            answer
                .split(/(?<=[.!?])\s+/);


        const uniqueSentences = [];


        for (
            const sentence
            of sentences
        ) {

            const clean =
                sentence.trim();


            if (
                clean &&
                !uniqueSentences.some(
                    existing =>
                        existing
                            .toLowerCase()
                            === clean.toLowerCase()
                )
            ) {

                uniqueSentences.push(
                    clean
                );

            }

        }


        answer =
            uniqueSentences.join(" ");


        // ==========================================
        // LIMIT ANSWER
        // ==========================================

        if (answer.length > 1000) {

            answer =
                answer.substring(
                    0,
                    1000
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
        // SEND RESPONSE
        // ==========================================

        return res.status(200).json({

            reply: answer,

            source: "Wikipedia",

            title:
                results[0].title,

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
