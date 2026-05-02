import { v4 as uuidv4 } from "uuid";
import Project from "../models/Project.js";
import Task from "../models/Task.js";

const HEX_COLOR_PATTERN = /^#([0-9a-f]{6})$/i;

const normalizeColor = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return "#1f7a72";
  }

  const normalized = value.trim().toLowerCase();
  return HEX_COLOR_PATTERN.test(normalized) ? normalized : null;
};

const sanitizeProject = (project, metrics = {}) => ({
  project_id: project.project_id,
  owner_id: project.owner_id,
  name: project.name,
  description: project.description,
  color: project.color,
  created_at: project.created_at,
  updated_at: project.updated_at,
  total_tasks: metrics.total_tasks || 0,
  completed_tasks: metrics.completed_tasks || 0,
});

export const getProjects = async (req, res) => {
  try {
    const ownerId = req.user.user_id;

    const [projects, taskMetrics] = await Promise.all([
      Project.find({ owner_id: ownerId }).sort({ created_at: -1 }).lean(),
      Task.aggregate([
        { $match: { owner_id: ownerId } },
        {
          $group: {
            _id: "$project_id",
            total_tasks: { $sum: 1 },
            completed_tasks: {
              $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const metricMap = new Map(
      taskMetrics.map((entry) => [entry._id, entry])
    );

    res.json(
      projects.map((project) =>
        sanitizeProject(project, metricMap.get(project.project_id))
      )
    );
  } catch (error) {
    console.error("Get projects error:", error.message);
    res.status(500).json({ detail: "Failed to load projects" });
  }
};

export const createProject = async (req, res) => {
  try {
    const ownerId = req.user.user_id;
    const { name, description = "", color = "#1f7a72" } = req.body;
    const normalizedColor = normalizeColor(color);

    if (!name?.trim()) {
      return res.status(400).json({ detail: "Project name is required" });
    }

    if (!normalizedColor) {
      return res.status(400).json({ detail: "Project color must be a valid hex value" });
    }

    const project = await Project.create({
      project_id: `project_${uuidv4().replace(/-/g, "").slice(0, 12)}`,
      owner_id: ownerId,
      name: name.trim(),
      description: description.trim(),
      color: normalizedColor,
    });

    res.status(201).json(sanitizeProject(project.toObject()));
  } catch (error) {
    console.error("Create project error:", error.message);
    res.status(500).json({ detail: "Failed to create project" });
  }
};

export const updateProject = async (req, res) => {
  try {
    const ownerId = req.user.user_id;
    const { projectId } = req.params;
    const { name, description, color } = req.body;

    const project = await Project.findOne({
      project_id: projectId,
      owner_id: ownerId,
    });

    if (!project) {
      return res.status(404).json({ detail: "Project not found" });
    }

    if (typeof name === "string" && name.trim()) {
      project.name = name.trim();
    }

    if (typeof description === "string") {
      project.description = description.trim();
    }

    if (typeof color === "string" && color.trim()) {
      const normalizedColor = normalizeColor(color);

      if (!normalizedColor) {
        return res.status(400).json({ detail: "Project color must be a valid hex value" });
      }

      project.color = normalizedColor;
    }

    await project.save();

    const totalTasks = await Task.countDocuments({
      owner_id: ownerId,
      project_id: project.project_id,
    });
    const completedTasks = await Task.countDocuments({
      owner_id: ownerId,
      project_id: project.project_id,
      status: "done",
    });

    res.json(
      sanitizeProject(project.toObject(), {
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
      })
    );
  } catch (error) {
    console.error("Update project error:", error.message);
    res.status(500).json({ detail: "Failed to update project" });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const ownerId = req.user.user_id;
    const { projectId } = req.params;

    const project = await Project.findOneAndDelete({
      project_id: projectId,
      owner_id: ownerId,
    });

    if (!project) {
      return res.status(404).json({ detail: "Project not found" });
    }

    await Task.deleteMany({ owner_id: ownerId, project_id: projectId });

    res.json({ message: "Project deleted" });
  } catch (error) {
    console.error("Delete project error:", error.message);
    res.status(500).json({ detail: "Failed to delete project" });
  }
};
