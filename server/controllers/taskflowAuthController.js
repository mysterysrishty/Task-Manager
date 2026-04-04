import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/user.js";
import { generateToken } from "../utils/helpers.js";


const makeId = (prefix) =>
  `${prefix}_${uuidv4().replace(/-/g, "").slice(0, 12)}`;

const serializeUser = (user) => ({
  user_id: user.user_id,
  email: user.email,
  name: user.name,
  avatar: user.avatar,
  role: user.role,
});

const seedWorkspace = async (user, options = {}) => {
  const { includePersonalTasks = true } = options;
  const existingProjects = await Project.countDocuments({ owner_id: user.user_id });
  const existingTasks = await Task.countDocuments({ owner_id: user.user_id });

  if (existingProjects > 0 || existingTasks > 0) {
    return;
  }

  const projects = [
    {
      project_id: makeId("project"),
      owner_id: user.user_id,
      name: "Product Launch",
      description: "Coordinate the next public release and marketing handoff.",
      color: "#1f7a72",
    },
    {
      project_id: makeId("project"),
      owner_id: user.user_id,
      name: "Portfolio Upgrade",
      description: "Refresh resume case studies and showcase full stack work.",
      color: "#d97b55",
    },
  ];

  await Project.insertMany(projects);

  const now = new Date();
  const addDays = (days) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date;
  };

  const tasks = [
    {
      task_id: makeId("task"),
      owner_id: user.user_id,
      project_id: projects[0].project_id,
      title: "Finalize sprint priorities",
      description: "Review backlog with the team and lock scope for this week.",
      status: "in-progress",
      priority: "urgent",
      due_date: addDays(1),
      tags: ["planning", "sprint"],
    },
    {
      task_id: makeId("task"),
      owner_id: user.user_id,
      project_id: projects[0].project_id,
      title: "Prepare launch checklist",
      description: "Document release tasks, QA sign-off, and deployment owners.",
      status: "review",
      priority: "high",
      due_date: addDays(3),
      tags: ["release", "ops"],
    },
    {
      task_id: makeId("task"),
      owner_id: user.user_id,
      project_id: projects[1].project_id,
      title: "Write project case study",
      description: "Summarize architecture choices and outcomes for recruiters.",
      status: "backlog",
      priority: "medium",
      due_date: addDays(6),
      tags: ["portfolio", "writing"],
    },
    {
      task_id: makeId("task"),
      owner_id: user.user_id,
      project_id: projects[1].project_id,
      title: "Collect product screenshots",
      description: "Capture polished desktop and mobile views for the showcase.",
      status: "done",
      priority: "low",
      due_date: addDays(-1),
      completed_at: addDays(-2),
      tags: ["design", "assets"],
    },
  ];

  if (includePersonalTasks) {
    tasks.push({
      task_id: makeId("task"),
      owner_id: user.user_id,
      project_id: "",
      title: "Plan next week",
      description: "Block focused work time and review pending deadlines.",
      status: "backlog",
      priority: "medium",
      due_date: addDays(2),
      tags: ["personal"],
    });
  }

  await Task.insertMany(tasks);
};

export const register = async (req, res) => {
  try {
    let { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ detail: "All fields are required" });
    }

    email = email.trim().toLowerCase();
    name = name.trim();

    if (password.length < 6) {
      return res
        .status(400)
        .json({ detail: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ detail: "Email already exists" });
    }

    const user = await User.create({
      user_id: makeId("user"),
      email,
      password_hash: await bcrypt.hash(password, 10),
      name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    });

    await seedWorkspace(user);

    res.status(201).json({
      user: serializeUser(user),
      token: generateToken(user.user_id, user.email),
    });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ detail: "Registration failed" });
  }
};

export const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ detail: "Email and password are required" });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });

    if (!user || !user.password_hash) {
      return res.status(401).json({ detail: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ detail: "Invalid credentials" });
    }

    res.json({
      user: serializeUser(user),
      token: generateToken(user.user_id, user.email),
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ detail: "Login failed" });
  }
};

export const getCurrentUser = (req, res) => {
  res.json(req.user);
};

export const logout = (req, res) => {
  res.json({ message: "Logged out successfully" });
};

export const seedAdmin = async () => {
  try {
    const adminEmail =
      process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin@taskflow.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      admin = await User.create({
        user_id: makeId("user"),
        email: adminEmail,
        password_hash: await bcrypt.hash(adminPassword, 10),
        name: "Admin",
        role: "admin",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${adminEmail}`,
      });
      console.log("Admin account created");
    }

    const demoEmail = "demo@taskflow.com";
    let demoUser = await User.findOne({ email: demoEmail });

    if (!demoUser) {
      demoUser = await User.create({
        user_id: makeId("user"),
        email: demoEmail,
        password_hash: await bcrypt.hash("demo123", 10),
        name: "Demo User",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${demoEmail}`,
      });
      console.log("Demo account created");
    }

    await seedWorkspace(admin, { includePersonalTasks: false });
    await seedWorkspace(demoUser);
  } catch (error) {
    console.error("Seed error:", error.message);
  }
};
