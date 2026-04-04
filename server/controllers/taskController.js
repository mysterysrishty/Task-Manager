import { v4 as uuidv4 } from "uuid";
import Project from "../models/Project.js";
import Task from "../models/Task.js";

const PRIORITY_ORDER = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const TASK_STATUSES = new Set(["backlog", "in-progress", "review", "done"]);
const TASK_PRIORITIES = new Set(["low", "medium", "high", "urgent"]);

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) return [];

  return tags
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .slice(0, 6);
};

const normalizeDueDate = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeTask = (task, projectMap) => ({
  task_id: task.task_id,
  owner_id: task.owner_id,
  project_id: task.project_id,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  due_date: task.due_date,
  completed_at: task.completed_at,
  tags: task.tags || [],
  created_at: task.created_at,
  updated_at: task.updated_at,
  project: task.project_id ? projectMap.get(task.project_id) || null : null,
});

const buildSorter = (sort) => {
  if (sort === "priority") {
    return (left, right) =>
      PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority] ||
      new Date(left.created_at) - new Date(right.created_at);
  }

  if (sort === "recent") {
    return (
      left,
      right
    ) => new Date(right.updated_at) - new Date(left.updated_at);
  }

  return (left, right) => {
    if (left.due_date && right.due_date) {
      return new Date(left.due_date) - new Date(right.due_date);
    }

    if (left.due_date) return -1;
    if (right.due_date) return 1;

    return new Date(right.created_at) - new Date(left.created_at);
  };
};

const ensureProjectAccess = async (ownerId, projectId) => {
  if (!projectId) return;

  const project = await Project.findOne({
    owner_id: ownerId,
    project_id: projectId,
  });

  if (!project) {
    throw new Error("PROJECT_NOT_FOUND");
  }
};

export const getTasks = async (req, res) => {
  try {
    const ownerId = req.user.user_id;
    const {
      status = "all",
      priority = "all",
      project_id = "all",
      search = "",
      sort = "due",
    } = req.query;

    const query = { owner_id: ownerId };

    if (status !== "all") {
      query.status = status;
    }

    if (priority !== "all") {
      query.priority = priority;
    }

    if (project_id !== "all") {
      query.project_id = project_id;
    }

    if (search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const [tasks, projects] = await Promise.all([
      Task.find(query).lean(),
      Project.find({ owner_id: ownerId })
        .select("project_id name color description")
        .lean(),
    ]);

    const projectMap = new Map(
      projects.map((project) => [
        project.project_id,
        {
          project_id: project.project_id,
          name: project.name,
          color: project.color,
          description: project.description,
        },
      ])
    );

    const items = tasks
      .map((task) => normalizeTask(task, projectMap))
      .sort(buildSorter(sort));

    res.json({ items, total: items.length });
  } catch (error) {
    console.error("Get tasks error:", error.message);
    res.status(500).json({ detail: "Failed to load tasks" });
  }
};

export const createTask = async (req, res) => {
  try {
    const ownerId = req.user.user_id;
    const {
      title,
      description = "",
      status = "backlog",
      priority = "medium",
      project_id = "",
      due_date = null,
      tags = [],
    } = req.body;
    const normalizedDueDate = normalizeDueDate(due_date);

    if (!title?.trim()) {
      return res.status(400).json({ detail: "Task title is required" });
    }

    if (!TASK_STATUSES.has(status)) {
      return res.status(400).json({ detail: "Task status is invalid" });
    }

    if (!TASK_PRIORITIES.has(priority)) {
      return res.status(400).json({ detail: "Task priority is invalid" });
    }

    if (due_date !== undefined && due_date !== null && due_date !== "" && normalizedDueDate === null) {
      return res.status(400).json({ detail: "Task due date is invalid" });
    }

    try {
      await ensureProjectAccess(ownerId, project_id);
    } catch (error) {
      return res.status(404).json({ detail: "Project not found" });
    }

    const task = await Task.create({
      task_id: `task_${uuidv4().replace(/-/g, "").slice(0, 12)}`,
      owner_id: ownerId,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      project_id: project_id || "",
      due_date: normalizedDueDate,
      completed_at: status === "done" ? new Date() : null,
      tags: normalizeTags(tags),
    });

    const project = task.project_id
      ? await Project.findOne({
          owner_id: ownerId,
          project_id: task.project_id,
        })
          .select("project_id name color description")
          .lean()
      : null;

    const projectMap = new Map(
      project ? [[project.project_id, project]] : []
    );

    res.status(201).json(normalizeTask(task.toObject(), projectMap));
  } catch (error) {
    console.error("Create task error:", error.message);
    res.status(500).json({ detail: "Failed to create task" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const ownerId = req.user.user_id;
    const { taskId } = req.params;
    const task = await Task.findOne({ owner_id: ownerId, task_id: taskId });

    if (!task) {
      return res.status(404).json({ detail: "Task not found" });
    }

    const {
      title,
      description,
      status,
      priority,
      due_date,
      project_id,
      tags,
    } = req.body;
    const normalizedDueDate = normalizeDueDate(due_date);

    if (typeof title === "string" && title.trim()) {
      task.title = title.trim();
    }

    if (typeof description === "string") {
      task.description = description.trim();
    }

    if (typeof priority === "string") {
      if (!TASK_PRIORITIES.has(priority)) {
        return res.status(400).json({ detail: "Task priority is invalid" });
      }
      task.priority = priority;
    }

    if (typeof status === "string") {
      if (!TASK_STATUSES.has(status)) {
        return res.status(400).json({ detail: "Task status is invalid" });
      }
      task.status = status;
      task.completed_at = status === "done" ? new Date() : null;
    }

    if (project_id !== undefined) {
      try {
        await ensureProjectAccess(ownerId, project_id);
      } catch (error) {
        return res.status(404).json({ detail: "Project not found" });
      }

      task.project_id = project_id || "";
    }

    if (due_date !== undefined) {
      if (due_date !== null && due_date !== "" && normalizedDueDate === null) {
        return res.status(400).json({ detail: "Task due date is invalid" });
      }

      task.due_date = normalizedDueDate;
    }

    if (Array.isArray(tags)) {
      task.tags = normalizeTags(tags);
    }

    await task.save();

    const project = task.project_id
      ? await Project.findOne({
          owner_id: ownerId,
          project_id: task.project_id,
        })
          .select("project_id name color description")
          .lean()
      : null;

    const projectMap = new Map(
      project ? [[project.project_id, project]] : []
    );

    res.json(normalizeTask(task.toObject(), projectMap));
  } catch (error) {
    console.error("Update task error:", error.message);
    res.status(500).json({ detail: "Failed to update task" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const ownerId = req.user.user_id;
    const { taskId } = req.params;

    const task = await Task.findOneAndDelete({
      owner_id: ownerId,
      task_id: taskId,
    });

    if (!task) {
      return res.status(404).json({ detail: "Task not found" });
    }

    res.json({ message: "Task deleted" });
  } catch (error) {
    console.error("Delete task error:", error.message);
    res.status(500).json({ detail: "Failed to delete task" });
  }
};
