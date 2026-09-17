// ==========================================
// JARVIS V4.0 — SMART FREE VERSION
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
// SYSTEM TIME
// ==========================================

function updateTime() {
    const now = new Date();

    systemTime.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

setInterval(updateTime, 1000);
updateTime();


// ==========================================
// CORE STATES
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
// SPEECH
// ==========================================

function speak(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = 0.95;
    utterance.pitch = 0.9;
    utterance.volume = 1;

    utterance.onstart = () => {
        setCoreState("speaking");
    };

    utterance.onend = () => {
        setCoreState(null);
    };

    speechSynthesis.speak(utterance);
}


// ==========================================
// DISPLAY RESPONSE
// ==========================================

function reply(text, shouldSpeak = true) {

    response.textContent = text;

    if (shouldSpeak) {
        speak(text);
    }
}


// ==========================================
// CALCULATOR
// ==========================================

function calculateExpression(text) {

    let expression = text
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

    // Only allow safe calculator characters
    if (!/^[0-9+\-*/().%\s]+$/.test(expression)) {
        return null;
    }

    try {
        const result = Function(
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

    const cleanQuery = query
        .replace(/^search google for/i, "")
        .replace(/^google search for/i, "")
        .replace(/^search for/i, "")
        .trim();

    if (!cleanQuery) {
        reply("What would you like me to search for?");
        return;
    }

    reply("Searching Google for " + cleanQuery + "...");

    setTimeout(() => {

        window.location.href =
            "https://www.google.com/search?q=" +
            encodeURIComponent(cleanQuery);

    }, 1200);
}


// ==========================================
// YOUTUBE
// ==========================================

function openYouTube() {

    reply("Opening YouTube...");

    setTimeout(() => {
        window.location.href = "https://www.youtube.com";
    }, 1200);
}


// ==========================================
// GOOGLE
// ==========================================

function openGoogle() {

    reply("Opening Google...");

    setTimeout(() => {
        window.location.href = "https://www.google.com";
    }, 1200);
}


// ==========================================
// GITHUB
// ==========================================

function openGitHub() {

    reply("Opening GitHub...");

    setTimeout(() => {
        window.location.href = "https://github.com";
    }, 1200);
}


// ==========================================
// TIME
// ==========================================

function tellTime() {

    const now = new Date();

    const time = now.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    });

    reply("The current time is " + time + ".");
}


// ==========================================
// DATE
// ==========================================

function tellDate() {

    const now = new Date();

    const date = now.toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });

    reply("Today is " + date + ".");
}


// ==========================================
// JARVIS IDENTITY
// ==========================================

function identity() {

    reply(
        "I am JARVIS, your personal AI assistant. " +
        "I can respond to commands, control this interface, " +
        "search the web, calculate numbers, and help you with everyday tasks."
    );
}


// ==========================================
// CAPABILITIES
// ==========================================

function capabilities() {

    reply(
        "I can search Google, open YouTube and GitHub, " +
        "tell you the time and date, perform calculations, " +
        "respond to common questions, and interact with you using voice."
    );
}


// ==========================================
// CODING HELP
// ==========================================

function codingHelp() {

    reply(
        "I can help with HTML, CSS, JavaScript, Python, " +
        "C and other programming concepts. " +
        "Tell me what you want to build and I'll guide you."
    );
}


// ==========================================
// GREETINGS
// ==========================================

function greeting() {

    const greetings = [
        "Good to hear from you. How can I assist?",
        "Hello. Systems are ready. What can I do for you?",
        "At your service. What's the command?",
        "I'm listening. What would you like me to do?"
    ];

    const random =
        greetings[Math.floor(Math.random() * greetings.length)];

    reply(random);
}


// ==========================================
// COMMON KNOWLEDGE
// ==========================================

function answerCommonQuestion(text) {

    const q = text.toLowerCase();

    if (
        q.includes("what is ai") ||
        q.includes("what is artificial intelligence")
    ) {
        reply(
            "Artificial intelligence is technology that allows computers " +
            "to perform tasks that normally require human intelligence, " +
            "such as understanding language, recognizing patterns and solving problems."
        );
        return true;
    }

    if (
        q.includes("what is ram") ||
        q.includes("what is random access memory")
    ) {
        reply(
            "RAM is temporary computer memory used to hold data and programs " +
            "that are currently being used. More RAM generally allows a device " +
            "to handle more tasks at the same time."
        );
        return true;
    }

    if (
        q.includes("what is rom") ||
        q.includes("what is read only memory")
    ) {
        reply(
            "ROM is non-volatile memory used to store information that normally " +
            "does not disappear when the device is powered off."
        );
        return true;
    }

    if (
        q.includes("what is a black hole") ||
        q.includes("what are black holes")
    ) {
        reply(
            "A black hole is a region of space where gravity is so strong " +
            "that nothing, including light, can escape once it passes the event horizon."
        );
        return true;
    }

    if (
        q.includes("who are you") ||
        q.includes("who is jarvis")
    ) {
        identity();
        return true;
    }

    return false;
}


// ==========================================
// SMART LOCAL RESPONSE
// ==========================================

function smartResponse(text) {

    const q = text.toLowerCase().trim();

    // Empty command
    if (!q) {
        reply("I'm listening.");
        return;
    }


    // Greetings
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


    // Identity
    if (
        q.includes("who are you") ||
        q.includes("what are you")
    ) {
        identity();
        return;
    }


    // Capabilities
    if (
        q.includes("what can you do") ||
        q.includes("your abilities") ||
        q.includes("help me")
    ) {
        capabilities();
        return;
    }


    // Time
    if (
        q.includes("what time is it") ||
        q.includes("tell me the time") ||
        q === "time"
    ) {
        tellTime();
        return;
    }


    // Date
    if (
        q.includes("what is today's date") ||
        q.includes("what day is it") ||
        q.includes("today's date") ||
        q === "date"
    ) {
        tellDate();
        return;
    }


    // Google
    if (
        q === "open google" ||
        q === "go to google"
    ) {
        openGoogle();
        return;
    }


    // YouTube
    if (
        q === "open youtube" ||
        q === "go to youtube"
    ) {
        openYouTube();
        return;
    }


    // GitHub
    if (
        q === "open github" ||
        q === "go to github"
    ) {
        openGitHub();
        return;
    }


    // Google search
    if (
        q.startsWith("search google for") ||
        q.startsWith("google search for") ||
        q.startsWith("search for")
    ) {
        googleSearch(text);
        return;
    }


    // Coding
    if (
        q.includes("help me with coding") ||
        q.includes("help me code") ||
        q.includes("write code")
    ) {
        codingHelp();
        return;
    }


    // Calculator
    const calculation = calculateExpression(text);

    if (calculation !== null) {
        reply("The answer is " + calculation + ".");
        return;
    }


    // Common knowledge
    if (answerCommonQuestion(text)) {
        return;
    }


    // Unknown command
    reply(
        "I understand your command, but my free local knowledge is limited. " +
        "Try asking me to search Google for it."
    );
}


// ==========================================
// SEND COMMAND
// ==========================================

function sendCommand() {

    const text = input.value.trim();

    if (!text) {
        return;
    }

    input.value = "";

    setCoreState("thinking");

    setTimeout(() => {
        smartResponse(text);
    }, 300);
}


// ==========================================
// SEND BUTTON
// ==========================================

sendButton.addEventListener("click", sendCommand);


// ==========================================
// ENTER KEY
// ==========================================

input.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        sendCommand();
    }

});


// ==========================================
// QUICK COMMANDS
// ==========================================

function quickCommand(command) {

    input.value = command;

    sendCommand();
}


// ==========================================
// VOICE RECOGNITION
// ==========================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SpeechRecognition) {

    recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";


    recognition.onstart = () => {

        isListening = true;

        setCoreState("listening");

        response.textContent =
            "Listening...";
    };


    recognition.onresult = (event) => {

        const transcript =
            event.results[0][0].transcript;

        input.value = transcript;

        setCoreState("thinking");

        setTimeout(() => {
            smartResponse(transcript);
        }, 300);
    };


    recognition.onerror = (event) => {

        isListening = false;

        setCoreState(null);

        if (event.error === "not-allowed") {
            reply(
                "Microphone permission is blocked. " +
                "Please allow microphone access for JARVIS.",
                true
            );
        } else {
            reply(
                "I couldn't understand that. Please try again.",
                true
            );
        }
    };


    recognition.onend = () => {

        isListening = false;

        if (
            !core.classList.contains("speaking") &&
            !core.classList.contains("thinking")
        ) {
            setCoreState(null);
        }
    };


    micButton.addEventListener("click", () => {

        if (isListening) {
            recognition.stop();
            return;
        }

        try {
            recognition.start();
        } catch (error) {
            console.log(error);
        }

    });

} else {

    micButton.addEventListener("click", () => {

        reply(
            "Voice recognition is not supported by this browser."
        );

    });

}


// ==========================================
// INITIAL MESSAGE
// ==========================================

console.log("JARVIS V4.0 ONLINE");
