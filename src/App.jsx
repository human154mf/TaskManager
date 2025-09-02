import { useState, useEffect, useRef } from "react";

function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });
  const [newTask, setNewTask] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("Low");
  const [category, setCategory] = useState("Work");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  // state untuk alert popup
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // state untuk confirm delete
  const [showConfirm, setShowConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const inputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Reminder cek tiap menit
  useEffect(() => {
    const requestPermission = () => {
      if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
      }
    };

    // Minta izin sekali ketika user klik layar
    document.addEventListener("click", requestPermission, { once: true });
  }, []);

  // Fungsi helper deteksi mobile
  const isMobile = () =>
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((prev) =>
        prev.map((task) => {
          if (!task.deadline || task.remindedAt) return task;

          const now = new Date().getTime();
          const deadlineTime = new Date(task.deadline).getTime();

          // toleransi 5 detik biar pas
          if (Math.abs(deadlineTime - now) <= 5000) {
            // cek device: kalau mobile pakai alert, kalau desktop pakai Notification
            if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
              alert(`Reminder: Task "${task.text}" is due!`);
            } else {
              if (
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                new Notification("Reminder", {
                  body: `Task "${task.text}" is due!`,
                });
              } else {
                alert(`Reminder: Task "${task.text}" is due!`);
              }
            }

            return { ...task, remindedAt: true };
          }

          return task;
        })
      );
    }, 5000); // cek tiap 5 detik

    return () => clearInterval(interval);
  }, []);

  const addTask = () => {
    if (newTask.trim() === "") {
      setAlertMessage("Task cannot be empty!");
      setShowAlert(true);
      return;
    }
    if (deadline.trim() === "") {
      setAlertMessage("Deadline cannot be empty!");
      setShowAlert(true);
      return;
    }
    if (new Date(deadline) < new Date()) {
      setAlertMessage("Deadline cannot be in the past!");
      setShowAlert(true);
      return;
    }

    if (editingId) {
      setTasks(
        tasks.map((task) =>
          task.id === editingId
            ? { ...task, text: newTask, deadline, priority, category }
            : task
        )
      );
      setEditingId(null);
      setAlertMessage("Task updated successfully!");
    } else {
      setTasks([
        ...tasks,
        {
          id: Date.now(),
          text: newTask,
          done: false,
          deadline,
          priority,
          category,
          remindedBefore: false,
          remindedAt: false,
        },
      ]);
      setAlertMessage("Task added successfully!");
    }

    setShowAlert(true);
    resetForm();
    inputRef.current?.focus();
  };

  const resetForm = () => {
    setNewTask("");
    setDeadline("");
    setPriority("Low");
    setCategory("Work");
    setEditingId(null);
  };

  const cancelEdit = () => {
    resetForm();
    setAlertMessage("Edit canceled!");
    setShowAlert(true);
  };

  const toggleTask = (id) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  };

  const confirmDeleteTask = (task) => {
    setTaskToDelete(task);
    setShowConfirm(true);
  };

  const handleDeleteConfirmed = () => {
    if (taskToDelete) {
      setTasks(tasks.filter((task) => task.id !== taskToDelete.id));
      setAlertMessage("Task deleted successfully!");
      setShowAlert(true);
    }
    setTaskToDelete(null);
    setShowConfirm(false);
  };

  const handleDeleteCanceled = () => {
    setTaskToDelete(null);
    setShowConfirm(false);
  };

  const editTask = (task) => {
    setEditingId(task.id);
    setNewTask(task.text);
    setDeadline(task.deadline || "");
    setPriority(task.priority || "Low");
    setCategory(task.category || "Work");
  };

  const filteredTasks = tasks.filter((t) =>
    t.text.toLowerCase().includes(search.toLowerCase())
  );

  const priorityColor = {
    High: "bg-red-100 text-red-600",
    Medium: "bg-yellow-100 text-yellow-600",
    Low: "bg-green-100 text-green-600",
  };

  const categoryColor = {
    Kerja: "bg-purple-100 text-purple-600",
    Pribadi: "bg-blue-100 text-blue-600",
    Kuliah: "bg-pink-100 text-pink-600",
    Else: "bg-yellow-100 text-yellow-600",
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-lg rounded-2xl w-full max-w-2xl p-6">
        <h1 className="text-3xl font-bold text-center text-blue-600">
          Task Manager
        </h1>

        {/* Input Form */}
        <div className="mt-6 grid gap-3">
          <input
            ref={inputRef}
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Input Your Tasks Here!"
            className="border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
          />

          <div className="grid grid-cols-3 gap-3">
            <div className="flex-col">
              <p>Deadline</p>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="border border-gray-300 p-2 rounded-xl w-full"
              />
            </div>
            <div className="flex-col">
              <p>Priority</p>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="border border-gray-300 p-2 rounded-xl w-full"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div className="flex-col">
              <p>Category</p>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border border-gray-300 p-2 rounded-xl w-full"
              >
                <option>Work</option>
                <option>Personal</option>
                <option>College</option>
                <option>Else</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={addTask}
              className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-xl transition"
            >
              {editingId ? "Update Task" : "Add Task"}
            </button>
            {editingId && (
              <button
                onClick={cancelEdit}
                className="bg-gray-400 hover:bg-gray-500 text-white px-5 py-3 rounded-xl transition"
              >
                Cancel Update Task!
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="border border-gray-300 p-3 rounded-xl mt-6 w-full"
        />

        {/* List */}
        <ul className="mt-6 space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {[...filteredTasks]
            .sort((a, b) => {
              if (a.done !== b.done) return a.done ? 1 : -1; // belum selesai dulu
              const order = { High: 1, Medium: 2, Low: 3 };
              if (a.priority !== b.priority)
                return order[a.priority] - order[b.priority];
              return (
                new Date(a.deadline || Infinity) -
                new Date(b.deadline || Infinity)
              );
            })
            .map((task) => {
              const now = new Date();
              const deadlineDate = task.deadline
                ? new Date(task.deadline)
                : null;

              let deadlineBg = "bg-gray-50";
              if (deadlineDate) {
                if (deadlineDate < now) {
                  deadlineBg = "bg-red-100 border border-red-400"; // lewat
                } else if (deadlineDate.toDateString() === now.toDateString()) {
                  deadlineBg = "bg-yellow-100 border border-yellow-400"; // masih hari ini (belum lewat)
                }
              }

              return (
                <li
                  key={task.id}
                  className={`flex justify-between items-center px-4 py-3 rounded-xl shadow-sm hover:bg-gray-100 transition ${deadlineBg} `}
                >
                  <div>
                    <span
                      onClick={() => toggleTask(task.id)}
                      className={`cursor-pointer block ${
                        task.done
                          ? "line-through text-gray-400"
                          : "text-gray-800 font-medium"
                      }`}
                    >
                      {task.text}
                    </span>
                    <div className="text-sm text-gray-500 flex gap-2 mt-1 flex-wrap">
                      {task.deadline && (
                        <span>
                          ⏰ {new Date(task.deadline).toLocaleString()}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          priorityColor[task.priority]
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          categoryColor[task.category]
                        }`}
                      >
                        {task.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => editTask(task)}
                      className="text-yellow-500 hover:text-yellow-700 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDeleteTask(task)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
        </ul>

        {filteredTasks.length === 0 && (
          <p className="text-center text-gray-400 mt-6">No tasks found.</p>
        )}
      </div>

      {/* ALERT POPUP */}
      {showAlert && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="bg-white rounded-2xl p-6 w-80 text-center shadow-xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {alertMessage}
            </h2>
            <button
              onClick={() => setShowAlert(false)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE POPUP */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="bg-white rounded-2xl p-6 w-80 text-center shadow-xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Are you sure? you want to delete this task?
            </h2>
            <p className="text-gray-500 mb-6">"{taskToDelete?.text}"</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleDeleteConfirmed}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition"
              >
                Yes
              </button>
              <button
                onClick={handleDeleteCanceled}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-xl transition"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
