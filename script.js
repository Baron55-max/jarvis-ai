// ================================
// JARVIS V2 - AI CONNECTION
// ================================

const input = document.getElementById("commandInput");
const sendButton = document.getElementById("sendButton");
const micButton = document.getElementById("micButton");
const response = document.getElementById("response");
const systemTime = document.getElementById("systemTime");


// ================================
// CLOCK
// ================================

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


// ================================
// JARVIS VOICE
// ================================

function speak(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();

    const voice = new SpeechSynthesisUtterance(text);

    voice.rate = 0.95;
    voice.pitch = 0.85;
    voice.volume = 1;

    window.speechSynthesis.speak(voice);
}


// ================================
// TALK TO JARVIS AI
// ================================

async function askJarvis(message) {

    response.textContent = "Thinking...";

    try {

        const result = await fetch("/api/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: message
            })

        });

        const data = await result.json();

        if (!result.ok) {
            throw new Error(data.error || "AI request failed");
        }

        response.textContent = data.reply;

        speak(data.reply);

    } catch (error) {

        console.error(error);

        response.textContent =
            "I can't reach my AI systems yet. Please make sure JARVIS is deployed correctly.";

    }
}


// ================================
// SEND COMMAND
// ================================

function sendCommand() {

    const command = input.value.trim();

    if (!command) {
        return;
    }

    input.value = "";

    askJarvis(command);
}


// ================================
// SEND BUTTON
// ================================

sendButton.addEventListener("click", sendCommand);


// ================================
// ENTER KEY
// ================================

input.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        sendCommand();
    }

});


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

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    micButton.addEventListener("click", function() {

        response.textContent = "Listening...";

        try {
            recognition.start();
        } catch (error) {
            console.log(error);
        }

    });

    recognition.onresult = function(event) {

        const transcript =
            event.results[0][0].transcript;

        input.value = transcript;

        sendCommand();

    };

    recognition.onerror = function() {

        response.textContent =
            "I couldn't hear you. Please try again.";

    };

} else {

    micButton.addEventListener("click", function() {

        response.textContent =
            "Voice recognition isn't supported here.";

    });

}