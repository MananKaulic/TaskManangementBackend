const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cron = require("node-cron");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const subTaskRoutes = require("./routes/subTaskRoutes");
const cronJobs = require("./cronJobs");
const twilio = require("./twilioJob.js");

require("dotenv").config();
require("./db");
const PORT = 8000;

app.use(bodyParser.json());
app.use("/users", userRoutes);
app.use("/tasks", taskRoutes);
app.use("/subtasks", subTaskRoutes);

// Cron job for changing task priorities based on due dates
cron.schedule("0 0 * * *", async () => {
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
});
app.post("/twiml", (req, res) => {
  const twimlResponse = `
      <Response>
        <Say>Hello, this is your TwiML endpoint.</Say>
        <!-- Add more TwiML instructions as needed -->
      </Response>
    `;

  res.type("text/xml");
  res.send(twimlResponse);
});
app.get("/", (req, res) => {
  res.json({
    message: "Task Manager API is working!",
  });
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
