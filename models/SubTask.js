const mongoose = require("mongoose");

const SubtaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    dueDate: { type: Date, required: true },
    completed: { type: Boolean, default: false },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Task", // Reference to the Task model
    },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

const SubTask = mongoose.model("SubTask", SubtaskSchema);
module.exports = SubTask;
