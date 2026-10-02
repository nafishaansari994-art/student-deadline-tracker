const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const subject = document.getElementById("subject");
const deadline = document.getElementById("deadline");
const priority = document.getElementById("priority");

const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");

const totalTasks = document.getElementById("totalTasks");
const pendingTasks = document.getElementById("pendingTasks");
const completedTasks = document.getElementById("completedTasks");
const overdueTasks = document.getElementById("overdueTasks");

const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const editId = document.getElementById("editId");
const editTitle = document.getElementById("editTitle");
const editSubject = document.getElementById("editSubject");
const editDeadline = document.getElementById("editDeadline");
const editPriority = document.getElementById("editPriority");
const closeModal = document.getElementById("closeModal");
const cancelEdit = document.getElementById("cancelEdit");

let tasks = [];
// SUPABASE CONNECTION

const SUPABASE_URL = "https://nddvrirfujgsryxgumrr.supabase.co";

const SUPABASE_KEY =  "sb_publishable_FmwcgD1ar7v31oPuk_B5vA_IIXZ_EVH";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

/* =========================
   LOAD DATA FROM JSON
========================= */

async function loadTasks() {
    try {

        const { data, error } =
            await supabaseClient
                .from("tasks")
                .select("*")
                .order("id", { ascending: false });

        if (error) {
            throw error;
        }

        tasks = data;

        displayTasks();
        updateDashboard();

    } catch (error) {

        console.error(error);
      alert("Supabase Error: " + error.message);

    }
}

/* =========================
   DEADLINE STATUS
========================= */

function getDeadlineStatus(task) {

    if (task.status === "Completed") {
        return "Completed";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(task.deadline);
    dueDate.setHours(0, 0, 0, 0);

    const difference =
        Math.ceil(
            (dueDate - today) /
            (1000 * 60 * 60 * 24)
        );

    if (difference < 0) {
        return "Overdue";
    }

    if (difference <= 2) {
        return "Due Soon";
    }

    return "Upcoming";
}

/* =========================
   ADD ASSIGNMENT
========================= */
/* =========================
   ADD ASSIGNMENT
========================= */

taskForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const newTask = {
        title: taskTitle.value.trim(),
        subject: subject.value.trim(),
        deadline: deadline.value,
        priority: priority.value,
        status: "Pending"
    };

    try {

        const { data, error } = await supabaseClient
            .from("tasks")
            .insert([newTask])
            .select()
            .single();

        if (error) {
            throw error;
        }

        tasks.unshift(data);

        taskForm.reset();

        displayTasks();
        updateDashboard();

    } catch (error) {

        console.error(error);
        alert("Supabase Error: " + error.message);

    }
});

/* =========================
   DISPLAY ASSIGNMENTS
========================= */
function displayTasks() {

    const searchText =
        searchInput.value.toLowerCase().trim();

    const selectedFilter =
        filterStatus.value;

    taskList.innerHTML = "";

    const filteredTasks = tasks.filter(task => {

        const matchesSearch =
            task.title.toLowerCase().includes(searchText) ||
            task.subject.toLowerCase().includes(searchText);

        const status = getDeadlineStatus(task);

        let matchesFilter = true;

        if (selectedFilter === "Pending") {
            matchesFilter = task.status === "Pending";
        }

        if (selectedFilter === "Completed") {
            matchesFilter = task.status === "Completed";
        }

        if (selectedFilter === "Overdue") {
            matchesFilter = status === "Overdue";
        }

        return matchesSearch && matchesFilter;
    });

    if (filteredTasks.length === 0) {

        taskList.innerHTML = `
            <div class="empty">
                <div class="empty-icon">📚</div>
                <h3>No assignments found</h3>
                <p>Add a new assignment to get started.</p>
            </div>
        `;

        return;
    }

    filteredTasks.forEach(task => {

        const status = getDeadlineStatus(task);

        const statusClass =
            status.toLowerCase().replace(" ", "-");

        const card = document.createElement("div");

        card.className =
            `task-card priority-${task.priority.toLowerCase()}`;

        card.innerHTML = `

            <h3>${task.title}</h3>

            <p>
                <strong>Subject:</strong>
                ${task.subject}
            </p>

            <p>
                <strong>Deadline:</strong>
                ${task.deadline}
            </p>

            <p>
                <strong>Priority:</strong>
                ${task.priority}
            </p>

            <p>
                <strong>Status:</strong>
                ${task.status}
            </p>

            <span class="deadline-status ${statusClass}">
                ${status}
            </span>

            <div class="task-buttons">

                <button
                    class="edit-button"
                    onclick="editTask(${task.id})">
                    ✏️ Edit
                </button>

                <button
                    class="complete-button"
                    onclick="completeTask(${task.id})">

                    ${
                        task.status === "Completed"
                            ? "✓ Completed"
                            : "✓ Mark Complete"
                    }

                </button>

                <button
                    class="delete-button"
                    onclick="deleteTask(${task.id})">
                    🗑️ Delete
                </button>

            </div>
        `;

        taskList.appendChild(card);
    });
}
/* =========================
   EDIT ASSIGNMENT
========================= */

function editTask(id) {

    const task =
        tasks.find(task => task.id === id);

    if (!task) return;

    editId.value = task.id;
    editTitle.value = task.title;
    editSubject.value = task.subject;
    editDeadline.value = task.deadline;
    editPriority.value = task.priority;

    editModal.style.display = "flex";
}

/* =========================
   SAVE EDIT
========================= */

editForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const id = Number(editId.value);

    const task = tasks.find(task => task.id === id);

    if (!task) return;

    const updatedTask = {
        title: editTitle.value.trim(),
        subject: editSubject.value.trim(),
        deadline: editDeadline.value,
        priority: editPriority.value
    };

    try {

        const { data, error } = await supabaseClient
            .from("tasks")
            .update(updatedTask)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        const index = tasks.findIndex(task => task.id === id);

        tasks[index] = data;

        editModal.style.display = "none";

        displayTasks();
        updateDashboard();

    } catch (error) {

        console.error(error);
        alert("Unable to update assignment.");

    }
});
/* =========================
   CLOSE EDIT MODAL
========================= */

closeModal.addEventListener("click", function () {
    editModal.style.display = "none";
});

cancelEdit.addEventListener("click", function () {
    editModal.style.display = "none";
});

/* =========================
   COMPLETE / PENDING
========================= */
async function completeTask(id) {

    const task = tasks.find(task => task.id === id);

    if (!task) return;

    const newStatus =
        task.status === "Completed"
            ? "Pending"
            : "Completed";

    try {

        const { data, error } = await supabaseClient
            .from("tasks")
            .update({
                status: newStatus
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        const index = tasks.findIndex(task => task.id === id);

        tasks[index] = data;

        displayTasks();
        updateDashboard();

    } catch (error) {

        console.error(error);
        alert("Unable to update assignment.");

    }
}
/* =========================
   DELETE ASSIGNMENT
========================= */

async function deleteTask(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this assignment?"
        );

    if (!confirmDelete) return;

    try {

        const { error } = await supabaseClient
            .from("tasks")
            .delete()
            .eq("id", id);

        if (error) {
            throw error;
        }

        tasks =
            tasks.filter(task => task.id !== id);

        displayTasks();
        updateDashboard();

    } catch (error) {

        console.error(error);
        alert("Unable to delete assignment.");

    }
}
/* =========================
   DASHBOARD COUNTS
========================= */

function updateDashboard() {

    totalTasks.textContent =
        tasks.length;

    const pending =
        tasks.filter(
            task => task.status === "Pending"
        ).length;

    const completed =
        tasks.filter(
            task => task.status === "Completed"
        ).length;

    const overdue =
        tasks.filter(
            task =>
                getDeadlineStatus(task) === "Overdue"
        ).length;

    pendingTasks.textContent = pending;
    completedTasks.textContent = completed;
    overdueTasks.textContent = overdue;
}

/* =========================
   SEARCH
========================= */

searchInput.addEventListener(
    "input",
    displayTasks
);

/* =========================
   FILTER
========================= */

filterStatus.addEventListener(
    "change",
    displayTasks
);

/* =========================
   START
========================= */

loadTasks();
// GitHub deployment update
