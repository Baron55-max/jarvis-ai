// ==========================================
// JARVIS V7.2 — SMOOTH FEMALE VOICE
// + IMPROVED VOICE RECOGNITION
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

let availableVoices = [];


// ==========================================
// CONVERSATION MEMORY
// ==========================================

let conversation = [];

try {

    conversation =
        JSON.parse(
            localStorage.getItem(
                "jarvisConversation"
            )
        ) || [];

} catch {

    conversation = [];

}


function saveConversation() {

    if (conversation.length > 20) {

        conversation =
            conversation.slice(-20);

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
        "Conversation memory has been cleared."
    );

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
// LOAD VOICES
// ==========================================

function loadVoices() {

    if (!("speechSynthesis" in window)) {
        return;
    }

    availableVoices =
        speechSynthesis.getVoices();

}

loadVoices();

if ("speechSynthesis" in window) {

    speechSynthesis.onvoiceschanged =
        loadVoices;

}


// ==========================================
// FIND FEMALE VOICE
// ==========================================

function getFemaleVoice() {

    loadVoices();

    if (!availableVoices.length) {
        return null;
    }

    const preferredNames = [

        "Samantha",
        "Karen",
        "Moira",
        "Tessa",
        "Victoria",
        "Ava",
        "Allison",
        "Susan",
        "Zoe",
        "Nicky",
        "Fiona",
        "Veena",
        "Jenny",
        "Zira",
        "Google UK English Female",
        "Google US English Female"

    ];


    for (
        const name
        of preferredNames
    ) {

        const voice =
            availableVoices.find(
                v =>
                    v.name
                        .toLowerCase()
                        .includes(
                            name.toLowerCase()
                        )
            );

        if (voice) {
            return voice;
        }

    }


    const female =
        availableVoices.find(
            voice => {

                const name =
                    voice.name.toLowerCase();

                return (
                    name.includes("female") ||
                    name.includes("woman") ||
                    name.includes("samantha") ||
                    name.includes("karen") ||
                    name.includes("moira") ||
                    name.includes("tessa") ||
                    name.includes("victoria") ||
                    name.includes("ava")
                );

            }
        );


    if (female) {
        return female;
    }


    const english =
        availableVoices.find(
            voice =>
                voice.lang &&
                voice.lang
                    .toLowerCase()
                    .startsWith("en")
        );


    return english ||
        availableVoices[0];

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

        speechSynthesis.speak(
            silent
        );

        speechSynthesis.cancel();

    } catch {}

}


// ==========================================
// CLEAN TEXT FOR SPEECH
// ==========================================

function prepareSpeechText(text) {

    return text
        .replace(/https?:\/\/\S+/gi, "")
        .replace(/\s+/g, " ")
        .trim();

}


// ==========================================
// SPEAK
// ==========================================

function speak(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }

    if (!text) {
        return;
    }


    const speechText =
        prepareSpeechText(text);


    if (!speechText) {
        return;
    }


    try {

        speechSynthesis.cancel();


        const utterance =
            new SpeechSynthesisUtterance(
                speechText
            );


        const voice =
            getFemaleVoice();


        if (voice) {

            utterance.voice =
                voice;

            utterance.lang =
                voice.lang || "en-US";

        } else {

            utterance.lang =
                "en-US";

        }


        // Smooth female assistant voice

        utterance.rate =
            0.88;

        utterance.pitch =
            1.03;

        utterance.volume =
            1;


        utterance.onstart = () => {

            setCoreState(
                "speaking"
            );

        };


        utterance.onend = () => {

            setCoreState(null);

        };


        utterance.onerror = () => {

            setCoreState(null);

        };


        speechSynthesis.speak(
            utterance
        );


    } catch (error) {

        console.log(
            "Speech error:",
            error
        );

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

    response.textContent =
        text;


    if (remember) {

        rememberJarvis(text);

    }


    if (shouldSpeak) {

        speak(text);

    }

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
            "What would you like me to search for?"
        );

        return;

    }


    reply(
        "Searching Google for " +
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
        "Opening YouTube..."
    );

    setTimeout(() => {

        window.location.href =
            "https://www.youtube.com";

    }, 1200);

}


function openGoogle() {

    reply(
        "Opening Google..."
    );

    setTimeout(() => {

        window.location.href =
            "https://www.google.com";

    }, 1200);

}


function openGitHub() {

    reply(
        "Opening GitHub..."
    );

    setTimeout(() => {

        window.location.href =
            "https://github.com";

    }, 1200);

}


// ==========================================
// TIME
// ==========================================

function tellTime() {

    const now =
        new Date();


    const time =
        now.toLocaleTimeString(
            [],
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );


    reply(
        "The current time is " +
        time +
        "."
    );

}


// ==========================================
// DATE
// ==========================================

function tellDate() {

    const now =
        new Date();


    const date =
        now.toLocaleDateString(
            [],
            {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        );


    reply(
        "Today is " +
        date +
        "."
    );

}


// ==========================================
// IDENTITY
// ==========================================

function identity() {

    reply(
        "I am JARVIS, your personal AI assistant."
    );

}


// ==========================================
// CAPABILITIES
// ==========================================

function capabilities() {

    reply(
        "I can understand voice commands, " +
        "speak my responses, search web knowledge, " +
        "remember recent conversations, calculate numbers, " +
        "tell you the time, and open websites."
    );

}


// ==========================================
// CODING
// ==========================================

function codingHelp() {

    reply(
        "I can help you with HTML, CSS, JavaScript, " +
        "Python, C and other programming languages."
    );

}


// ==========================================
// GREETING
// ==========================================

function greeting() {

    const greetings = [

        "Good to hear from you. How can I assist?",

        "Hello. Systems are ready.",

        "At your service. What's the command?",

        "I'm listening. What would you like me to do?"

    ];


    const random =
        greetings[
            Math.floor(
                Math.random() *
                greetings.length
            )
        ];


    reply(random);

}


// ==========================================
// WEB KNOWLEDGE
// ==========================================

async function askWebAI(question) {

    setCoreState(
        "thinking"
    );


    response.textContent =
        "Searching my web knowledge...";


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

                        message:
                            question,

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


        reply(
            data.reply,
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
            "I couldn't access my web knowledge right now. " +
            "Try asking me to search Google for it."
        );

    }

}


// ==========================================
// SMART COMMAND SYSTEM
// ==========================================

function smartResponse(text) {

    const q =
        text.toLowerCase().trim();


    if (!q) {

        reply(
            "I'm listening."
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
        q.includes("hey jarvis")
    ) {

        greeting();

        return;

    }


    // IDENTITY

    if (
        q.includes("who are you") ||
        q.includes("what are you")
    ) {

        identity();

        return;

    }


    // CAPABILITIES

    if (
        q.includes("what can you do") ||
        q.includes("your abilities")
    ) {

        capabilities();

        return;

    }


    // TIME

    if (
        q.includes("what time is it") ||
        q.includes("tell me the time") ||
        q === "time"
    ) {

        tellTime();

        return;

    }


    // DATE

    if (
        q.includes("what is today's date") ||
        q.includes("what day is it") ||
        q.includes("today's date") ||
        q === "date"
    ) {

        tellDate();

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
        q.startsWith(
            "search google for"
        ) ||
        q.startsWith(
            "google search for"
        ) ||
        q.startsWith(
            "search for"
        )
    ) {

        googleSearch(text);

        return;

    }


    // CODING

    if (
        q.includes(
            "help me with coding"
        ) ||
        q.includes(
            "help me code"
        )
    ) {

        codingHelp();

        return;

    }


    // CALCULATOR

    const calculation =
        calculateExpression(text);


    if (
        calculation !== null
    ) {

        reply(
            "The answer is " +
            calculation +
            "."
        );

        return;

    }


    // WEB KNOWLEDGE

    askWebAI(text);

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
// ENTER
// ==========================================

input.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter"
        ) {

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


    // English recognition

    recognition.lang =
        "en-NG";


    recognition.onstart =
        () => {

            isListening =
                true;


            setCoreState(
                "listening"
            );


            response.textContent =
                "Listening...";

        };


    recognition.onresult =
        (event) => {

            const transcript =
                event
                    .results[0][0]
                    .transcript
                    .trim();


            if (!transcript) {

                isListening =
                    false;

                setCoreState(null);

                return;

            }


            input.value =
                transcript;


            isListening =
                false;


            rememberUser(
                transcript
            );


            smartResponse(
                transcript
            );

        };


    recognition.onerror =
        (event) => {

            isListening =
                false;


            setCoreState(
                null
            );


            console.log(
                "Voice recognition error:",
                event.error
            );


            if (
                event.error ===
                "not-allowed"
            ) {

                reply(
                    "Microphone permission is blocked. Please allow microphone access for JARVIS."
                );

            } else if (
                event.error ===
                "no-speech"
            ) {

                reply(
                    "I didn't hear anything. Please try again."
                );

            } else if (
                event.error ===
                "audio-capture"
            ) {

                reply(
                    "I can't access the microphone right now."
                );

            } else {

                reply(
                    "I couldn't understand that. Please try again."
                );

            }

        };


    recognition.onend =
        () => {

            isListening =
                false;


            if (
                !core.classList.contains(
                    "speaking"
                ) &&
                !core.classList.contains(
                    "thinking"
                )
            ) {

                setCoreState(
                    null
                );

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
                "Voice recognition is not supported by this browser."
            );

        }
    );

}


// ==========================================
// STARTUP
// ==========================================

console.log(
    "JARVIS V7.2 ONLINE — SMOOTH VOICE MODE"
);
