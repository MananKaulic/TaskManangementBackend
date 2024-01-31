const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const Task = require("../models/Task");
const SubTask = require("../models/SubTask");


// Function to update task status based on subtasks
const updateTaskStatus = async (taskId) => {
    const task = await Task.findById(taskId).populate("subtasks");
    if (!task) {
       // Handle the case where the task is not found
       return;
    }
 
    const completedSubtasks = task.subtasks.filter(
       (subtask) => subtask.completed
    );
 
    if (completedSubtasks.length === 0) {
       task.status = "TODO";
    } else if (completedSubtasks.length < task.subtasks.length) {
       task.status = "IN_PROGRESS";
    } else {
       task.status = "DONE";
    }
 
    await task.save();
 };
// Create a subtask for a task
router.post("/:taskId", auth, async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;
    const parentTaskId = req.params.taskId;

    // Check if the parent task exists
    const parentTask = await Task.findOne({
      _id: parentTaskId,
      owner: req.user._id,
    });

    if (!parentTask) {
      return res.status(404).json({ error: "Parent task not found" });
    }

    const subtask = new SubTask({
      title,
      description,
      dueDate,
      owner: req.user._id,
      parentTask: parentTaskId,
    });

    await subtask.save();

    res.status(201).json({ subtask, message: "Subtask created successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.get("/", auth, async (req, res) => {
  try {
    const { taskId, limit, skip } = req.query;

    const filter = {
      owner: req.user._id,
      parentTask: taskId,
    };

    const subtasks = await SubTask.find(filter)
      .limit(parseInt(limit) || 10)
      .skip(parseInt(skip) || 0)
      .sort({ createdAt: "desc" });

    res.status(200).json({
      subtasks,
      count: subtasks.length,
      message: "Subtasks Fetched Successfully",
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});
router.patch("/:id", auth, async (req, res) => {
  const subtaskid = req.params.id;
  const updates = Object.keys(req.body);

  const allowedUpdates = ["completed"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).json({ error: "Invalid Updates" });
  }

  try {
    const subtask = await SubTask.findOne({
      _id: subtaskid,
      owner: req.user._id,
    });

    if (!subtask) {
      return res.status(404).json({ message: "SubTask not found" });
    }

    updates.forEach((update) => (subtask[update] = req.body[update]));
    await subtask.save();
     // Update the corresponding task's status
     await updateTaskStatus(subtask.task);
     

    res.json({
      message: "SubTask Updated Successfully",
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});
router.delete("/:id", auth, async (req, res) => {
    const subtaskid = req.params.id;
  
    try {
      const subtask = await SubTask.findOneAndDelete({
        _id: subtaskid,
        owner: req.user._id,
      });
  
      if (!subtask) {
        return res.status(404).json({ message: "subTask not found" });
      }
  
      // Update the corresponding task's status
      await updateTaskStatus(subtask.parentTask);
  
      res.status(200).json({ subtask, message: "subTask Deleted Successfully" });
    } catch (err) {
      res.status(500).send({ error: err });
    }
  });

module.exports = router;
