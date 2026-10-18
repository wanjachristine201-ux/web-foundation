const loadUsersBtn = document.getElementById("load-users");
const filterInput = document.getElementById("filter-input");
const statusP = document.getElementById("status");
const usersList = document.getElementById("users-list");

let allUsers = [];

function renderUsers(users) {
    usersList.innerHTML = "";

    if (users.length === 0) {
        statusP.textContent = "No users match your filter.";
        return;
    }

    statusP.textContent = `Showing ${users.length} user(s).`;

    users.forEach(user => {
        const li = document.createElement("li");
        
        const nameStrong = document.createElement("strong");
        nameStrong.textContent = user.name;

        const details = document.createElement("p");
        details.textContent = `Email: ${user.email} | City: ${user.address?.city || ''} | Company: ${user.company?.name || ''}`;

        li.appendChild(nameStrong);
        li.appendChild(details);
        usersList.appendChild(li);
    });
}

async function loadUsers() {
    loadUsersBtn.disabled = true;
    statusP.textContent = "Loading users...";
    usersList.innerHTML = "";

    try {
        const response = await fetch("https://jsonplaceholder.typicode.com/users");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allUsers = await response.json();
        renderUsers(allUsers);
        statusP.textContent = "Users loaded successfully.";
    } catch (error) {
        statusP.textContent = `Error: ${error.message}`;
    } finally {
        loadUsersBtn.disabled = false;
    }
}

loadUsersBtn.addEventListener("click", loadUsers);

filterInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = allUsers.filter(user => user.name.toLowerCase().includes(query));
    renderUsers(filtered);
});