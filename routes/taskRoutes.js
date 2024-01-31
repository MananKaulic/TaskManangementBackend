const express = require("express");

const router = express.Router();
const auth = require("../middlewares/auth");
const Task = require("../models/Task");

router.get("/test", auth, (req, res) => {
  res.json({
    message: "Task routes are working!",
    user: req.user,
  });
});

// CRUD tasks for authenticated users

//create a task
router.post("/", auth, async (req, res) => {
  try {
    let priority = 3; // Default priority for tasks due 5+ days
    const { dueDate } = req.body;
    if (dueDate) {
      const currentDate = new Date();
      const timeDifference =
        new Date(dueDate).getTime() - currentDate.getTime();
      const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));

      if (daysDifference === 0) {
        priority = 0; // Due date is today
      } else if (daysDifference >= 1 && daysDifference <= 2) {
        priority = 1; // Due date is between tomorrow and day after tomorrow
      } else if (daysDifference >= 3 && daysDifference <= 4) {
        priority = 2; // 3-4 days
      }
    }
    const task = new Task({
      ...req.body,
      owner: req.user._id,
      priority,
    });
    await task.save();
    res.status(201).json({ task, message: "Task Created Successfully" });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// get user tasks
router.get("/", auth, async (req, res) => {
  try {
    const { dueDate, priority, limit, skip } = req.query;

    const filter = {
      owner: req.user._id,
    };

    // Add due date filter
    if (dueDate) {
      filter.dueDate = new Date(dueDate);
    }

    // Add priority filter
    if (priority) {
      filter.priority = parseInt(priority);
    }

    const tasks = await Task.find(filter)
      .limit(parseInt(limit) || 10)
      .skip(parseInt(skip) || 0)
      .sort({ createdAt: "desc" }); // Adjust sorting based on your requirements

    res.status(200).json({
      tasks,
      count: tasks.length,
      message: "Tasks Fetched Successfully",
    });
  } catch (err) {
    res.status(500).send({ error: err });
  }
});

//fetch a task by id

router.get("/:id", auth, async (req, res) => {
  const taskid = req.params.id;

  try {
    const task = await Task.findOne({
      _id: taskid,
      owner: req.user._id,
    });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({ task, message: "Task Fetched Successfully" });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// update a task by id
router.patch("/:id", auth, async (req, res) => {
  const taskid = req.params.id;
  const updates = Object.keys(req.body);

  const allowedUpdates = ["dueDate", "completed"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).json({ error: "Invalid Updates" });
  }

  try {
    const task = await Task.findOne({
      _id: taskid,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    updates.forEach((update) => (task[update] = req.body[update]));
    await task.save();

    res.json({
      message: "Task Updated Successfully",
    });
  } catch (err) {
    res.status(500).send({ error: err });
  }
});

// delete a task by id
router.delete("/:id", auth, async (req, res) => {
  const taskid = req.params.id;

  try {
    const task = await Task.findOneAndDelete({
      _id: taskid,
      owner: req.user._id,
    });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({ task, message: "Task Deleted Successfully" });
  } catch (err) {
    res.status(500).send({ error: err });
  }
});

module.exports = router;
