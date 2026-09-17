// ================================
// JARVIS V3.5 - VOICE + SEARCH FIX
// ================================

const input = document.getElementById("commandInput");
const sendButton = document.getElementById("sendButton");
const micButton = document.getElementById("micButton");
const response = document.getElementById("response");
const systemTime = document.getElementById("systemTime");

const core = document.querySelector(".ai-core");
const coreWrapper = document.querySelector(".core-wrapper");


// ================================
// CORE STATE
// ================================

function setCoreState(state) {
    core.className = "ai-core " + state;
    coreWrapper.className = "core-wrapper " + state;
}


// ================================
// CLOCK
// ================================

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


// ================================
// VOICE ENGINE
// ================================

function prepareSpeech() {

    if (!("speechSynthesis" in window)) {
        return false;
    }

    window.speechSynthesis.cancel();

    const warmup =
        new SpeechSynthesisUtterance("");

    warmup.volume = 0;

    window.speechSynthesis.speak(warmup);

    return true;
}


function speak(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();

    setCoreState("speaking");

    const voice =
        new SpeechSynthesisUtterance(text);

    voice.rate = 0.95;
    voice.pitch = 0.85;
    voice.volume = 1;

    voice.onend = function() {
        setCoreState("idle");
    };

    voice.onerror = function() {
        setCoreState("idle");
    };

    setTimeout(function() {

        window.speechSynthesis.speak(voice);

    }, 100);
}


// ================================
// CALCULATOR
// ================================

function calculateExpression(text) {

    let expression = text
        .replace(/what is/gi, "")
        .replace(/calculate/gi, "")
        .replace(/compute/gi, "")
        .replace(/how much is/gi, "")
        .replace(/what's/gi, "")
        .replace(/=/g, "")
        .trim();

    expression = expression
        .replace(/plus/gi, "+")
        .replace(/minus/gi, "-")
        .replace(/times/gi, "*")
        .replace(/multiplied by/gi, "*")
        .replace(/divided by/gi, "/")
        .replace(/divide by/gi, "/");

    if (!/^[0-9+\-*/().%\s]+$/.test(expression)) {
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

    } catch (error) {

        return null;
    }
}


// ================================
// GOOGLE SEARCH
// ================================

function googleSearch(text) {

    let query = text
        .replace(/search google for/gi, "")
        .replace(/search google/gi, "")
        .replace(/google search for/gi, "")
        .replace(/google/gi, "")
        .replace(/search for/gi, "")
        .replace(/search/gi, "")
        .trim();

    if (!query) {
        return false;
    }

    const reply =
        `Searching Google for ${query}.`;

    response.textContent = reply;

    speak(reply);

    setTimeout(function() {

        const url =
            "https://www.google.com/search?q=" +
            encodeURIComponent(query);

        // Direct navigation works even when the
        // command came from voice recognition.
        window.location.href = url;

    }, 1200);

    return true;
}


// ================================
// COMMAND SYSTEM
// ================================

function runCommand(command) {

    const text =
        command.toLowerCase().trim();


    // ================================
    // TIME
    // ================================

    if (
        text.includes("what time") ||
        text === "time"
    ) {

        const now = new Date();

        const time =
            now.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit"
            });

        const reply =
            `The current time is ${time}.`;

        response.textContent = reply;

        speak(reply);

        return true;
    }


    // ================================
    // DATE
    // ================================

    if (
        text.includes("today's date") ||
        text.includes("what date") ||
        text === "date"
    ) {

        const now = new Date();

        const date =
            now.toLocaleDateString([], {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            });

        const reply =
            `Today is ${date}.`;

        response.textContent = reply;

        speak(reply);

        return true;
    }


    // ================================
    // CALCULATOR
    // ================================

    if (
        text.includes("calculate") ||
        text.includes("what is") ||
        text.includes("what's") ||
        text.includes("how much is") ||
        text.includes("compute")
    ) {

        const result =
            calculateExpression(text);

        if (result !== null) {

            const reply =
                `The answer is ${result}.`;

            response.textContent = reply;

            speak(reply);

            return true;
        }
    }


    // ================================
    // GOOGLE SEARCH
    // ================================

    if (
        text.startsWith("search") ||
        text.startsWith("google")
    ) {

        if (googleSearch(text)) {
            return true;
        }
    }


    // ================================
    // YOUTUBE
    // ================================

    if (text.includes("open youtube")) {

        const reply =
            "Opening YouTube.";

        response.textContent = reply;

        speak(reply);

        setTimeout(function() {

            window.location.href =
                "https://www.youtube.com";

        }, 1200);

        return true;
    }


    // ================================
    // GOOGLE
    // ================================

    if (text.includes("open google")) {

        const reply =
            "Opening Google.";

        response.textContent = reply;

        speak(reply);

        setTimeout(function() {

            window.location.href =
                "https://www.google.com";

        }, 1200);

        return true;
    }


    // ================================
    // GITHUB
    // ================================

    if (text.includes("open github")) {

        const reply =
            "Opening GitHub.";

        response.textContent = reply;

        speak(reply);

        setTimeout(function() {

            window.location.href =
                "https://github.com";

        }, 1200);

        return true;
    }


    // ================================
    // GREETING
    // ================================

    if (
        text === "hello" ||
        text === "hi" ||
        text.includes("hello jarvis")
    ) {

        const reply =
            "Good evening. JARVIS systems are online. How may I assist you?";

        response.textContent = reply;

        speak(reply);

        return true;
    }


    return false;
}


// ================================
// SEND COMMAND
// ================================

function sendCommand() {

    const command =
        input.value.trim();

    if (!command) {
        return;
    }

    input.value = "";

    const handled =
        runCommand(command);

    if (!handled) {

        const reply =
            "I don't have that command yet. My AI systems require an API connection for that request.";

        response.textContent = reply;

        speak(reply);
    }
}


// ================================
// SEND BUTTON
// ================================

sendButton.addEventListener(
    "click",
    sendCommand
);


// ================================
// ENTER KEY
// ================================

input.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {
            sendCommand();
        }
    }
);


// ================================
// QUICK COMMANDS
// ================================

function quickCommand(command) {

    input.value = command;

    sendCommand();
}


// ================================
// VOICE RECOGNITION
// ================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (SpeechRecognition) {

    const recognition =
        new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";


    micButton.addEventListener(
        "click",
        function() {

            prepareSpeech();

            response.textContent =
                "Listening...";

            setCoreState("listening");

            try {

                recognition.start();

            } catch (error) {

                console.log(error);
            }
        }
    );


    recognition.onresult =
        function(event) {

            const transcript =
                event.results[0][0].transcript;

            input.value =
                transcript;

            setTimeout(
                function() {

                    sendCommand();

                },
                300
            );
        };


    recognition.onend =
        function() {

            if (
                core.classList.contains(
                    "listening"
                )
            ) {

                setCoreState("idle");
            }
        };


    recognition.onerror =
        function(event) {

            console.log(
                "Speech recognition error:",
                event.error
            );

            response.textContent =
                "I couldn't hear you. Please try again.";

            setCoreState("idle");
        };


} else {

    micButton.addEventListener(
        "click",
        function() {

            response.textContent =
                "Voice recognition isn't supported here.";

            setCoreState("idle");
        }
    );
}
