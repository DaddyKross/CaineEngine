/* =========================================
   CAINE ENGINE — DEVELOPMENT LOGS
   Restricted archive / A-01
   ========================================= */

const availableBuilds = document.querySelectorAll(".build.available");
const lockedBuilds = document.querySelectorAll(".build.locked");
const logMessages = document.querySelectorAll(".logMessage[data-content]");
const defaultMessage = document.getElementById("defaultMessage");
const logContent = document.getElementById("logContent");
const authOverlay = document.getElementById("authOverlay");
const authForm = document.getElementById("authForm");
const authInput = document.getElementById("archivePassword");
const authStatus = document.getElementById("authStatus");
const authClose = document.getElementById("authClose");
const accessStatus = document.getElementById("accessStatus");

const ACCESS_KEY_HASH = "6d7dfb908e9e878d7598c594d6af6b4558394b0dd147433061c1657c75d8fdb8";
const MAX_ATTEMPTS = 3;
const LOCK_DURATION = 60 * 1000;
const STORAGE_UNLOCKED = "caine_archive_unlocked_05";
const STORAGE_ATTEMPTS = "caine_archive_attempts";
const STORAGE_LOCK_UNTIL = "caine_archive_lock_until";
let selectedLockedBuild = null;
let lockCountdownTimer = null;
let unlocked = localStorage.getItem(STORAGE_UNLOCKED) === "1";

function showBuild(buildNumber) {
    document.querySelectorAll(".build").forEach(item => item.classList.remove("active"));
    logMessages.forEach(item => item.classList.add("hidden"));
    if (defaultMessage) defaultMessage.classList.add("hidden");

    const selectedBuild = document.querySelector(`.build[data-build="${buildNumber}"]`);
    const selectedMessage = document.querySelector(`.logMessage[data-content="${buildNumber}"]`);
    if (selectedBuild) selectedBuild.classList.add("active");
    if (selectedMessage) selectedMessage.classList.remove("hidden");
    if (logContent) logContent.scrollTop = 0;
}

function openAuth(buildNumber) {
    selectedLockedBuild = buildNumber;
    authOverlay.classList.add("visible");
    authOverlay.setAttribute("aria-hidden", "false");
    authInput.value = "";
    updateLockStatus();
    if (lockCountdownTimer) clearInterval(lockCountdownTimer);
    lockCountdownTimer = null;
    if (Date.now() < Number(localStorage.getItem(STORAGE_LOCK_UNTIL) || 0)) {
        lockCountdownTimer = setInterval(updateLockStatus, 1000);
    } else {
        authInput.focus();
    }
}

function closeAuth() {
    authOverlay.classList.remove("visible");
    authOverlay.setAttribute("aria-hidden", "true");
    if (lockCountdownTimer) clearInterval(lockCountdownTimer);
    lockCountdownTimer = null;
    selectedLockedBuild = null;
}

function updateLockStatus() {
    const lockUntil = Number(localStorage.getItem(STORAGE_LOCK_UNTIL) || 0);
    if (Date.now() < lockUntil) {
        const seconds = Math.ceil((lockUntil - Date.now()) / 1000);
        authStatus.textContent = `A-01 // ACCESS SUSPENDED. RETRY IN ${seconds} SEC.`;
        authStatus.classList.add("warning");
        authInput.disabled = true;
        authForm.querySelector("button").disabled = true;
        if (!lockCountdownTimer) lockCountdownTimer = setInterval(updateLockStatus, 1000);
    } else {
        authStatus.textContent = "A-01 // AUTHORIZATION REQUIRED.";
        authStatus.classList.remove("warning");
        authInput.disabled = false;
        authForm.querySelector("button").disabled = false;
        if (lockCountdownTimer) {
            clearInterval(lockCountdownTimer);
            lockCountdownTimer = null;
        }
    }
}

async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hash)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function unlockArchive() {
    const buildToOpen = selectedLockedBuild;
    unlocked = true;
    localStorage.setItem(STORAGE_UNLOCKED, "1");
    localStorage.removeItem(STORAGE_ATTEMPTS);
    localStorage.removeItem(STORAGE_LOCK_UNTIL);
    lockedBuilds.forEach(build => {
        build.classList.remove("locked");
        build.classList.add("available");
        build.querySelector(".buildStatus").textContent = "UNLOCKED";
        build.querySelector(".buildStatus").classList.add("unlockedStatus");
        build.setAttribute("role", "button");
        build.setAttribute("tabindex", "0");
    });
    accessStatus.textContent = "ARCHIVE ACCESS: AUTHORIZED";
    closeAuth();
    if (buildToOpen) showBuild(buildToOpen);
}

// Password verification. The key is case-sensitive.
authForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (Date.now() < Number(localStorage.getItem(STORAGE_LOCK_UNTIL) || 0)) {
        updateLockStatus();
        return;
    }

    const attempt = authInput.value;
    if (!attempt) {
        authStatus.textContent = "A-01 // EMPTY INPUT IS NOT AN AUTHORIZATION KEY.";
        return;
    }

    authStatus.textContent = "VERIFYING...";
    const digest = await sha256(attempt);
    if (digest === ACCESS_KEY_HASH) {
        unlockArchive();
        return;
    }

    let attempts = Number(localStorage.getItem(STORAGE_ATTEMPTS) || 0) + 1;
    localStorage.setItem(STORAGE_ATTEMPTS, String(attempts));
    authInput.value = "";

    if (attempts >= MAX_ATTEMPTS) {
        localStorage.setItem(STORAGE_ATTEMPTS, "0");
        localStorage.setItem(STORAGE_LOCK_UNTIL, String(Date.now() + LOCK_DURATION));
        authStatus.textContent = "A-01 // THREE FAILED ATTEMPTS. ACCESS SUSPENDED FOR 60 SECONDS.";
        authStatus.classList.add("warning");
        authInput.disabled = true;
        authForm.querySelector("button").disabled = true;
        if (!lockCountdownTimer) lockCountdownTimer = setInterval(updateLockStatus, 1000);
    } else {
        const remaining = MAX_ATTEMPTS - attempts;
        authStatus.textContent = `ACCESS DENIED. ${remaining} ATTEMPT${remaining === 1 ? "" : "S"} REMAINING.`;
        authStatus.classList.add("warning");
    }
});

authClose.addEventListener("click", closeAuth);
authOverlay.addEventListener("click", event => {
    if (event.target === authOverlay) closeAuth();
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape" && authOverlay.classList.contains("visible")) closeAuth();
});

function attachBuildHandlers() {
    document.querySelectorAll(".build.available").forEach(build => {
        build.addEventListener("click", () => showBuild(build.dataset.build));
        build.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                showBuild(build.dataset.build);
            }
        });
    });
    document.querySelectorAll(".build.locked").forEach(build => {
        build.addEventListener("click", () => {
            if (unlocked) showBuild(build.dataset.build);
            else openAuth(build.dataset.build);
        });
        build.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                if (unlocked) showBuild(build.dataset.build);
                else openAuth(build.dataset.build);
            }
        });
    });
}

if (unlocked) {
    unlockArchive();
} else {
    accessStatus.textContent = "ARCHIVE ACCESS: LIMITED // A-01 MONITORING";

attachBuildHandlers();
showBuild("0000.04");
