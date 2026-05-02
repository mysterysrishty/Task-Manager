import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    task_id: { type: String, required: true, unique: true },
    owner_id: { type: String, required: true, index: true },
    project_id: { type: String, default: "" },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["backlog", "in-progress", "review", "done"],
      default: "backlog",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    due_date: { type: Date, default: null },
    completed_at: { type: Date, default: null },
    tags: { type: [String], default: [] },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

taskSchema.index({ owner_id: 1, created_at: -1 });
taskSchema.index({ owner_id: 1, status: 1, due_date: 1 });

export default mongoose.model("Task", taskSchema);
