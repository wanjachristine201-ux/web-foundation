// Select DOM elements
const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

// Function to update character count, word count, and styling classes
function updateCounts() {
    const text = noteText.value;
    const numChars = text.length;

    // Word count calculation (handling whitespace and empty input)
    const trimmedText = text.trim();
    const numWords = trimmedText === "" ? 0 : trimmedText.split(/\s+/).length;

    // Update text content
    charCount.textContent = `${numChars} / 200 characters`;
    wordCount.textContent = `${numWords} ${numWords === 1 ? "word" : "words"}`;

    // Manage warning and over classes on character counter
    if (numChars > 200) {
        charCount.className = "over";
    } else if (numChars > 180) {
        charCount.className = "warning";
    } else {
        charCount.className = "";
    }
}

// Function to clear textarea, counters, and draft in localStorage
function clearAll() {
    noteText.value = "";
    localStorage.removeItem("quicknotes_draft");
    updateCounts();
}

// Event Listener: Input event on textarea
noteText.addEventListener("input", () => {
    updateCounts();
    localStorage.setItem("quicknotes_draft", noteText.value);
});

// Event Listener: Clear button click
clearBtn.addEventListener("click", clearAll);

// Event Listener: Escape key inside textarea clears everything
noteText.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        clearAll();
    }
});

// Event Listener: Theme toggle button
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    
    themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
    localStorage.setItem("quicknotes_theme", isDark ? "dark" : "light");
});

// Restore saved state when page loads
window.addEventListener("DOMContentLoaded", () => {
    // Restore draft
    const savedDraft = localStorage.getItem("quicknotes_draft");
    if (savedDraft !== null) {
        noteText.value = savedDraft;
    }

    // Restore theme preference
    const savedTheme = localStorage.getItem("quicknotes_theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        themeToggle.textContent = "Light mode";
    } else {
        document.body.classList.remove("dark");
        themeToggle.textContent = "Dark mode";
    }

    // Update counters after restoring text
    updateCounts();
});