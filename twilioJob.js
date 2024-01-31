const cron = require("node-cron");
const Task = require("./models/Task");
const User = require("./models/User"); // Import the User model
const twilio = require("twilio");
require("dotenv").config();

// Load environment variables using dotenv or another method
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = new twilio(accountSid, authToken);

cron.schedule("1 * * * *", async () => {
  try {
    const overdueTasks = await Task.find({
      dueDate: { $lt: new Date() },
    }).populate("owner");

    overdueTasks.sort((a, b) => a.owner.priority - b.owner.priority);

    for (const task of overdueTasks) {
      // Fetch the user directly from the User model to get the correct priority
      const user = await User.findById(task.owner);

      const call = await client.calls.create({
        url: "http://demo.twilio.com/docs/voice.xml",
        to: user.phoneNumber, // Use user's phoneNumber directly
        from: twilioPhoneNumber,
      });

      if (call && call.status === "completed") {
        task.completed = true;
      } else {
        continue;
      }

      await task.save();
    }
  } catch (error) {
    console.error("Error in cron job:", error);
  }
});
