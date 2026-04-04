import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    project_id: { type: String, required: true, unique: true },
    owner_id: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    color: { type: String, default: "#1f7a72" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

projectSchema.index({ owner_id: 1, created_at: -1 });

export default mongoose.model("Project", projectSchema);
