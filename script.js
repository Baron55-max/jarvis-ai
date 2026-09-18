// ==========================================
// JARVIS V9 — FRIENDLY BOSS MODE + ELEVENLABS
// ==========================================
const input = document.getElementById("commandInput");
const sendButton = document.getElementById("sendButton");
const micButton = document.getElementById("micButton");
const response = document.getElementById("response");
const systemTime = document.getElementById("systemTime");
const core = document.querySelector(".ai-core");
const coreWrapper = document.querySelector(".core-wrapper");
let recognition;
let isListening = false;
// ==========================================
// CONVERSATION MEMORY
// ==========================================
let conversation = [];
try {
    conversation =
        JSON.parse(
            localStorage.getItem("jarvisConversation")
        ) || [];
} catch {
    conversation = [];
}
function saveConversation() {
    if (conversation.length > 20) {
        conversation = conversation.slice(-20);
    }
    try {
        localStorage.setItem(
            "jarvisConversation",
            JSON.stringify(conversation)
        );
    } catch {}
}
function rememberUser(text) {
    conversation.push({
        role: "user",
        content: text
    });
    saveConversation();
}
function rememberJarvis(text) {
    conversation.push({
        role: "assistant",
        content: text
    });
    saveConversation();
}
// ==========================================
// FRIENDLY PERSONALITY
// ==========================================
function friendly(text, pidgin = false) {
    const lower = text.toLowerCase();
    if (
        lower.includes("boss") ||
        lower.includes("my guy") ||
        lower.includes("my gee")
    ) {
        return text;
    }
    if (Math.random() < 0.35) {
        return "Boss, " + text;
    }
    return text;
}
// ==========================================
// CORE STATE
// ==========================================
function setCoreState(state) {
    core.classList.remove(
        "listening",
        "thinking",
        "speaking"
    );
    coreWrapper.classList.remove(
        "listening",
        "thinking",
        "speaking"
    );
    if (state) {
        core.classList.add(state);
        coreWrapper.classList.add(state);
    }
}
// ==========================================
// CLOCK
// ==========================================
function updateTime() {
    const now = new Date();
    systemTime.textContent =
        now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
}
setInterval(updateTime, 1000);
updateTime();
// ==========================================
// PIDGIN DETECTION
// ==========================================
function isPidgin(text) {
    const q = text.toLowerCase();
    const words = [
        "abeg",
        "wetin",
        "dey",
        "na",
        "nko",
        "abi",
        "oya",
        "wahala",
        "una",
        "dem",
        "fit",
        "sha",
        "sef",
        "buh",
        "make i",
        "make we",
        "i wan",
        "i dey",
        "you dey",
        "how far",
        "how body",
        "no wahala",
        "bros",
        "my guy",
        "my gee",
        "guy",
        "wetin be",
        "which one",
        "how much",
        "where e dey",
        "e dey",
        "dey work",
        "dey do"
    ];
    return words.some(
        word => q.includes(word)
    );
}
// ==========================================
// SPEECH UNLOCK
// ==========================================
function unlockSpeech() {
    if (!("speechSynthesis" in window)) {
        return;
    }
    try {
        speechSynthesis.cancel();
        const silent =
            new SpeechSynthesisUtterance("");
        silent.volume = 0;
        speechSynthesis.speak(silent);
        speechSynthesis.cancel();
    } catch {}
}
// ==========================================
// PREPARE TEXT
// ==========================================
function prepareSpeechText(text) {
    return text
        .replace(/https?:\/\/\S+/gi, "")
        .replace(/\*\*/g, "")
        .replace(/[*_#`]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}
// ==========================================
// ELEVENLABS VOICE
// ==========================================
let currentAudio = null;
async function speak(text) {
    if (!text) {
        return;
    }
    const speechText =
        prepareSpeechText(text);
    if (!speechText) {
        return;
    }
    try {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        setCoreState("speaking");
        const result =
            await fetch(
                "/api/tts",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        text: speechText
                    })
                }
            );
        if (!result.ok) {
            throw new Error(
                "ElevenLabs voice failed"
            );
        }
        const audioBlob =
            await result.blob();
        const audioUrl =
            URL.createObjectURL(
                audioBlob
            );
        currentAudio =
            new Audio(audioUrl);
        currentAudio.volume = 1;
        currentAudio.onended = () => {
            setCoreState(null);
            URL.revokeObjectURL(
                audioUrl
            );
        };
        currentAudio.onerror = () => {
            setCoreState(null);
            URL.revokeObjectURL(
                audioUrl
            );
        };
        await currentAudio.play();
    } catch (error) {
        console.error(
            "ElevenLabs voice error:",
            error
        );
        setCoreState(null);
        // Fallback to browser voice
        if ("speechSynthesis" in window) {
            try {
                speechSynthesis.cancel();
                const utterance =
                    new SpeechSynthesisUtterance(
                        speechText
                    );
                utterance.lang = "en-NG";
                utterance.rate = 0.86;
                utterance.pitch = 1.02;
                utterance.onstart = () => {
                    setCoreState("speaking");
                };
                utterance.onend = () => {
                    setCoreState(null);
                };
                speechSynthesis.speak(
                    utterance
                );
            } catch {}
        }
    }
}
// ==========================================
// REPLY
// ==========================================
function reply(
    text,
    shouldSpeak = true,
    remember = true
) {
    response.textContent = text;
    if (remember) {
        rememberJarvis(text);
    }
    if (shouldSpeak) {
        speak(text);
    }
}
// ==========================================
// CLEAR MEMORY
// ==========================================
function clearMemory() {
    conversation = [];
    try {
        localStorage.removeItem(
            "jarvisConversation"
        );
    } catch {}
    reply(
        "Boss, I've cleared our conversation memory."
    );
}
// ==========================================
// CALCULATOR
// ==========================================
function calculateExpression(text) {
    let expression =
        text
            .toLowerCase()
            .replace(/what is/g, "")
            .replace(/calculate/g, "")
            .replace(/equals/g, "")
            .replace(/equal to/g, "")
            .replace(/plus/g, "+")
            .replace(/minus/g, "-")
            .replace(/times/g, "*")
            .replace(/multiplied by/g, "*")
            .replace(/divided by/g, "/")
            .replace(/over/g, "/")
            .replace(/into/g, "*")
            .replace(/x/g, "*")
            .trim();
    if (
        !/^[0-9+\-*/().%\s]+$/.test(
            expression
        )
    ) {
        return null;
    }
    try {
        const result =
            Function(
                `"use strict"; return (${expression})`
            )();
        if (!Number.isFinite(result)) {
            return null;
        }
        return result;
    } catch {
        return null;
    }
}
// ==========================================
// GOOGLE SEARCH
// ==========================================
function googleSearch(query) {
    const cleanQuery =
        query
            .replace(
                /^search google for/i,
                ""
            )
            .replace(
                /^google search for/i,
                ""
            )
            .replace(
                /^search for/i,
                ""
            )
            .trim();
    if (!cleanQuery) {
        reply(
            "Boss, what should I search for?"
        );
        return;
    }
    reply(
        "Boss, I'm searching Google for " +
        cleanQuery +
        "..."
    );
    setTimeout(() => {
        window.location.href =
            "https://www.google.com/search?q=" +
            encodeURIComponent(
                cleanQuery
            );
    }, 1200);
}
// ==========================================
// OPEN WEBSITES
// ==========================================
function openYouTube() {
    reply(
        "Boss, I'm opening YouTube."
    );
    setTimeout(() => {
        window.location.href =
            "https://www.youtube.com";
    }, 1200);
}
function openGoogle() {
    reply(
        "Boss, I'm opening Google."
    );
    setTimeout(() => {
        window.location.href =
            "https://www.google.com";
    }, 1200);
}
function openGitHub() {
    reply(
        "Boss, I'm opening GitHub."
    );
    setTimeout(() => {
        window.location.href =
            "https://github.com";
    }, 1200);
}
// ==========================================
// TIME
// ==========================================
function tellTime(pidgin = false) {
    const now = new Date();
    const time =
        now.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        });
    reply(
        pidgin
            ? "Boss, the time now na " +
              time +
              "."
            : "Boss, the current time is " +
              time +
              "."
    );
}
// ==========================================
// DATE
// ==========================================
function tellDate(pidgin = false) {
    const now = new Date();
    const date =
        now.toLocaleDateString([], {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    reply(
        pidgin
            ? "Boss, today na " +
              date +
              "."
            : "Boss, today is " +
              date +
              "."
    );
}
// ==========================================
// IDENTITY
// ==========================================
function identity(pidgin = false) {
    reply(
        pidgin
            ? "I be JARVIS, your personal AI assistant, Boss. I dey here to help you."
            : "I'm JARVIS, your personal AI assistant, Boss. I'm here to help you."
    );
}
// ==========================================
// CAPABILITIES
// ==========================================
function capabilities(pidgin = false) {
    reply(
        pidgin
            ? "Boss, I fit answer questions, search the web, calculate things, remember our recent conversation, talk to you, and open websites."
            : "Boss, I can answer questions, search the web, calculate things, remember our recent conversation, speak to you, and open websites."
    );
}
// ==========================================
// CODING
// ==========================================
function codingHelp(pidgin = false) {
    reply(
        pidgin
            ? "Boss, I fit help you with HTML, CSS, JavaScript, Python, C and plenty other programming languages."
            : "Boss, I can help you with HTML, CSS, JavaScript, Python, C and plenty of other programming languages."
    );
}
// ==========================================
// GREETING
// ==========================================
function greeting(pidgin = false) {
    if (pidgin) {
        const greetings = [
            "How far, Boss? I dey here. Wetin you wan do?",
            "Omo, Boss don show. How I fit help you?",
            "I dey listen, Boss. Wetin you need?",
            "No wahala, Boss. JARVIS dey online.",
            "Welcome back, Boss. Wetin we dey work on?"
        ];
        reply(
            greetings[
                Math.floor(
                    Math.random() *
                    greetings.length
                )
            ]
        );
    } else {
        const greetings = [
            "Good to hear from you, Boss. How can I assist?",
            "Welcome back, Boss. Systems are ready.",
            "At your service, Boss. What's the command?",
            "I'm listening, Boss. What are we working on?",
            "Good to see you, Boss. What can I do for you?"
        ];
        reply(
            greetings[
                Math.floor(
                    Math.random() *
                    greetings.length
                )
            ]
        );
    }
}
// ==========================================
// WEB KNOWLEDGE
// ==========================================
async function askWebAI(
    question,
    pidgin = false
) {
    setCoreState("thinking");
    response.textContent =
        pidgin
            ? "Boss, make I check my web knowledge..."
            : "Boss, let me check my web knowledge...";
    try {
        const result =
            await fetch(
                "/api/chat",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        message: question,
                        conversation:
                            conversation.slice(-10)
                    })
                }
            );
        const data =
            await result.json();
        if (!result.ok) {
            throw new Error(
                data.error ||
                "Request failed"
            );
        }
        if (!data.reply) {
            throw new Error(
                "No response received"
            );
        }
        setCoreState(null);
        let answer =
            data.reply;
        if (pidgin) {
            answer =
                convertToPidgin(answer);
        }
        answer =
            friendly(
                answer,
                pidgin
            );
        reply(
            answer,
            true,
            true
        );
    } catch (error) {
        console.error(
            "JARVIS WEB ERROR:",
            error
        );
        setCoreState(null);
        reply(
            pidgin
                ? "Boss, I no fit reach my web knowledge right now. Try make I search Google for am."
                : "Boss, I couldn't access my web knowledge right now. Try asking me to search Google for it."
        );
    }
}
// ==========================================
// ENGLISH → PIDGIN
// ==========================================
function convertToPidgin(text) {
    let answer = text;
    const replacements = [
        [/\bI am\b/gi, "I be"],
        [/\bI'm\b/gi, "I dey"],
        [/\bI have\b/gi, "I get"],
        [/\bI can\b/gi, "I fit"],
        [/\bI cannot\b/gi, "I no fit"],
        [/\bI can't\b/gi, "I no fit"],
        [/\bYou are\b/gi, "You dey"],
        [/\bYou have\b/gi, "You get"],
        [/\bYou can\b/gi, "You fit"],
        [/\bIt is\b/gi, "E be"],
        [/\bIt's\b/gi, "E be"],
        [/\bThey are\b/gi, "Dem dey"],
        [/\bThere is\b/gi, "E get"],
        [/\bThere are\b/gi, "E get"],
        [/\bDo not\b/gi, "No"],
        [/\bDon't\b/gi, "No"],
        [/\bCannot\b/gi, "No fit"],
        [/\bPlease\b/gi, "Abeg"],
        [/\bNo problem\b/gi, "No wahala"],
        [/\bcurrently\b/gi, "now"],
        [/\bvery\b/gi, "well well"]
    ];
    for (const [
        pattern,
        replacement
    ] of replacements) {
        answer =
            answer.replace(
                pattern,
                replacement
            );
    }
    return answer;
}
// ==========================================
// SMART COMMAND SYSTEM
// ==========================================
function smartResponse(text) {
    const q =
        text.toLowerCase().trim();
    const pidgin =
        isPidgin(text);
    if (!q) {
        reply(
            pidgin
                ? "I dey listen, Boss."
                : "I'm listening, Boss."
        );
        return;
    }
    // CLEAR MEMORY
    if (
        q === "clear memory" ||
        q === "forget everything" ||
        q === "clear conversation"
    ) {
        clearMemory();
        return;
    }
    // GREETINGS
    if (
        q === "hello" ||
        q === "hi" ||
        q === "hey" ||
        q.includes("hello jarvis") ||
        q.includes("hey jarvis") ||
        q.includes("good morning") ||
        q.includes("good afternoon") ||
        q.includes("good evening")
    ) {
        greeting(pidgin);
        return;
    }
    // IDENTITY
    if (
        q.includes("who are you") ||
        q.includes("what are you")
    ) {
        identity(pidgin);
        return;
    }
    // CAPABILITIES
    if (
        q.includes("what can you do") ||
        q.includes("your abilities")
    ) {
        capabilities(pidgin);
        return;
    }
    // TIME
    if (
        q.includes("what time is it") ||
        q.includes("tell me the time") ||
        q === "time" ||
        q.includes("wetin be the time")
    ) {
        tellTime(pidgin);
        return;
    }
    // DATE
    if (
        q.includes("what is today's date") ||
        q.includes("what day is it") ||
        q.includes("today's date") ||
        q === "date" ||
        q.includes("wetin be today's date")
    ) {
        tellDate(pidgin);
        return;
    }
    // GOOGLE
    if (
        q === "open google" ||
        q === "go to google"
    ) {
        openGoogle();
        return;
    }
    // YOUTUBE
    if (
        q === "open youtube" ||
        q === "go to youtube"
    ) {
        openYouTube();
        return;
    }
    // GITHUB
    if (
        q === "open github" ||
        q === "go to github"
    ) {
        openGitHub();
        return;
    }
    // GOOGLE SEARCH
    if (
        q.startsWith("search google for") ||
        q.startsWith("google search for") ||
        q.startsWith("search for")
    ) {
        googleSearch(text);
        return;
    }
    // CODING
    if (
        q.includes("help me with coding") ||
        q.includes("help me code") ||
        q.includes("help me with code")
    ) {
        codingHelp(pidgin);
        return;
    }
    // CALCULATOR
    const calculation =
        calculateExpression(text);
    if (calculation !== null) {
        reply(
            pidgin
                ? "Boss, the answer na " +
                  calculation +
                  "."
                : "Boss, the answer is " +
                  calculation +
                  "."
        );
        return;
    }
    // WEB KNOWLEDGE
    askWebAI(
        text,
        pidgin
    );
}
// ==========================================
// SEND COMMAND
// ==========================================
function sendCommand() {
    const text =
        input.value.trim();
    if (!text) {
        return;
    }
    input.value = "";
    rememberUser(text);
    smartResponse(text);
}
// ==========================================
// SEND BUTTON
// ==========================================
sendButton.addEventListener(
    "click",
    () => {
        unlockSpeech();
        sendCommand();
    }
);
// ==========================================
// ENTER KEY
// ==========================================
input.addEventListener(
    "keydown",
    event => {
        if (event.key === "Enter") {
            unlockSpeech();
            sendCommand();
        }
    }
);
// ==========================================
// QUICK COMMAND
// ==========================================
function quickCommand(command) {
    unlockSpeech();
    input.value =
        command;
    sendCommand();
}
// ==========================================
// VOICE RECOGNITION
// ==========================================
const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;
if (SpeechRecognition) {
    recognition =
        new SpeechRecognition();
    recognition.continuous =
        false;
    recognition.interimResults =
        false;
    recognition.lang =
        "en-NG";
    recognition.onstart =
        () => {
            isListening = true;
            setCoreState(
                "listening"
            );
            response.textContent =
                "Listening, Boss...";
        };
    recognition.onresult =
        event => {
            const transcript =
                event
                    .results[0][0]
                    .transcript
                    .trim();
            if (!transcript) {
                isListening = false;
                setCoreState(null);
                return;
            }
            input.value =
                transcript;
            isListening = false;
            rememberUser(
                transcript
            );
            smartResponse(
                transcript
            );
        };
    recognition.onerror =
        event => {
            isListening = false;
            setCoreState(null);
            console.log(
                "Voice recognition error:",
                event.error
            );
            if (
                event.error ===
                "not-allowed"
            ) {
                reply(
                    "Boss, abeg allow microphone access for JARVIS."
                );
            } else if (
                event.error ===
                "no-speech"
            ) {
                reply(
                    "Boss, I no hear anything. Try again."
                );
            } else if (
                event.error ===
                "audio-capture"
            ) {
                reply(
                    "Boss, I no fit access the microphone right now."
                );
            } else {
                reply(
                    "Boss, I no understand that one. Try again."
                );
            }
        };
    recognition.onend =
        () => {
            isListening = false;
            if (
                !core.classList.contains(
                    "speaking"
                ) &&
                !core.classList.contains(
                    "thinking"
                )
            ) {
                setCoreState(null);
            }
        };
    micButton.addEventListener(
        "click",
        () => {
            unlockSpeech();
            if (isListening) {
                recognition.stop();
                return;
            }
            try {
                recognition.start();
            } catch (error) {
                console.log(
                    "Recognition start error:",
                    error
                );
            }
        }
    );
} else {
    micButton.addEventListener(
        "click",
        () => {
            reply(
                "Boss, voice recognition is not supported by this browser."
            );
        }
    );
}
// ==========================================
// STARTUP
// ==========================================
console.log(
    "JARVIS V9 ONLINE — ELEVENLABS VOICE"
);
