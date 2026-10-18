const loadUsersBtn = document.getElementById("load-users");
const filterInput = document.getElementById("filter-input");
const statusP = document.getElementById("status");
const usersList = document.getElementById("users-list");


let usersData = [];


function renderUsers(list) {
    usersList.innerHTML = "";

    if (list.length === 0) {
        statusP.textContent = "No users match your filter.";
        return;
    }

    statusP.textContent = `Showing ${list.length} user(s).`;

    list.forEach((user) => {
        const li = document.createElement("li");
        
        const nameHeading = document.createElement("strong");
        nameHeading.textContent = user.name;

        const emailPara = document.createElement("p");
        emailPara.textContent = `Email: ${user.email}`;

        const cityPara = document.createElement("p");
        cityPara.textContent = `City: ${user.address?.city || user.city}`;

        const companyPara = document.createElement("p");
        companyPara.textContent = `Company: ${user.company?.name || user.company}`;

        li.appendChild(nameHeading);
        li.appendChild(emailPara);
        li.appendChild(cityPara);
        li.appendChild(companyPara);

        usersList.appendChild(li);
    });
}


async function loadUsers() {
    statusP.textContent = "Loading users...";
    loadUsersBtn.disabled = true;
    usersList.innerHTML = "";

    try {
        const response = await fetch("https://jsonplaceholder.typicode.com/users");

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        usersData = data;
        renderUsers(usersData);
    } catch (error) {
        statusP.textContent = `Error loading users: ${error.message}`;
    } finally {
        loadUsersBtn.disabled = false;
    }
}


loadUsersBtn.addEventListener("click", loadUsers);

filterInput.addEventListener("input", (event) => {
    const searchTerm = event.target.value.trim().toLowerCase();
    
    if (usersData.length === 0) return;

    const filteredUsers = usersData.filter((user) =>
        user.name.toLowerCase().includes(searchTerm)
    );

    renderUsers(filteredUsers);
});