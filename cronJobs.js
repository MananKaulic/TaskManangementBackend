// cronJobs.js
const cron = require("node-cron");
const Task = require("./models/Task"); // Adjust the path based on your project structure

const updateTaskPriorities = async () => {
  try {
    // Get tasks that are not completed and have a due date
    const tasks = await Task.find({
      completed: false,
      dueDate: { $exists: true },
    });

    // Update the priority of each task based on its due date
    tasks.forEach(async (task) => {
      const currentDate = new Date();
      const dueDate = new Date(task.dueDate);
      const timeDifference = dueDate.getTime() - currentDate.getTime();
      const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));

      let priority = 3; // Default priority for tasks due 5+ days

      if (daysDifference === 0) {
        priority = 0; // Due date is today
      } else if (daysDifference >= 1 && daysDifference <= 2) {
        priority = 1; // Due date is between tomorrow and day after tomorrow
      } else if (daysDifference >= 3 && daysDifference <= 4) {
        priority = 2; // 3-4 days
      }

      // Update the task's priority in the database
      task.priority = priority;
      await task.save();
    });

    console.log("Task priorities updated successfully.");
  } catch (error) {
    console.error("Error updating task priorities:", error.message);
  }
};

// Schedule the task priority update cron job
cron.schedule("* * * * *", updateTaskPriorities);
