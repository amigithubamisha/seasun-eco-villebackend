const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // For parsing JSON data

// Serve static files in development only
if (process.env.NODE_ENV !== "production") {
  const publicDir = path.join(__dirname, "../public");
  app.use(express.static(publicDir));
  app.get("/", (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

// Route to handle form submissions
app.post("/send-email", async (req, res) => {
  const { name, mail, phone, city, text: message } = req.body;

  // Log received data for debugging
  console.log("Form Data:", req.body);

  // Validate received form data
  const phoneRegex = /^\d{10}$/;
  const nameRegex = /^[a-zA-Z\s]+$/;
  const messageRegex = /http[s]?:\/\/\S+/;

  if (!name || !mail || !phone || !city || !message) {
    return res.status(400).json({ error: "All fields are required!" });
  }
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: "Phone number must be exactly 10 digits." });
  }
  if (name.length > 15 || !nameRegex.test(name)) {
    return res.status(400).json({ error: "Name should not exceed 15 characters or contain special characters." });
  }
  if (message.length > 100 || messageRegex.test(message)) {
    return res.status(400).json({ error: "Message should not exceed 100 characters or contain links." });
  }

  // Nodemailer transport configuration
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Email to site owner
  const ownerMailOptions = {
    from: mail,
    to: process.env.EMAIL_USER,
    subject: "New Contact Form Submission",
    text: `Name: ${name}\nEmail: ${mail}\nPhone: ${phone}\nCity: ${city}\nMessage: ${message}`,
  };

  // Thank You email to user
  const userMailOptions = {
    from: process.env.EMAIL_USER,
    to: mail,
    subject: "Thank You for Contacting Us",
    text: `Dear ${name},\n\nThank you for reaching out! We have received your message and will get back to you shortly.\n\nBest regards,\nFrom Seasun Eco-Ville`,
  };

  try {
    // Send emails
    await transporter.sendMail(ownerMailOptions);
    await transporter.sendMail(userMailOptions);

    res.status(200).json({ message: "Emails sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error.message);
    res.status(500).json({ error: "Failed to send email. Please try again later." });
  }
});

// Fallback route for production
app.get("*", (req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
