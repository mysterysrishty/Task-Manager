import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  Layers3,
  LoaderCircle,
  LogOut,
  PencilLine,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import { useAuth } from "../context/AuthContext";
import projectService from "../service/projectService";
import taskService from "../service/taskService";
import { SORT_OPTIONS, TASK_PRIORITIES, TASK_STATUSES } from "../utils/constants";

const defaultProjectForm = { name: "", description: "", color: "#1f7a72" };
const defaultTaskForm = {
  title: "",
  description: "",
  project_id: "",
  status: "backlog",
  priority: "medium",
  due_date: "",
  tags: "",
};

const emptyDashboard = {
  stats: {
    total_projects: 0,
    total_tasks: 0,
    completed_tasks: 0,
    overdue_tasks: 0,
    due_this_week: 0,
    completion_rate: 0,
  },
  status_breakdown: [],
  priority_breakdown: [],
  upcoming_tasks: [],
};

const statusTone = {
  backlog: "bg-slate-100 text-slate-700",
  "in-progress": "bg-amber-100 text-amber-800",
  review: "bg-sky-100 text-sky-800",
  done: "bg-emerald-100 text-emerald-800",
};

const priorityTone = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-orange-100 text-orange-700",
  high: "bg-rose-100 text-rose-700",
  urgent: "bg-red-100 text-red-700",
};

const cardAccent = {
  projects: "from-[#1f7a72] to-[#2d958b]",
  tasks: "from-[#f28f6b] to-[#d97759]",
  completed: "from-[#4ba88b] to-[#2e7f66]",
  overdue: "from-[#d86650] to-[#b34f3b]",
};

const createProjectDraft = (project) => ({
  project_id: project.project_id,
  name: project.name,
  description: project.description || "",
  color: project.color || "#1f7a72",
});

const createTaskDraft = (task) => ({
  task_id: task.task_id,
  title: task.title,
  description: task.description || "",
  project_id: task.project_id || "",
  status: task.status,
  priority: task.priority,
  due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 10) : "",
  tags: task.tags?.join(", ") || "",
});

const formatDate = (value) => {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const taskCountLabel = (count) => `${count} ${count === 1 ? "task" : "tasks"}`;

const statCards = (stats) => [
  { key: "projects", label: "Projects", value: stats.total_projects, icon: Layers3 },
  { key: "tasks", label: "Total tasks", value: stats.total_tasks, icon: ClipboardList },
  { key: "completed", label: "Completed", value: stats.completed_tasks, icon: CheckCircle2 },
  { key: "overdue", label: "Overdue", value: stats.overdue_tasks, icon: AlertTriangle },
];

const BreakdownCard = ({ title, items, total, isStatus }) => (
  <article className="rounded-[28px] border border-[var(--line)] bg-white p-5 shadow-sm">
    <h3 className="text-lg font-bold text-[var(--ink)]">{title}</h3>
    <div className="mt-4 space-y-3">
      {items.map((item) => {
        const key = isStatus ? item.status : item.priority;
        const label = isStatus
          ? TASK_STATUSES.find((option) => option.value === key)?.label || key
          : TASK_PRIORITIES.find((option) => option.value === key)?.label || key;
        const count = item.count || 0;
        const width = total ? Math.max(8, Math.round((count / total) * 100)) : 0;
        const toneMap = isStatus ? statusTone : priorityTone;

        return (
          <div key={key}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className={`rounded-full px-3 py-1 font-semibold ${toneMap[key]}`}>{label}</span>
              <span className="font-medium text-[var(--muted)]">{count}</span>
            </div>
            <div className="h-2 rounded-full bg-[#efe4d6]">
              <div
                className="h-2 rounded-full bg-[linear-gradient(90deg,#1f7a72,#f28f6b)]"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  </article>
);

const EmptyState = ({ title, body }) => (
  <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-white/70 px-5 py-7 text-sm text-[var(--muted)]">
    <p className="font-semibold text-[var(--ink)]">{title}</p>
    <p className="mt-2 leading-6">{body}</p>
  </div>
);

const OverlayPanel = ({ open, title, subtitle, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(32,38,55,0.42)] px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-[30px] border border-[var(--line)] bg-[var(--panel)] shadow-[0_40px_100px_rgba(32,38,55,0.25)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Manage
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--ink)]">{title}</h2>
            {subtitle ? (
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--line)] bg-white p-2 text-[var(--muted)] transition hover:text-[var(--ink)]"
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
};

const TaskCard = ({ task, onUpdate, onDelete, onEdit }) => (
  <article className="rounded-[24px] border border-[var(--line)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-[var(--ink)]">{task.title}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {task.description || "No notes added yet."}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded-full p-2 text-[var(--muted)] transition-colors hover:bg-[#edf3f1] hover:text-[var(--accent)]"
          aria-label={`Edit ${task.title}`}
        >
          <PencilLine size={16} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          className="rounded-full p-2 text-[var(--muted)] transition-colors hover:bg-[#fff1ec] hover:text-[#c95c44]"
          aria-label={`Delete ${task.title}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>

    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[task.status]}`}>{TASK_STATUSES.find((item) => item.value === task.status)?.label || task.status}</span>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityTone[task.priority]}`}>{TASK_PRIORITIES.find((item) => item.value === task.priority)?.label || task.priority}</span>
      {task.project ? (
        <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: task.project.color || "#1f7a72" }}>
          {task.project.name}
        </span>
      ) : null}
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        Status
        <select
          value={task.status}
          onChange={(event) => onUpdate(task.task_id, { status: event.target.value })}
          className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[#fffaf2] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
        >
          {TASK_STATUSES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        Priority
        <select
          value={task.priority}
          onChange={(event) => onUpdate(task.task_id, { priority: event.target.value })}
          className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[#fffaf2] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
        >
          {TASK_PRIORITIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>

    <div className="mt-4 flex items-center justify-between text-sm text-[var(--muted)]">
      <span>Due {formatDate(task.due_date)}</span>
      <span className="truncate text-right">{task.tags?.length ? task.tags.join(", ") : "No tags"}</span>
    </div>
  </article>
);

const TaskFlowDashboardPage = () => {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [projectForm, setProjectForm] = useState(defaultProjectForm);
  const [taskForm, setTaskForm] = useState(defaultTaskForm);
  const [projectEditor, setProjectEditor] = useState(null);
  const [taskEditor, setTaskEditor] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    priority: "all",
    project_id: "all",
    sort: "due",
  });

  const deferredSearch = useDeferredValue(filters.search);
  const queryFilters = useMemo(() => ({ ...filters, search: deferredSearch }), [deferredSearch, filters]);

  const refreshData = useCallback(async () => {
    const [projectData, dashboardData, taskData] = await Promise.all([
      projectService.getProjects(),
      taskService.getDashboard(),
      taskService.getTasks(queryFilters),
    ]);
    setProjects(projectData);
    setDashboard(dashboardData);
    setTasks(taskData.items);
  }, [queryFilters]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [projectData, dashboardData, taskData] = await Promise.all([
          projectService.getProjects(),
          taskService.getDashboard(),
          taskService.getTasks(queryFilters),
        ]);
        if (!active) return;
        setProjects(projectData);
        setDashboard(dashboardData);
        setTasks(taskData.items);
      } catch (error) {
        console.error("Dashboard load failed:", error);
        if (active) toast.error("Could not load your dashboard");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [queryFilters]);

  const groupedTasks = useMemo(
    () => TASK_STATUSES.map((status) => ({ ...status, tasks: tasks.filter((task) => task.status === status.value) })),
    [tasks]
  );

  const personalTaskCount = useMemo(
    () => tasks.filter((task) => !task.project_id).length,
    [tasks]
  );

  const handleProjectCreate = async (event) => {
    event.preventDefault();
    if (!projectForm.name.trim()) return toast.error("Project name is required");
    setBusyAction("project-create");
    try {
      await projectService.createProject(projectForm);
      setProjectForm(defaultProjectForm);
      await refreshData();
      toast.success("Project created");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not create project");
    } finally {
      setBusyAction("");
    }
  };

  const handleTaskCreate = async (event) => {
    event.preventDefault();
    if (!taskForm.title.trim()) return toast.error("Task title is required");
    setBusyAction("task-create");
    try {
      await taskService.createTask({
        ...taskForm,
        tags: taskForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      });
      setTaskForm(defaultTaskForm);
      await refreshData();
      toast.success("Task added");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not create task");
    } finally {
      setBusyAction("");
    }
  };

  const handleTaskUpdate = async (taskId, payload) => {
    try {
      await taskService.updateTask(taskId, payload);
      await refreshData();
      toast.success("Task updated");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not update task");
    }
  };

  const handleTaskDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await taskService.deleteTask(task.task_id);
      await refreshData();
      toast.success("Task deleted");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not delete task");
    }
  };

  const handleProjectDelete = async (project) => {
    if (!window.confirm(`Delete "${project.name}" and all its tasks?`)) return;
    try {
      await projectService.deleteProject(project.project_id);
      if (filters.project_id === project.project_id) {
        setFilters((current) => ({ ...current, project_id: "all" }));
      }
      if (taskEditor?.project_id === project.project_id) {
        setTaskEditor((current) => (current ? { ...current, project_id: "" } : current));
      }
      await refreshData();
      toast.success("Project deleted");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not delete project");
    }
  };

  const saveProjectEdit = async (event) => {
    event.preventDefault();

    if (!projectEditor?.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setBusyAction("project-edit");
    try {
      await projectService.updateProject(projectEditor.project_id, {
        name: projectEditor.name,
        description: projectEditor.description,
        color: projectEditor.color,
      });
      setProjectEditor(null);
      await refreshData();
      toast.success("Project updated");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not update project");
    } finally {
      setBusyAction("");
    }
  };

  const saveTaskEdit = async (event) => {
    event.preventDefault();

    if (!taskEditor?.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    setBusyAction("task-edit");
    try {
      await taskService.updateTask(taskEditor.task_id, {
        title: taskEditor.title,
        description: taskEditor.description,
        project_id: taskEditor.project_id,
        status: taskEditor.status,
        priority: taskEditor.priority,
        due_date: taskEditor.due_date || null,
        tags: taskEditor.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      });
      setTaskEditor(null);
      await refreshData();
      toast.success("Task updated");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not update task");
    } finally {
      setBusyAction("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="rounded-[30px] border border-[var(--line)] bg-[var(--panel)] px-10 py-12 shadow-[0_30px_120px_rgba(44,53,70,0.12)]">
          <LoaderCircle className="mx-auto animate-spin text-[var(--accent)]" size={34} />
          <p className="mt-4 text-sm font-medium text-[var(--muted)]">Preparing your TaskFlow dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="rounded-[34px] border border-[var(--line)] bg-[linear-gradient(135deg,rgba(255,250,242,0.96),rgba(245,236,223,0.96))] p-6 shadow-[0_24px_80px_rgba(44,53,70,0.08)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--accent)] shadow-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-white">T</span>
                TaskFlow Workspace
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--ink)]">
                Welcome back, {user?.name?.split(" ")[0] || "there"}.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
                Manage deadlines, shape projects, and present a polished MERN product with authentication, CRUD flows, filters, editing, and dashboard reporting.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm text-[var(--muted)]">
                  <span className="font-semibold text-[var(--ink)]">{taskCountLabel(personalTaskCount)}</span> personal
                </div>
                <div className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm text-[var(--muted)]">
                  <span className="font-semibold text-[var(--ink)]">{dashboard.stats.due_this_week}</span> due this week
                </div>
                <div className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm text-[var(--muted)]">
                  <span className="font-semibold text-[var(--ink)]">{dashboard.stats.overdue_tasks}</span> overdue right now
                </div>
              </div>
            </div>
            <div className="rounded-[28px] border border-[var(--line)] bg-white/90 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">Delivery pace</p>
                  <p className="mt-2 text-3xl font-bold text-[var(--ink)]">{dashboard.stats.completion_rate}%</p>
                </div>
                <div className="rounded-2xl bg-[#edf3f1] p-3 text-[var(--accent)]">
                  <Sparkles size={20} />
                </div>
              </div>
              <div className="mt-4 h-3 rounded-full bg-[#eadfce]">
                <div className="h-3 rounded-full bg-[linear-gradient(90deg,#1f7a72,#f28f6b)]" style={{ width: `${dashboard.stats.completion_rate}%` }} />
              </div>
              <div className="mt-5 flex items-center justify-between text-sm text-[var(--muted)]">
                <span>{dashboard.stats.completed_tasks} tasks done</span>
                <Button variant="ghost" className="rounded-full px-3 py-2" onClick={logout}>
                  <LogOut size={16} />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards(dashboard.stats).map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.key} className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-white shadow-sm">
                <div className={`h-2 w-full bg-gradient-to-r ${cardAccent[card.key]}`} />
                <div className="flex items-center justify-between px-5 py-5">
                  <div>
                    <p className="text-sm font-medium text-[var(--muted)]">{card.label}</p>
                    <p className="mt-2 text-3xl font-bold text-[var(--ink)]">{card.value}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f7f1e6] p-3 text-[var(--accent)]">
                    <Icon size={22} />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_1.45fr]">
          <div className="space-y-6">
            <article className="rounded-[30px] border border-[var(--line)] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">New Project</p>
                  <h2 className="mt-2 text-2xl font-bold text-[var(--ink)]">Create a project space</h2>
                </div>
                <span className="rounded-full bg-[#edf3f1] px-3 py-1 text-sm font-medium text-[var(--accent)]">{projects.length} active</span>
              </div>
              <form className="mt-5 space-y-4" onSubmit={handleProjectCreate}>
                <Input value={projectForm.name} onChange={(event) => setProjectForm((current) => ({ ...current, name: event.target.value }))} placeholder="Product launch" />
                <textarea
                  value={projectForm.description}
                  onChange={(event) => setProjectForm((current) => ({ ...current, description: event.target.value }))}
                  rows={4}
                  placeholder="Describe the goal, milestone, or team focus"
                  className="w-full rounded-[24px] border border-[var(--line)] bg-white/90 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[#1f7a72]/10"
                />
                <label className="block text-sm font-medium text-[var(--muted)]">
                  Accent color
                  <input type="color" value={projectForm.color} onChange={(event) => setProjectForm((current) => ({ ...current, color: event.target.value }))} className="mt-2 h-11 w-full cursor-pointer rounded-2xl border border-[var(--line)] bg-white p-1" />
                </label>
                <Button type="submit" className="w-full rounded-2xl py-3" disabled={busyAction === "project-create"}>
                  <Plus size={18} />
                  {busyAction === "project-create" ? "Creating..." : "Create project"}
                </Button>
              </form>
            </article>

            <BreakdownCard title="Status breakdown" items={dashboard.status_breakdown} total={dashboard.stats.total_tasks} isStatus />

            <article className="rounded-[30px] border border-[var(--line)] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Upcoming</p>
                  <h2 className="mt-2 text-2xl font-bold text-[var(--ink)]">Closest deadlines</h2>
                </div>
                <CalendarDays className="text-[var(--warm)]" size={22} />
              </div>
              <div className="mt-5 space-y-3">
                {dashboard.upcoming_tasks.length ? dashboard.upcoming_tasks.map((task) => (
                  <div key={task.task_id} className="rounded-[22px] border border-[var(--line)] bg-[#fffaf2] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--ink)]">{task.title}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">{task.project?.name || "No project"} | {formatDate(task.due_date)}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityTone[task.priority]}`}>
                        {TASK_PRIORITIES.find((option) => option.value === task.priority)?.label || task.priority}
                      </span>
                    </div>
                  </div>
                )) : (
                  <EmptyState
                    title="No upcoming deadlines yet"
                    body="Add a due date to any task and the next milestones will appear here automatically."
                  />
                )}
              </div>
            </article>
          </div>

          <div className="space-y-6">
            <article className="rounded-[30px] border border-[var(--line)] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">New Task</p>
                  <h2 className="mt-2 text-2xl font-bold text-[var(--ink)]">Capture work quickly</h2>
                </div>
                <span className="rounded-full bg-[#fff1ec] px-3 py-1 text-sm font-medium text-[#c95c44]">{dashboard.stats.due_this_week} due this week</span>
              </div>
              <form className="mt-5 grid gap-4" onSubmit={handleTaskCreate}>
                <Input value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} placeholder="Draft backend API documentation" />
                <textarea
                  value={taskForm.description}
                  onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))}
                  rows={4}
                  placeholder="Write the important context or next steps"
                  className="w-full rounded-[24px] border border-[var(--line)] bg-white/90 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[#1f7a72]/10"
                />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="text-sm font-medium text-[var(--muted)]">Project
                    <select value={taskForm.project_id} onChange={(event) => setTaskForm((current) => ({ ...current, project_id: event.target.value }))} className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)]">
                      <option value="">Personal task</option>
                      {projects.map((project) => <option key={project.project_id} value={project.project_id}>{project.name}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-[var(--muted)]">Status
                    <select value={taskForm.status} onChange={(event) => setTaskForm((current) => ({ ...current, status: event.target.value }))} className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)]">
                      {TASK_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-[var(--muted)]">Priority
                    <select value={taskForm.priority} onChange={(event) => setTaskForm((current) => ({ ...current, priority: event.target.value }))} className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)]">
                      {TASK_PRIORITIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-[var(--muted)]">Due date
                    <input type="date" value={taskForm.due_date} onChange={(event) => setTaskForm((current) => ({ ...current, due_date: event.target.value }))} className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)]" />
                  </label>
                </div>
                <Input value={taskForm.tags} onChange={(event) => setTaskForm((current) => ({ ...current, tags: event.target.value }))} placeholder="Tags separated by commas, like api, design, hiring" />
                <Button type="submit" className="w-full rounded-2xl py-3" disabled={busyAction === "task-create"}>
                  <Plus size={18} />
                  {busyAction === "task-create" ? "Saving task..." : "Add task"}
                </Button>
              </form>
            </article>

            <article className="rounded-[30px] border border-[var(--line)] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Filters</p>
                  <h2 className="mt-2 text-2xl font-bold text-[var(--ink)]">Task board</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="sm:col-span-2">
                    <Input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search tasks" icon={<Search size={16} />} />
                  </div>
                  <select value={filters.project_id} onChange={(event) => setFilters((current) => ({ ...current, project_id: event.target.value }))} className="rounded-2xl border border-[var(--line)] bg-white px-3 py-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]">
                    <option value="all">All projects</option>
                    {projects.map((project) => <option key={project.project_id} value={project.project_id}>{project.name}</option>)}
                  </select>
                  <select value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))} className="rounded-2xl border border-[var(--line)] bg-white px-3 py-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]">
                    {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="rounded-full border border-[var(--line)] bg-[#fffaf2] px-4 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]">
                  <option value="all">All statuses</option>
                  {TASK_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <select value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))} className="rounded-full border border-[var(--line)] bg-[#fffaf2] px-4 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]">
                  <option value="all">All priorities</option>
                  {TASK_PRIORITIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <Button variant="ghost" className="rounded-full" onClick={() => setFilters({ search: "", status: "all", priority: "all", project_id: "all", sort: "due" })}>
                  Reset filters
                </Button>
              </div>
              <div className="mt-6 grid gap-4 xl:grid-cols-4">
                {groupedTasks.map((column) => (
                  <div key={column.value} className="rounded-[26px] border border-[var(--line)] bg-[#fffaf2] p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-[var(--ink)]">{column.label}</h3>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--muted)]">{column.tasks.length}</span>
                    </div>
                    <div className="mt-4 space-y-4">
                      {column.tasks.length ? column.tasks.map((task) => (
                        <TaskCard
                          key={task.task_id}
                          task={task}
                          onUpdate={handleTaskUpdate}
                          onDelete={handleTaskDelete}
                          onEdit={(value) => setTaskEditor(createTaskDraft(value))}
                        />
                      )) : (
                        <EmptyState
                          title={`No tasks in ${column.label.toLowerCase()}`}
                          body="Create a task or adjust the filters to populate this lane."
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[30px] border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Projects Overview</p>
                <h2 className="mt-2 text-2xl font-bold text-[var(--ink)]">What each project is carrying</h2>
              </div>
              <p className="text-sm text-[var(--muted)]">Edit project details, track output, or remove a workspace and its linked tasks.</p>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {projects.length ? projects.map((project) => (
                <article key={project.project_id} className="rounded-[24px] border border-[var(--line)] bg-[#fffaf2] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: project.color }} />
                      <div>
                        <h3 className="text-lg font-bold text-[var(--ink)]">{project.name}</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">{project.description || "No description added yet."}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setProjectEditor(createProjectDraft(project))}
                        className="rounded-full p-2 text-[var(--muted)] transition-colors hover:bg-[#edf3f1] hover:text-[var(--accent)]"
                        aria-label={`Edit ${project.name}`}
                      >
                        <PencilLine size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProjectDelete(project)}
                        className="rounded-full p-2 text-[var(--muted)] transition-colors hover:bg-[#fff1ec] hover:text-[#c95c44]"
                        aria-label={`Delete ${project.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-[20px] bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Total</p>
                      <p className="mt-2 text-2xl font-bold text-[var(--ink)]">{project.total_tasks}</p>
                    </div>
                    <div className="rounded-[20px] bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Done</p>
                      <p className="mt-2 text-2xl font-bold text-[var(--ink)]">{project.completed_tasks}</p>
                    </div>
                  </div>
                </article>
              )) : (
                <EmptyState
                  title="No projects yet"
                  body="Create your first project to organize work by milestone, client, launch, or internal team."
                />
              )}
            </div>
          </article>

          <div className="space-y-6">
            <BreakdownCard title="Priority distribution" items={dashboard.priority_breakdown} total={dashboard.stats.total_tasks} isStatus={false} />

            <article className="rounded-[30px] border border-[var(--line)] bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Workspace Snapshot</p>
                  <h2 className="mt-2 text-2xl font-bold text-[var(--ink)]">Everything in one glance</h2>
                </div>
                <div className="rounded-2xl bg-[#edf3f1] p-3 text-[var(--accent)]">
                  <FolderKanban size={20} />
                </div>
              </div>
              <div className="mt-6 grid gap-3">
                <div className="rounded-[22px] bg-[#fffaf2] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Owner</p>
                  <p className="mt-2 text-lg font-bold text-[var(--ink)]">{user?.name || "TaskFlow user"}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] bg-[#fffaf2] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Active projects</p>
                    <p className="mt-2 text-2xl font-bold text-[var(--ink)]">{projects.length}</p>
                  </div>
                  <div className="rounded-[22px] bg-[#fffaf2] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Personal tasks</p>
                    <p className="mt-2 text-2xl font-bold text-[var(--ink)]">{personalTaskCount}</p>
                  </div>
                </div>
                <div className="rounded-[22px] border border-dashed border-[var(--line)] px-4 py-4 text-sm leading-6 text-[var(--muted)]">
                  Your dashboard supports login, registration, CRUD operations for projects and tasks, filters, status updates, and reporting on top of the MERN stack.
                </div>
              </div>
            </article>
          </div>
        </section>

        <OverlayPanel
          open={Boolean(projectEditor)}
          title="Edit project"
          subtitle="Refine the project name, description, and accent color without leaving the dashboard."
          onClose={() => setProjectEditor(null)}
        >
          <form className="space-y-4" onSubmit={saveProjectEdit}>
            <Input
              value={projectEditor?.name || ""}
              onChange={(event) => setProjectEditor((current) => ({ ...current, name: event.target.value }))}
              placeholder="Project name"
            />
            <textarea
              value={projectEditor?.description || ""}
              onChange={(event) => setProjectEditor((current) => ({ ...current, description: event.target.value }))}
              rows={5}
              placeholder="Add a short description"
              className="w-full rounded-[24px] border border-[var(--line)] bg-white px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[#1f7a72]/10"
            />
            <label className="block text-sm font-medium text-[var(--muted)]">
              Accent color
              <input
                type="color"
                value={projectEditor?.color || "#1f7a72"}
                onChange={(event) => setProjectEditor((current) => ({ ...current, color: event.target.value }))}
                className="mt-2 h-11 w-full cursor-pointer rounded-2xl border border-[var(--line)] bg-white p-1"
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" className="rounded-2xl px-5 py-3" onClick={() => setProjectEditor(null)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-2xl px-5 py-3" disabled={busyAction === "project-edit"}>
                {busyAction === "project-edit" ? "Saving..." : "Save project"}
              </Button>
            </div>
          </form>
        </OverlayPanel>

        <OverlayPanel
          open={Boolean(taskEditor)}
          title="Edit task"
          subtitle="Update task details, change its project, and keep status or priority aligned with the work."
          onClose={() => setTaskEditor(null)}
        >
          <form className="space-y-4" onSubmit={saveTaskEdit}>
            <Input
              value={taskEditor?.title || ""}
              onChange={(event) => setTaskEditor((current) => ({ ...current, title: event.target.value }))}
              placeholder="Task title"
            />
            <textarea
              value={taskEditor?.description || ""}
              onChange={(event) => setTaskEditor((current) => ({ ...current, description: event.target.value }))}
              rows={5}
              placeholder="Add details for this task"
              className="w-full rounded-[24px] border border-[var(--line)] bg-white px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[#1f7a72]/10"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-[var(--muted)]">
                Project
                <select
                  value={taskEditor?.project_id || ""}
                  onChange={(event) => setTaskEditor((current) => ({ ...current, project_id: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="">Personal task</option>
                  {projects.map((project) => (
                    <option key={project.project_id} value={project.project_id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-[var(--muted)]">
                Due date
                <input
                  type="date"
                  value={taskEditor?.due_date || ""}
                  onChange={(event) => setTaskEditor((current) => ({ ...current, due_date: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                />
              </label>
              <label className="text-sm font-medium text-[var(--muted)]">
                Status
                <select
                  value={taskEditor?.status || "backlog"}
                  onChange={(event) => setTaskEditor((current) => ({ ...current, status: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                >
                  {TASK_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-[var(--muted)]">
                Priority
                <select
                  value={taskEditor?.priority || "medium"}
                  onChange={(event) => setTaskEditor((current) => ({ ...current, priority: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                >
                  {TASK_PRIORITIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Input
              value={taskEditor?.tags || ""}
              onChange={(event) => setTaskEditor((current) => ({ ...current, tags: event.target.value }))}
              placeholder="Tags separated by commas"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" className="rounded-2xl px-5 py-3" onClick={() => setTaskEditor(null)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-2xl px-5 py-3" disabled={busyAction === "task-edit"}>
                {busyAction === "task-edit" ? "Saving..." : "Save task"}
              </Button>
            </div>
          </form>
        </OverlayPanel>
      </div>
    </div>
  );
};

export default TaskFlowDashboardPage;
