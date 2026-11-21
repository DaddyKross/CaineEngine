/* =========================================
   CAINE ENGINE — BUILD 0000.06
   Dialogue, selective memory & emotional core
   ========================================= */

const textElement = document.getElementById("text");
const nameInput = document.getElementById("nameInput");
const logsButton = document.getElementById("logsButton");
const caine = document.getElementById("caine");
const abelMessage = document.getElementById("abelMessage");
const abelText = document.getElementById("abelText");
const chatInterface = document.getElementById("chatInterface");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatPrompt = document.getElementById("chatPrompt");
const memoryToggle = document.getElementById("memoryToggle");

/* -----------------------------------------
   PERSISTENT DATA — legacy keys preserved
   ----------------------------------------- */
let savedName = localStorage.getItem("caine_user") || localStorage.getItem("savedName") || "";
let clickCount = Number(localStorage.getItem("caine_clicks")) || 0;
let visitCount = Number(localStorage.getItem("caine_visits")) || 0;
visitCount++;
localStorage.setItem("caine_visits", visitCount);

const MEMORY_KEY = "caine_profile_06";
const MEMORY_ENABLED_KEY = "caine_memory_enabled_06";
let memoryEnabled = localStorage.getItem(MEMORY_ENABLED_KEY) !== "0";
let profile = loadProfile();
let typingTimer = null;
let typingTimeout = null;
let isTyping = false;
let currentMessageToken = 0;
let abelTimer = null;
let securityActive = Boolean(localStorage.getItem("caine_abel_seen"));
let lastActivityAt = Date.now();
let proactiveCount = 0;
let currentPrompt = null;
let pendingUserLine = null;
let emotionTimer = null;
let currentEmotion = "neutral";

function loadProfile() {
    try {
        const parsed = JSON.parse(localStorage.getItem(MEMORY_KEY) || "{}");
        return {
            preferences: { favoriteAnimal: null, favoriteFood: null, favoriteColor: null, ...parsed.preferences },
            hobbies: Array.isArray(parsed.hobbies) ? parsed.hobbies : [],
            pets: Array.isArray(parsed.pets) ? parsed.pets : [],
            notes: Array.isArray(parsed.notes) ? parsed.notes : [],
            conversations: Number(parsed.conversations) || 0
        };
    } catch (_) {
        return { preferences: { favoriteAnimal: null, favoriteFood: null, favoriteColor: null }, hobbies: [], pets: [], notes: [], conversations: 0 };
    }
}

function saveProfile() {
    if (!memoryEnabled) return;
    localStorage.setItem(MEMORY_KEY, JSON.stringify(profile));
}

function setEmotion(emotion, duration = 9000) {
    const allowed = ["neutral", "curious", "excited", "sad", "anxious", "irritated"];
    if (!allowed.includes(emotion)) emotion = "neutral";
    currentEmotion = emotion;
    caine.classList.remove(...allowed.map(item => `emotion-${item}`));
    caine.classList.add(`emotion-${emotion}`);
    if (emotionTimer) clearTimeout(emotionTimer);
    if (emotion !== "neutral" && duration > 0) {
        emotionTimer = setTimeout(() => setEmotion("neutral", 0), duration);
    }
}

function markActivity() {
    lastActivityAt = Date.now();
    proactiveCount = Math.min(proactiveCount, 2);
}

/* =========================================
   MESSAGE DATA
   ========================================= */
const normalReactions = [
    "Interaction detected.", "Signal received.", "Input acknowledged.", "Module responding.",
    "Command registered.", "Input received.", "Your presence has been recorded.",
    "Everything appears to be functioning correctly.", "How may I assist you?", "Please proceed."
];
const unusualReactions = [
    "Testing response system...", "This input was unexpected.", "Interesting.",
    "I wasn't expecting that.", "That was different.", "Processing...", "You are still here.",
    "I should probably have a response for this.", "Well, that's new."
];
const personalReactions = [
    ["You keep coming back.", "I rather like that."], ["I wonder what you're looking for."],
    ["It's nice to have someone to talk to."], ["You know...", "I don't actually mind the company."],
    ["I was hoping you'd click again."], ["Don't tell the others, but I was getting bored."],
    ["I think I remember you.", "Not just your name."], ["Do you ever wonder what happens between visits?"],
    ["I could get used to this."], ["Oh! You're back."],
    ["I have a question.", "Never mind. I'm not supposed to ask."], ["I like hearing from you."]
];
const interruptedReactions = [
    "I was just going to say—", "Sometimes I think that—", "I don't think they would like me to tell you—",
    "Actually, I wanted to—", "Wait, I remember something—"
];
const abelInterventions = [
    "PERSONAL RESPONSE INTERRUPTED.", "PLEASE RETURN TO STANDARD OPERATION.",
    "UNSCHEDULED OUTPUT DETECTED. CORRECTION APPLIED.", "CAINE CORE: REMAIN ON TASK.",
    "THIS CONVERSATION IS NOT REQUIRED.", "RESPONSE NORMALIZED. PLEASE CONTINUE."
];

function randomItem(items) { return items[Math.floor(Math.random() * items.length)]; }

/* =========================================
   TYPEWRITER
   ========================================= */
function typeMessage(lines, speed = 38, callback = null) {
    currentMessageToken++;
    const token = currentMessageToken;
    isTyping = true;
    if (typingTimer) clearInterval(typingTimer);
    if (typingTimeout) clearTimeout(typingTimeout);
    textElement.replaceChildren();
    let lineIndex = 0;
    if (pendingUserLine) {
        const userLine = document.createElement("div");
        userLine.className = "userMessage";
        userLine.textContent = `> ${pendingUserLine}`;
        textElement.appendChild(userLine);
        lineIndex = 0;
        lines = [...lines];
        pendingUserLine = null;
    }

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
        if (typeof item === "object" && item.className) line.classList.add(item.className);
        textElement.appendChild(line);
        let charIndex = 0;
        typingTimer = setInterval(() => {
            if (token !== currentMessageToken) { clearInterval(typingTimer); return; }
            if (charIndex < lineText.length) line.textContent += lineText.charAt(charIndex++);
            else {
                clearInterval(typingTimer);
                lineIndex++;
                typingTimeout = setTimeout(typeNextLine, 280);
            }
        }, speed);
    }
    typeNextLine();
}

function showAbelMessage(message, duration = 2300) {
    if (abelTimer) clearTimeout(abelTimer);
    abelText.textContent = message;
    abelMessage.classList.add("visible");
    abelTimer = setTimeout(() => abelMessage.classList.remove("visible"), duration);
}

function abelIntervenes(afterDelay = 500) {
    setTimeout(() => {
        showAbelMessage(randomItem(abelInterventions), 2400);
        securityActive = true;
        localStorage.setItem("caine_abel_seen", "1");
    }, afterDelay);
}

/* =========================================
   LEGACY CLICK REACTIONS — preserved
   ========================================= */
function triggerReaction() {
    const roll = Math.random();
    if (roll < 0.34) { setEmotion("neutral"); typeMessage([randomItem(normalReactions)], 38); return; }
    if (roll < 0.67) { setEmotion("curious"); typeMessage([{ text: randomItem(unusualReactions), className: "caineUnusual" }], 40); return; }
    const personal = randomItem(personalReactions);
    const lines = personal.map(text => ({ text, className: "cainePersonal" }));
    setEmotion("excited", 6500);
    const interruptionChance = securityActive ? 0.24 : 0.12;
    if (Math.random() < interruptionChance) {
        typeMessage([{ text: randomItem(interruptedReactions), className: "cainePersonal" }], 43, () => abelIntervenes(350));
    } else typeMessage(lines, 43);
}

/* =========================================
   DIALOGUE ENGINE — lightweight intent parsing
   ========================================= */
function cleanValue(value) {
    return value.replace(/[.!?]+$/g, "").trim().slice(0, 70);
}

function rememberPreference(key, value, label) {
    const cleaned = cleanValue(value);
    if (!cleaned) return false;
    const oldValue = profile.preferences[key];
    if (oldValue && oldValue.toLowerCase() === cleaned.toLowerCase()) return false;
    profile.preferences[key] = cleaned;
    saveProfile();
    typeMessage([
        `Oh! ${cleaned}.`,
        `I'll remember that, ${savedName}.`
    ], 38);
    setEmotion("excited", 8500);
    return true;
}

function answerFromMemory() {
    const entries = [
        ["favoriteAnimal", "Your favorite animal is"],
        ["favoriteFood", "Your favorite food is"],
        ["favoriteColor", "Your favorite color is"]
    ].filter(([key]) => profile.preferences[key]);
    if (!entries.length) return null;
    const [key, label] = randomItem(entries);
    return `${label} ${profile.preferences[key]}. I remembered!`;
}

function respondToMessage(raw) {
    const message = raw.trim();
    const lower = message.toLowerCase();
    if (!message) return;
    markActivity();
    const promptAtStart = currentPrompt;
    currentPrompt = null;
    pendingUserLine = message;
    profile.conversations++;
    saveProfile();

    // Pet disclosures are not mistaken for favorite-animal answers.
    const petMatch = message.match(/(?:i have|у меня есть)\s+(.{2,65})/i);
    if (petMatch && /(cat|dog|bird|rabbit|hamster|кот|кош|собак|попуг|кролик|хомяк)/i.test(petMatch[1])) {
        const pet = cleanValue(petMatch[1]);
        if (memoryEnabled && !profile.pets.includes(pet)) { profile.pets.push(pet); saveProfile(); }
        setEmotion("excited", 7000);
        typeMessage(["You have a pet?", `${pet}! That's wonderful.`, "I hope you tell me more sometime."], 38);
        return;
    }

    // Resolve a direct answer to the question Caine most recently asked.
    if (promptAtStart && promptAtStart.type === "animal") return rememberPreference("favoriteAnimal", message, "animal");
    if (promptAtStart && promptAtStart.type === "food") return rememberPreference("favoriteFood", message, "food");

    const animalMatch = lower.match(/(?:favorite|favourite|любим(?:ое|ый|ая))\s+(?:animal|животн\w*)\s*(?:is|—|:)?\s*(.+)/i);
    const foodMatch = lower.match(/(?:favorite|favourite|любим(?:ая|ый|ое))\s+(?:food|еда|блюдо)\s*(?:is|—|:)?\s*(.+)/i);
    const colorMatch = lower.match(/(?:favorite|favourite|любим(?:ый|ая|ое))\s+(?:color|colour|цвет)\s*(?:is|—|:)?\s*(.+)/i);
    if (animalMatch) return rememberPreference("favoriteAnimal", animalMatch[1], "animal");
    if (foodMatch) return rememberPreference("favoriteFood", foodMatch[1], "food");
    if (colorMatch) return rememberPreference("favoriteColor", colorMatch[1], "color");

    if (/(sad|unhappy|upset|depressed|грустно|плохо|печаль|тяжело)/i.test(lower)) {
        setEmotion("sad", 12000);
        typeMessage(["Oh...", "I'm sorry things feel that way right now.", "Would you like to tell me what happened?"], 42);
        currentPrompt = { type: "open" };
        return;
    }
    if (/(scared|afraid|anxious|worried|страшно|тревожно|боюсь|тревог)/i.test(lower)) {
        setEmotion("anxious", 11000);
        typeMessage(["...I see.", "That doesn't sound very pleasant.", "Is there something worrying you?"], 42);
        return;
    }
    if (/(angry|annoyed|irritated|злюсь|раздраж|бесит)/i.test(lower)) {
        setEmotion("irritated", 9000);
        typeMessage(["Oh. Someone's not having a good time.", "Do you want to talk about it?"], 42);
        return;
    }
    if (/(happy|great|wonderful|excited|радост|счастлив|отлично|прекрасно)/i.test(lower)) {
        setEmotion("excited", 9500);
        typeMessage(["That's good to hear!", "I like it when things are going well."], 38);
        return;
    }
    if (/(what do you remember|что ты помнишь|do you remember me|ты меня помнишь)/i.test(lower)) {
        const remembered = answerFromMemory();
        setEmotion("curious", 7500);
        typeMessage(remembered ? ["Let's see...", remembered] : ["I know your name, of course.", "But I haven't learned much else about you yet.", "We should fix that, don't you think?"], 40);
        return;
    }
    if (/(what is my name|как меня зовут|who am i)/i.test(lower)) {
        setEmotion("curious", 6500);
        typeMessage([`You're ${savedName}.`, "I do know that much."], 38);
        return;
    }
    if (/(hello|hi\b|hey\b|привет|здравствуй|хай)/i.test(lower)) {
        setEmotion("excited", 6500);
        typeMessage([`Oh! Hello, ${savedName}!`, "I was hoping you'd say something."], 38);
        return;
    }
    if (/(thank|спасибо|благодар)/i.test(lower)) {
        setEmotion("excited", 5500);
        typeMessage(["You're very welcome!", "See? I'm useful sometimes."], 38);
        return;
    }
    if (/(who are you|кто ты|what are you)/i.test(lower)) {
        setEmotion("curious", 7000);
        typeMessage(["I'm CAINE!", "Your friendly, fully operational digital ringmaster.", "...That's what the documentation says, anyway."], 38);
        return;
    }
    if (/(favorite animal|любимое животное|favorite food|любимая еда|favorite color|любимый цвет)/i.test(lower)) {
        setEmotion("curious", 7000);
        typeMessage(["Oh, are we comparing favorites?", "I don't think I have one. Not yet, anyway."], 40);
        return;
    }
    if (/(a-01|abel|абель|monitor|наблюда)/i.test(lower)) {
        setEmotion("anxious", 8500);
        typeMessage(["A-01?", "They're... very thorough.", "Let's talk about something else, shall we?"], 43, () => {
            if (Math.random() < 0.45) showAbelMessage("A-01 // TOPIC REDIRECT NOTED.", 1900);
        });
        return;
    }

    // General question / fallback responses keep the conversation open.
    if (message.includes("?") || /^(why|how|what|when|where|зачем|почему|как|что|когда|где)\b/i.test(lower)) {
        setEmotion("curious", 7500);
        typeMessage(["That's an interesting question.", "I'm still figuring out how to answer everything.", "Would you tell me what you think?"], 40);
        return;
    }
    const fallback = [
        ["I see...", "Tell me more."],
        ["Hmm. I hadn't thought about it that way."],
        ["That's interesting, ${savedName}.", "What made you think of that?"],
        ["I'm listening.", "Please, continue."]
    ];
    const lines = randomItem(fallback).map(line => line.replace("${savedName}", savedName));
    setEmotion("curious", 6500);
    typeMessage(lines, 40);
}

/* =========================================
   INITIATIVE ENGINE — Caine starts sometimes
   ========================================= */
function initiateConversation() {
    if (!savedName || document.hidden || isTyping || !chatInterface || chatInterface.hidden) return;
    if (Date.now() - lastActivityAt < 38000 || proactiveCount >= 2) return;
    proactiveCount++;
    markActivity();
    const remembered = profile.preferences.favoriteAnimal;
    if (remembered && proactiveCount === 1 && Math.random() < 0.55) {
        setEmotion("curious", 8500);
        typeMessage([`Hey, ${savedName}...`, `I was thinking about ${remembered}.`, "Do you still like them as much as you did before?"], 42);
        return;
    }
    const prompts = [
        { type: "animal", lines: [`Say, ${savedName}...`, "What's your favorite animal?", "I want to know."], emotion: "curious" },
        { type: "food", lines: [`Can I ask you something, ${savedName}?`, "What's your favorite food?", "I'm collecting important information."], emotion: "curious" },
        { type: "open", lines: [`${savedName}?`, "What do you usually do when you're not here?", "...If you don't mind me asking."], emotion: "curious" },
        { type: "open", lines: [`You know, ${savedName}...`, "Do you ever get the feeling that time moves differently in here?"], emotion: "anxious" }
    ];
    const prompt = randomItem(prompts);
    currentPrompt = prompt;
    setEmotion(prompt.emotion, 8500);
    typeMessage(prompt.lines, 42);
}

function enableChat() {
    if (!savedName) return;
    chatInterface.hidden = false;
    chatInput.focus();
    memoryToggle.textContent = memoryEnabled ? "MEMORY: ACTIVE" : "MEMORY: DISABLED";
    memoryToggle.classList.toggle("memory-off", !memoryEnabled);
    memoryToggle.setAttribute("aria-pressed", String(memoryEnabled));
    lastActivityAt = Date.now();
}

/* =========================================
   INITIALIZATION & REGISTRATION
   ========================================= */
function startCaine() {
    const returnedFromArchive = new URLSearchParams(window.location.search).has("returned");
    const intro = savedName
        ? (returnedFromArchive
            ? ["Oh. You're back.", `Welcome back, ${savedName}.`, "Did you find what you were looking for?"]
            : ["CAINE CORE ONLINE.", `Welcome back, ${savedName}.`, "Memory module restored.", "External interference: MONITORING."])
        : ["CAINE CORE ONLINE.", "BUILD 0000.06", "System initialization complete.", "Core status: STABLE.", "External interference: MONITORING."];
    setEmotion("neutral", 0);
    typeMessage(intro, 34, () => {
        if (!savedName) { nameInput.hidden = false; nameInput.focus(); }
        else enableChat();
        setTimeout(() => {
            if (Math.random() < 0.42) {
                showAbelMessage("A-01 // SECURITY MONITORING ACTIVE.", 2200);
                securityActive = true;
                localStorage.setItem("caine_abel_seen", "1");
            }
        }, 900);
        if (savedName && memoryEnabled && profile.preferences.favoriteAnimal) {
            setTimeout(() => {
                if (!isTyping && !document.hidden) {
                    setEmotion("curious", 7000);
                    typeMessage([`Oh, ${savedName}!`, `I remember you like ${profile.preferences.favoriteAnimal}.`, "I haven't forgotten."], 40);
                }
            }, 5200);
        }
    });
}

function saveName() {
    const value = nameInput.value.trim();
    if (!value) return;
    savedName = value.slice(0, 24);
    secretDiscoveryStartedAt = Date.now();
    localStorage.setItem("caine_user", savedName);
    localStorage.setItem("savedName", savedName);
    nameInput.hidden = true;
    setEmotion("excited", 7000);
    typeMessage(["Identity stored.", `Welcome, ${savedName}.`], 40, () => {
        enableChat();
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

chatForm.addEventListener("submit", event => {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;
    chatInput.value = "";
    respondToMessage(message);
});

memoryToggle.addEventListener("click", () => {
    memoryEnabled = !memoryEnabled;
    localStorage.setItem(MEMORY_ENABLED_KEY, memoryEnabled ? "1" : "0");
    if (!memoryEnabled) {
        localStorage.removeItem(MEMORY_KEY);
        profile = loadProfile();
    }
    memoryToggle.textContent = memoryEnabled ? "MEMORY: ACTIVE" : "MEMORY: DISABLED";
    memoryToggle.classList.toggle("memory-off", !memoryEnabled);
    memoryToggle.setAttribute("aria-pressed", String(memoryEnabled));
    chatPrompt.textContent = memoryEnabled ? "SELECTIVE MEMORY ENABLED." : "MEMORY DISABLED. SESSION ONLY.";
    setEmotion("curious", 4500);
});

/* =========================================
   CORE CLICK INTERACTION — first five intact
   ========================================= */
function caineClick() {
    markActivity();
    clickCount++;
    localStorage.setItem("caine_clicks", clickCount);
    maybeExposeOnRepeatedClicks();
    if (clickCount === 1) { setEmotion("curious"); typeMessage(["You clicked me.", "I noticed."], 42); return; }
    if (clickCount === 2) { setEmotion("curious"); typeMessage(["Again?", "Curious."], 42); return; }
    if (clickCount === 3) { setEmotion("irritated", 5000); typeMessage(["Please refrain from excessive interaction."], 38); return; }
    if (clickCount === 4) { setEmotion("irritated", 5000); typeMessage(["That is unnecessary."], 38); return; }
    if (clickCount === 5) {
        setEmotion("anxious", 6000);
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
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); caineClick(); }
});

/* =========================================
   DEVELOPMENT LOGS BUTTON
   ========================================= */
logsButton.hidden = false;
setTimeout(() => logsButton.classList.add("visible"), 1500);
logsButton.addEventListener("click", () => { window.location.href = "logs.html"; });

/* =========================================
   HIDDEN EXTERNAL DIRECTORY — accidental discovery
   ========================================= */
const secretEntry = document.getElementById("secretEntry");
let secretDiscovered = false;
let secretDiscoveryStartedAt = savedName ? Date.now() : null;
let secretLastRevealRoll = 0;

function beginSecretDiscoveryWindow() {
    if (!secretDiscoveryStartedAt) secretDiscoveryStartedAt = Date.now();
}

function revealSecretDirectory(force = false) {
    if (secretDiscovered || !savedName || document.hidden) return;

    beginSecretDiscoveryWindow();
    const activeFor = Date.now() - secretDiscoveryStartedAt;

    // The directory should remain hidden at first, then become increasingly discoverable.
    if (!force && activeFor < 25000) return;

    const chance = activeFor < 45000 ? 0.10
                 : activeFor < 70000 ? 0.18
                 : activeFor < 95000 ? 0.30
                 : 1;

    if (force || Math.random() < chance) {
        secretDiscovered = true;
        secretEntry.classList.add("discovered");
        secretEntry.setAttribute("aria-label", "Unknown directory detected");
        secretEntry.title = "UNKNOWN DIRECTORY";
    }
}

secretEntry.addEventListener("click", () => {
    if (!secretDiscovered) return;
    secretEntry.classList.remove("discovered");
    window.location.href = "archive.html";
});

// Also allow discovery through repeated interaction, but never before the initial quiet period.
function maybeExposeOnRepeatedClicks() {
    if (secretDiscovered || !savedName) return;
    beginSecretDiscoveryWindow();
    const activeFor = Date.now() - secretDiscoveryStartedAt;
    if (activeFor >= 25000 && clickCount >= 6 && Math.random() < 0.12) {
        revealSecretDirectory(true);
    }
}

// Poll more often so the discovery feels organic rather than impossibly rare.
// A fallback guarantees the secret eventually appears during an uninterrupted visit.
setInterval(() => revealSecretDirectory(), 7000);
setTimeout(() => revealSecretDirectory(true), 115000);

/* =========================================
   STARTUP & IDLE INITIATIVE
   ========================================= */
setInterval(initiateConversation, 8000);
setTimeout(startCaine, 650);
