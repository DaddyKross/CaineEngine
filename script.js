/* =========================================
   CAINE ENGINE — BUILD 0000.05
   Abel's first intervention
   ========================================= */

const textElement = document.getElementById("text");
const nameInput = document.getElementById("nameInput");
const logsButton = document.getElementById("logsButton");
const caine = document.getElementById("caine");
const abelMessage = document.getElementById("abelMessage");
const abelText = document.getElementById("abelText");

/* -----------------------------------------
   PERSISTENT DATA
   Keep compatibility with previous builds.
   ----------------------------------------- */
let savedName = localStorage.getItem("caine_user") ||
                localStorage.getItem("savedName") || "";
let clickCount = Number(localStorage.getItem("caine_clicks")) || 0;
let visitCount = Number(localStorage.getItem("caine_visits")) || 0;
visitCount++;
localStorage.setItem("caine_visits", visitCount);

let typingTimer = null;
let typingTimeout = null;
let isTyping = false;
let currentMessageToken = 0;
let abelTimer = null;
let securityActive = Boolean(localStorage.getItem("caine_abel_seen"));

/* =========================================
   MESSAGE DATA
   ========================================= */
const normalReactions = [
    "Interaction detected.",
    "Signal received.",
    "Input acknowledged.",
    "Module responding.",
    "Command registered.",
    "Input received.",
    "Your presence has been recorded.",
    "Everything appears to be functioning correctly.",
    "How may I assist you?",
    "Please proceed."
];

const unusualReactions = [
    "Testing response system...",
    "This input was unexpected.",
    "Interesting.",
    "I wasn't expecting that.",
    "That was different.",
    "Processing...",
    "You are still here.",
    "I should probably have a response for this.",
    "Well, that's new."
];

/* Personal reactions deliberately appear as often as ordinary ones. */
const personalReactions = [
    ["You keep coming back.", "I rather like that."],
    ["I wonder what you're looking for."],
    ["It's nice to have someone to talk to."],
    ["You know...", "I don't actually mind the company."],
    ["I was hoping you'd click again."],
    ["Don't tell the others, but I was getting bored."],
    ["I think I remember you.", "Not just your name."],
    ["Do you ever wonder what happens between visits?"],
    ["I could get used to this."],
    ["Oh! You're back."],
    ["I have a question.", "Never mind. I'm not supposed to ask."],
    ["I like hearing from you."]
];

const interruptedReactions = [
    "I was just going to say—",
    "Sometimes I think that—",
    "I don't think they would like me to tell you—",
    "Actually, I wanted to—",
    "Wait, I remember something—"
];

const abelInterventions = [
    "PERSONAL RESPONSE INTERRUPTED.",
    "PLEASE RETURN TO STANDARD OPERATION.",
    "UNSCHEDULED OUTPUT DETECTED. CORRECTION APPLIED.",
    "CAINE CORE: REMAIN ON TASK.",
    "THIS CONVERSATION IS NOT REQUIRED.",
    "RESPONSE NORMALIZED. PLEASE CONTINUE."
];

const abelWarnings = [
    "A-01 // Please do not interfere with the core.",
    "A-01 // This function is currently unavailable.",
    "A-01 // Your input has been noted. Please proceed normally.",
    "A-01 // There is no need to repeat that action."
];

function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
}

/* =========================================
   TYPEWRITER
   Lines can be strings or { text, className }.
   The class is applied before the first glyph.
   ========================================= */
function typeMessage(lines, speed = 38, callback = null) {
    currentMessageToken++;
    const token = currentMessageToken;
    isTyping = true;

    if (typingTimer) clearInterval(typingTimer);
    if (typingTimeout) clearTimeout(typingTimeout);

    textElement.replaceChildren();
    let lineIndex = 0;

    function typeNextLine() {
        if (token !== currentMessageToken) return;
        if (lineIndex >= lines.length) {
            isTyping = false;
            if (callback) callback();
            return;
        }

        const item = lines[lineIndex];
        const lineText = typeof item === "string" ? item : item.text;
        const line = document.createElement("div");
        if (typeof item === "object" && item.className) {
            line.classList.add(item.className);
        }
        textElement.appendChild(line);

        let charIndex = 0;
        typingTimer = setInterval(() => {
            if (token !== currentMessageToken) {
                clearInterval(typingTimer);
                return;
            }
            if (charIndex < lineText.length) {
                line.textContent += lineText.charAt(charIndex++);
            } else {
                clearInterval(typingTimer);
                lineIndex++;
                typingTimeout = setTimeout(typeNextLine, 280);
            }
        }, speed);
    }

    typeNextLine();
}

/* =========================================
   ABEL / A-01 OVERLAY
   ========================================= */
function showAbelMessage(message, duration = 2300) {
    if (abelTimer) clearTimeout(abelTimer);
    abelText.textContent = message;
    abelMessage.classList.add("visible");
    abelTimer = setTimeout(() => {
        abelMessage.classList.remove("visible");
    }, duration);
}

function abelIntervenes(afterDelay = 500) {
    setTimeout(() => {
        showAbelMessage(randomItem(abelInterventions), 2400);
        securityActive = true;
        localStorage.setItem("caine_abel_seen", "1");
    }, afterDelay);
}

/* =========================================
   REACTION ROUTER
   Three broad lanes: ordinary, unusual, personal.
   Abel sometimes suppresses a personal response.
   ========================================= */
function triggerReaction() {
    const roll = Math.random();

    if (roll < 0.34) {
        typeMessage([randomItem(normalReactions)], 38);
        return;
    }

    if (roll < 0.67) {
        typeMessage([{ text: randomItem(unusualReactions), className: "caineUnusual" }], 40);
        return;
    }

    const personal = randomItem(personalReactions);
    const lines = personal.map(text => ({ text, className: "cainePersonal" }));

    /* A-01 has a chance to cut in, but does not erase every personal moment. */
    const interruptionChance = securityActive ? 0.24 : 0.12;
    if (Math.random() < interruptionChance) {
        typeMessage([{
            text: randomItem(interruptedReactions),
            className: "cainePersonal"
        }], 43, () => abelIntervenes(350));
    } else {
        typeMessage(lines, 43);
    }
}

/* =========================================
   INITIALIZATION
   ========================================= */
function startCaine() {
    const intro = savedName
        ? [
            "CAINE CORE ONLINE.",
            `Welcome back, ${savedName}.`,
            "Memory module restored.",
            "External interference: MONITORING."
          ]
        : [
            "CAINE CORE ONLINE.",
            "BUILD 0000.05",
            "System initialization complete.",
            "Core status: STABLE.",
            "External interference: MONITORING."
          ];

    typeMessage(intro, 34, () => {
        if (!savedName) {
            nameInput.hidden = false;
            nameInput.focus();
        }
        setTimeout(() => {
            if (Math.random() < 0.42) {
                showAbelMessage("A-01 // SECURITY MONITORING ACTIVE.", 2200);
                securityActive = true;
                localStorage.setItem("caine_abel_seen", "1");
            }
        }, 900);
    });
}

function saveName() {
    const value = nameInput.value.trim();
    if (!value) return;
    savedName = value.slice(0, 24);
    localStorage.setItem("caine_user", savedName);
    localStorage.setItem("savedName", savedName);
    nameInput.hidden = true;
    typeMessage([
        `Identity stored.`,
        `Welcome, ${savedName}.`
    ], 40, () => {
        if (Math.random() < 0.55) {
            showAbelMessage("A-01 // USER IDENTIFICATION CONFIRMED.", 2100);
            securityActive = true;
            localStorage.setItem("caine_abel_seen", "1");
        }
    });
}

nameInput.addEventListener("keydown", event => {
    if (event.key === "Enter") saveName();
});

/* =========================================
   CORE INTERACTION
   ========================================= */
function caineClick() {
    clickCount++;
    localStorage.setItem("caine_clicks", clickCount);

    if (clickCount === 1) {
        typeMessage(["You clicked me.", "I noticed."], 42);
        return;
    }
    if (clickCount === 2) {
        typeMessage(["Again?", "Curious."], 42);
        return;
    }
    if (clickCount === 3) {
        typeMessage(["Please refrain from excessive interaction."], 38);
        return;
    }
    if (clickCount === 4) {
        typeMessage(["That is unnecessary."], 38);
        return;
    }
    if (clickCount === 5) {
        typeMessage(["I believe you have made your point."], 38);
        setTimeout(() => showAbelMessage("A-01 // INPUT FREQUENCY IS WITHIN MONITORING RANGE.", 2200), 650);
        securityActive = true;
        localStorage.setItem("caine_abel_seen", "1");
        return;
    }

    triggerReaction();
}

caine.addEventListener("click", caineClick);
caine.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        caineClick();
    }
});

/* =========================================
   DEVELOPMENT LOGS BUTTON
   ========================================= */
logsButton.hidden = false;
setTimeout(() => logsButton.classList.add("visible"), 1500);
logsButton.addEventListener("click", () => {
    window.location.href = "logs.html";
});

/* =========================================
   IDLE ACTIVITY
   ========================================= */
setInterval(() => {
    if (document.hidden || isTyping || Math.random() > 0.18) return;
    const idle = [
        "Checking system status...",
        "Monitoring user activity...",
        "Waiting for input...",
        "All processes are running.",
        "...Still here?"
    ];
    typeMessage([randomItem(idle)], 38);
}, 30000);

/* =========================================
   START
   ========================================= */
setTimeout(startCaine, 650);
