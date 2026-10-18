const noteForm = document.getElementById("note-form");
const noteTitle = document.getElementById("note-title");
const noteBody = document.getElementById("note-body");
const notesList = document.getElementById("notes-list");

noteForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = noteTitle.value.trim();
    const body = noteBody.value.trim();

    if (!title || !body) return;

    const li = document.createElement("li");
    
    const h3 = document.createElement("h3");
    h3.textContent = title;

    const p = document.createElement("p");
    p.textContent = body;

    li.appendChild(h3);
    li.appendChild(p);
    notesList.appendChild(li);

    noteForm.reset();
});