/ Starting data
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" /},
  { id: 5, text: "Call mum", category: "personal" },
];

// 1. searchNotes(word)
function searchNotes(word) {
  const query = word.toLowerCase();
  return notes.filter((note) => note.text.toLowerCase().includes(query));
}

// 2. longestNote()
function longestNote() {
  if (notes.length === 0) {
    return null;
  }
  let longest = notes[0];
  for (let i = 1; i < notes.length; i++) {
    if (notes[i].text.length > longest.text.length) {
      longest = notes[i];
    }
  }
  return longest;
}

// 3. countByCategory()
function countByCategory() {
  const counts = {};
  for (const note of notes) {
    counts[note.category] = (counts[note.category] || 0) + 1;
  }
  return counts;
}

// 4. getSummary()
function getSummary() {
  const total = notes.length;
  const wordNote = total === 1 ? "note" : "notes";
  const counts = countByCategory();

  const categoryDetails = Object.entries(counts)
    .map(([category, count]) => `${count} ${category}`)
    .join(", ");

  return categoryDetails
    ? `${total} ${wordNote}: ${categoryDetails}.`
    : `${total} ${wordNote}.`;
}

// 5. isDuplicate(text)
function isDuplicate(text) {
  const trimmedLower = text.trim().toLowerCase();
  return notes.some(
    (note) => note.text.trim().toLowerCase() === trimmedLower
  );
}

// 6. addNote(text, category)
function addNote(text, category) {
  const trimmedText = text.trim();
  const validCategories = ["personal", "work", "study"];

  if (trimmedText.length < 1 || trimmedText.length > 200) {
    console.log("Failed to add note: Note length must be between 1 and 200 characters.");
    return false;
  }

  if (isDuplicate(trimmedText)) {
    console.log("Failed to add note: Duplicate note text detected.");
    return false;
  }

  if (!validCategories.includes(category)) {
    console.log(`Failed to add note: Category must be one of ${validCategories.join(", ")}.`);
    return false;
  }

  const newId = notes.length > 0 ? Math.max(...notes.map((n) => n.id)) + 1 : 1;
  notes.push({ id: newId, text: trimmedText, category: category });
  return true;
}

// --- TESTING AND CONSOLE LOGS ---

// Testing searchNotes
console.log("searchNotes('report'):", searchNotes("report")); 
// Expected: [{ id: 3, text: "Email the project report to Grace", category: "work" }]

console.log("searchNotes('nonexistent'):", searchNotes("nonexistent")); 
// Expected: []

// Testing longestNote
console.log("longestNote():", longestNote()); 
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

const tempNotes = notes;
notes = [];
console.log("longestNote() (empty array):", longestNote()); 
// Expected: null
notes = tempNotes; // Restore notes

// Testing countByCategory
console.log("countByCategory():", countByCategory()); 
// Expected: { personal: 2, study: 2, work: 1 }

const backupNotes = [...notes];
notes = [{ id: 10, text: "Meeting", category: "work" }];
console.log("countByCategory() (single category):", countByCategory()); 
// Expected: { work: 1 }
notes = backupNotes; // Restore notes

// Testing getSummary
console.log("getSummary():", getSummary()); 
// Expected: "5 notes: 2 personal, 2 study, 1 work."

notes = [{ id: 1, text: "Solo task", category: "personal" }];
console.log("getSummary() (single note):", getSummary()); 
// Expected: "1 note: 1 personal."
notes = backupNotes; // Restore notes

// Testing isDuplicate
console.log("isDuplicate('  Call MUM '):", isDuplicate("  Call MUM ")); 
// Expected: true

console.log("isDuplicate('New unique note'):", isDuplicate("New unique note")); 
// Expected: false

// Testing addNote
console.log("addNote('Prepare for presentation', 'work'):", addNote("Prepare for presentation", "work")); 
// Expected: true

console.log("addNote('Call mum', 'personal'):", addNote("Call mum", "personal")); 
// Expected: Failed to add note: Duplicate note text detected. \n false