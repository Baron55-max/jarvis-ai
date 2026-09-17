// JARVIS V10 - FREE WEB KNOWLEDGE + CONVERSATION CONTEXT

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const body = req.body || {};
        const message = String(body.message || "").trim();
        const conversation = Array.isArray(body.conversation)
            ? body.conversation
            : [];

        if (!message) {
            return res.status(400).json({
                error: "No message provided"
            });
        }

        // --------------------------------------------------
        // HELPERS
        // --------------------------------------------------

        function cleanText(text) {
            return String(text || "")
                .replace(/\s+/g, " ")
                .replace(/<[^>]*>/g, "")
                .trim();
        }

        function isFollowUp(text) {
            const lower = text.toLowerCase();

            return (
                /\b(he|him|his|she|her|hers|they|them|their|it|its)\b/.test(lower) ||
                /^(what|when|where|who|how|why|which|is|was|did|does|can|could|tell me)\b/.test(lower) &&
                lower.split(/\s+/).length <= 10
            );
        }

        function getPreviousUserMessage() {
            for (let i = conversation.length - 1; i >= 0; i--) {
                const item = conversation[i];

                if (
                    item &&
                    item.role === "user" &&
                    item.content &&
                    String(item.content).trim() !== message
                ) {
                    return String(item.content).trim();
                }
            }

            return "";
        }

        function extractNameFromQuestion(text) {
            const cleaned = cleanText(text);

            const patterns = [
                /who is (.+?)[?!.]?$/i,
                /tell me about (.+?)[?!.]?$/i,
                /what is (.+?)[?!.]?$/i,
                /who's (.+?)[?!.]?$/i
            ];

            for (const pattern of patterns) {
                const match = cleaned.match(pattern);

                if (match && match[1]) {
                    return match[1].trim();
                }
            }

            return "";
        }

        function looksLikeAgeQuestion(text) {
            const lower = text.toLowerCase();

            return (
                lower.includes("how old") ||
                lower.includes("age") ||
                lower.includes("years old")
            );
        }

        function calculateAgeFromText(text) {
            // Matches dates such as:
            // born 5 February 1985
            // born February 5, 1985
            // born 5 Feb 1985

            const months = {
                january: 0,
                february: 1,
                march: 2,
                april: 3,
                may: 4,
                june: 5,
                july: 6,
                august: 7,
                september: 8,
                october: 9,
                november: 10,
                december: 11,

                jan: 0,
                feb: 1,
                mar: 2,
                apr: 3,
                jun: 5,
                jul: 6,
                aug: 7,
                sep: 8,
                sept: 8,
                oct: 9,
                nov: 10,
                dec: 11
            };

            let day;
            let month;
            let year;

            let match = text.match(
                /born\s+(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{4})/i
            );

            if (match) {
                day = Number(match[1]);
                month = months[match[2].toLowerCase()];
                year = Number(match[3]);
            }

            if (!match) {
                match = text.match(
                    /born\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/i
                );

                if (match) {
                    month = months[match[1].toLowerCase()];
                    day = Number(match[2]);
                    year = Number(match[3]);
                }
            }

            if (!match || day === undefined || month === undefined || !year) {
                return null;
            }

            const today = new Date();

            let age = today.getFullYear() - year;

            const birthdayThisYear = new Date(
                today.getFullYear(),
                month,
                day
            );

            if (today < birthdayThisYear) {
                age--;
            }

            return age;
        }

        // --------------------------------------------------
        // DETERMINE SEARCH QUERY
        // --------------------------------------------------

        let searchQuery = message;
        let previousQuestion = "";

        if (isFollowUp(message)) {
            previousQuestion = getPreviousUserMessage();

            if (previousQuestion) {
                const previousSubject =
                    extractNameFromQuestion(previousQuestion);

                if (previousSubject) {
                    searchQuery = `${previousSubject} ${message}`;
                } else {
                    searchQuery = `${previousQuestion} ${message}`;
                }
            }
        }

        // --------------------------------------------------
        // SEARCH WIKIPEDIA
        // --------------------------------------------------

        const searchURL =
            "https://en.wikipedia.org/w/rest.php/v1/search/page?q=" +
            encodeURIComponent(searchQuery) +
            "&limit=5";

        const searchResponse = await fetch(searchURL, {
            headers: {
                "User-Agent": "JARVIS-AI/1.0"
            }
        });

        if (!searchResponse.ok) {
            throw new Error("Wikipedia search failed");
        }

        const searchData = await searchResponse.json();

        const pages = Array.isArray(searchData.pages)
            ? searchData.pages
            : [];

        if (pages.length === 0) {
            return res.status(200).json({
                reply:
                    "I couldn't find a reliable answer for that yet. Try asking me in a slightly different way.",
                source: "Wikipedia",
                memoryUsed: Boolean(previousQuestion)
            });
        }

        // --------------------------------------------------
        // PICK THE MOST RELEVANT RESULT
        // --------------------------------------------------

        let selectedPage = pages[0];

        const lowerQuery = searchQuery.toLowerCase();

        for (const page of pages) {
            const title = String(page.title || "").toLowerCase();

            if (
                lowerQuery.includes(title) ||
                title.includes(lowerQuery)
            ) {
                selectedPage = page;
                break;
            }
        }

        const title = selectedPage.title;

        // --------------------------------------------------
        // GET THE ACTUAL ARTICLE SUMMARY
        // --------------------------------------------------

        const summaryURL =
            "https://en.wikipedia.org/api/rest_v1/page/summary/" +
            encodeURIComponent(title);

        const summaryResponse = await fetch(summaryURL, {
            headers: {
                "User-Agent": "JARVIS-AI/1.0"
            }
        });

        if (!summaryResponse.ok) {
            throw new Error("Wikipedia summary failed");
        }

        const summaryData = await summaryResponse.json();

        let answer = cleanText(summaryData.extract);

        if (!answer) {
            answer = cleanText(
                selectedPage.excerpt ||
                selectedPage.description ||
                ""
            );
        }

        // --------------------------------------------------
        // AGE QUESTIONS
        // --------------------------------------------------

        if (looksLikeAgeQuestion(message)) {
            const age = calculateAgeFromText(answer);

            if (age !== null) {
                answer = `According to the available information, ${title} is ${age} years old.`;
            }
        }

        // --------------------------------------------------
        // KEEP RESPONSE CLEAN
        // --------------------------------------------------

        if (answer.length > 1200) {
            answer = answer.substring(0, 1200);

            const lastPeriod = answer.lastIndexOf(".");

            if (lastPeriod > 500) {
                answer = answer.substring(0, lastPeriod + 1);
            } else {
                answer += "...";
            }
        }

        return res.status(200).json({
            reply: answer,
            source: "Wikipedia",
            title,
            memoryUsed: Boolean(previousQuestion),
            searchQuery
        });

    } catch (error) {
        console.error("JARVIS ERROR:", error);

        return res.status(500).json({
            reply:
                "Sorry, I ran into a problem while searching for that information.",
            error: error.message
        });
    }
}
