export const API_BASE_URL =
  process.env.REACT_APP_BACKEND_URL || "https://task-manager-1-7qyc.onrender.com/api";

export const STORAGE_KEYS = {
  TOKEN: "taskflow_token",
  USER: "taskflow_user",
};

export const TASK_STATUSES = [
  { value: "backlog", label: "Backlog" },
  { value: "in-progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

export const TASK_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const SORT_OPTIONS = [
  { value: "due", label: "Due date" },
  { value: "recent", label: "Recently updated" },
  { value: "priority", label: "Priority" },
];
