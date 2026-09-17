// JARVIS V11
// FREE WEB KNOWLEDGE + REAL FOLLOW-UP ANSWERS

export default async function handler(req, res) {
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

        // -----------------------------
        // HELPERS
        // -----------------------------

        const clean = (text) =>
            String(text || "")
                .replace(/<[^>]*>/g, "")
                .replace(/\s+/g, " ")
                .trim();

        function previousUserQuestion() {
            for (let i = conversation.length - 1; i >= 0; i--) {
                if (
                    conversation[i] &&
                    conversation[i].role === "user" &&
                    String(conversation[i].content || "").trim() !== message
                ) {
                    return String(conversation[i].content).trim();
                }
            }

            return "";
        }

        function getSubject(text) {
            const patterns = [
                /who is (.+?)[?!.]?$/i,
                /who's (.+?)[?!.]?$/i,
                /tell me about (.+?)[?!.]?$/i,
                /what is (.+?)[?!.]?$/i
            ];

            for (const pattern of patterns) {
                const match = text.match(pattern);

                if (match && match[1]) {
                    return match[1].trim();
                }
            }

            return "";
        }

        function isFollowUp(text) {
            const lower = text.toLowerCase();

            return (
                /\b(he|him|his|she|her|hers|they|them|their|it|its)\b/.test(lower) ||
                /^(how old|where is|where was|when was|when did|what team|which team|what country|what nationality|how tall|how many|what position|what club|what does)\b/i.test(lower)
            );
        }

        function getSearchQuery() {
            const previous = previousUserQuestion();

            if (!isFollowUp(message) || !previous) {
                return message;
            }

            const subject = getSubject(previous);

            if (subject) {
                return `${subject} ${message}`;
            }

            return `${previous} ${message}`;
        }

        // -----------------------------
        // AGE EXTRACTION
        // -----------------------------

        function getAge(text) {
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
                december: 11
            };

            let match = text.match(
                /born\s+(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i
            );

            if (!match) {
                match = text.match(
                    /born\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i
                );

                if (match) {
                    const month = months[match[1].toLowerCase()];
                    const day = Number(match[2]);
                    const year = Number(match[3]);

                    return calculateAge(year, month, day);
                }
            }

            if (match) {
                const day = Number(match[1]);
                const month = months[match[2].toLowerCase()];
                const year = Number(match[3]);

                return calculateAge(year, month, day);
            }

            // Fallback for common Wikipedia format:
            // (born 5 February 1985)
            const fallback = text.match(
                /\(born\s+(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\)/i
            );

            if (fallback) {
                const day = Number(fallback[1]);
                const month = months[fallback[2].toLowerCase()];
                const year = Number(fallback[3]);

                return calculateAge(year, month, day);
            }

            return null;
        }

        function calculateAge(year, month, day) {
            const today = new Date();

            let age = today.getFullYear() - year;

            const birthday = new Date(
                today.getFullYear(),
                month,
                day
            );

            if (today < birthday) {
                age--;
            }

            return age;
        }

        // -----------------------------
        // SEARCH WIKIPEDIA
        // -----------------------------

        const searchQuery = getSearchQuery();

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

        if (!pages.length) {
            return res.status(200).json({
                reply: "I couldn't find reliable information about that.",
                source: "Wikipedia",
                memoryUsed: Boolean(previousUserQuestion())
            });
        }

        // -----------------------------
        // CHOOSE RESULT
        // -----------------------------

        let page = pages[0];

        const lowerQuery = searchQuery.toLowerCase();

        for (const item of pages) {
            const title = String(item.title || "").toLowerCase();

            if (
                lowerQuery.includes(title) ||
                title.includes(lowerQuery)
            ) {
                page = item;
                break;
            }
        }

        const title = page.title;

        // -----------------------------
        // GET ARTICLE
        // -----------------------------

        const summaryURL =
            "https://en.wikipedia.org/api/rest_v1/page/summary/" +
            encodeURIComponent(title);

        const summaryResponse = await fetch(summaryURL, {
            headers: {
                "User-Agent": "JARVIS-AI/1.0"
            }
        });

        if (!summaryResponse.ok) {
            throw new Error("Wikipedia article failed");
        }

        const summaryData = await summaryResponse.json();

        const article = clean(
            summaryData.extract ||
            page.excerpt ||
            page.description ||
            ""
        );

        if (!article) {
            return res.status(200).json({
                reply: "I found the topic, but I couldn't retrieve enough information to answer that.",
                source: "Wikipedia",
                title
            });
        }

        // -----------------------------
        // ANSWER SPECIFIC QUESTIONS
        // -----------------------------

        const lowerMessage = message.toLowerCase();

        // AGE
        if (
            lowerMessage.includes("how old") ||
            lowerMessage === "age" ||
            lowerMessage.includes("years old")
        ) {
            const age = getAge(article);

            if (age !== null) {
                return res.status(200).json({
                    reply: `${title} is ${age} years old.`,
                    source: "Wikipedia",
                    title,
                    memoryUsed: true
                });
            }
        }

        // NATIONALITY
        if (
            lowerMessage.includes("nationality") ||
            lowerMessage.includes("where is he from") ||
            lowerMessage.includes("where is she from") ||
            lowerMessage.includes("where was he born") ||
            lowerMessage.includes("where was she born")
        ) {
            const sentences = article.split(/(?<=[.!?])\s+/);

            const useful = sentences.find(sentence =>
                /born|portuguese|british|american|nigerian|german|french|spanish|italian/i.test(sentence)
            );

            if (useful) {
                return res.status(200).json({
                    reply: clean(useful),
                    source: "Wikipedia",
                    title,
                    memoryUsed: true
                });
            }
        }

        // TEAM / CLUB
        if (
            lowerMessage.includes("what team") ||
            lowerMessage.includes("which team") ||
            lowerMessage.includes("what club") ||
            lowerMessage.includes("which club")
        ) {
            const sentences = article.split(/(?<=[.!?])\s+/);

            const useful = sentences.find(sentence =>
                /club|plays for|plays as|team|captains/i.test(sentence)
            );

            if (useful) {
                return res.status(200).json({
                    reply: clean(useful),
                    source: "Wikipedia",
                    title,
                    memoryUsed: true
                });
            }
        }

        // -----------------------------
        // NORMAL ANSWER
        // -----------------------------

        let answer = article;

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
            memoryUsed: Boolean(previousUserQuestion())
        });

    } catch (error) {
        console.error("JARVIS V11 ERROR:", error);

        return res.status(500).json({
            reply: "Sorry, I ran into a problem while getting that information.",
            error: error.message
        });
    }
}
