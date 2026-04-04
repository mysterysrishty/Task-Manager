import Project from "../models/Project.js";
import Task from "../models/Task.js";

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfWeek = () => {
  const date = startOfToday();
  date.setDate(date.getDate() + 7);
  return date;
};

export const getDashboard = async (req, res) => {
  try {
    const ownerId = req.user.user_id;

    const [projects, tasks] = await Promise.all([
      Project.find({ owner_id: ownerId })
        .select("project_id name color description")
        .lean(),
      Task.find({ owner_id: ownerId }).lean(),
    ]);

    const today = startOfToday();
    const weekLimit = endOfWeek();

    const projectMap = new Map(
      projects.map((project) => [project.project_id, project])
    );

    const completedTasks = tasks.filter((task) => task.status === "done").length;
    const inProgressTasks = tasks.filter(
      (task) => task.status === "in-progress" || task.status === "review"
    ).length;
    const overdueTasks = tasks.filter(
      (task) =>
        task.status !== "done" && task.due_date && new Date(task.due_date) < today
    ).length;
    const dueThisWeek = tasks.filter(
      (task) =>
        task.status !== "done" &&
        task.due_date &&
        new Date(task.due_date) >= today &&
        new Date(task.due_date) <= weekLimit
    ).length;

    const statusBreakdown = ["backlog", "in-progress", "review", "done"].map(
      (status) => ({
        status,
        count: tasks.filter((task) => task.status === status).length,
      })
    );

    const priorityBreakdown = ["urgent", "high", "medium", "low"].map(
      (priority) => ({
        priority,
        count: tasks.filter((task) => task.priority === priority).length,
      })
    );

    const upcomingTasks = tasks
      .filter((task) => task.status !== "done" && task.due_date)
      .sort((left, right) => new Date(left.due_date) - new Date(right.due_date))
      .slice(0, 5)
      .map((task) => ({
        task_id: task.task_id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
        project: task.project_id ? projectMap.get(task.project_id) || null : null,
      }));

    res.json({
      stats: {
        total_projects: projects.length,
        total_tasks: tasks.length,
        completed_tasks: completedTasks,
        in_progress_tasks: inProgressTasks,
        overdue_tasks: overdueTasks,
        due_this_week: dueThisWeek,
        completion_rate: tasks.length
          ? Math.round((completedTasks / tasks.length) * 100)
          : 0,
      },
      status_breakdown: statusBreakdown,
      priority_breakdown: priorityBreakdown,
      upcoming_tasks: upcomingTasks,
    });
  } catch (error) {
    console.error("Dashboard error:", error.message);
    res.status(500).json({ detail: "Failed to load dashboard" });
  }
};
