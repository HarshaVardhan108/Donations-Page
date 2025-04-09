const express = require("express");
const { Pool } = require("pg");
const path = require("path");
const jwt = require("jsonwebtoken");
const PDFDocument = require("pdfkit");

const app = express();
const port = process.env.PORT || 3000;

const JWT_SECRET = "your-secret-key"; // In production, use environment variable
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123", // In production, use hashed password
};

// PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "donations_db",
  password: "hemanga",
  port: 5432,
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Add CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Expose-Headers", "Content-Disposition");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// JWT authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// Routes
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  ) {
    const token = jwt.sign({ username }, JWT_SECRET);
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.post("/api/donate", async (req, res) => {
  console.log("Received donation request:", req.body);

  // Validate required fields
  const requiredFields = ["first_name", "last_name", "email", "amount"];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }

  const {
    first_name,
    last_name,
    company_name,
    country,
    street_address,
    apartment,
    city,
    state,
    postcode,
    phone,
    email,
    pan_number,
    has_indian_passport,
    amount,
    payment_method,
    message,
  } = req.body;

  try {
    const query = `
            INSERT INTO donations (
                first_name, last_name, company_name, country,
                street_address, apartment, city, state, postcode,
                phone, email, pan_number, has_indian_passport,
                amount, payment_method, message, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
            RETURNING id
        `;
    const result = await pool.query(query, [
      first_name,
      last_name,
      company_name,
      country,
      street_address,
      apartment,
      city,
      state,
      postcode,
      phone,
      email,
      pan_number,
      has_indian_passport,
      amount,
      payment_method,
      message,
    ]);

    res.status(200).json({
      message: "Donation successful",
      donationId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/donations", authenticateToken, async (req, res) => {
  try {
    const query = `
            SELECT * FROM donations 
            ORDER BY created_at DESC
        `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/donation-receipt/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM donations WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Donation not found" });

    const donation = result.rows[0];
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=donation-" + donation.id + ".pdf"
    );
    doc.pipe(res);

    // Add background color
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f8f8f8");

    // Add decorative header strip
    doc.rect(0, 0, doc.page.width, 120).fill("#4a5568");

    // Add white text for header
    doc
      .fill("#ffffff")
      .fontSize(28)
      .font("Helvetica-Bold")
      .text("ISKCON TIRUPATI", 50, 50, { align: "center" });

    doc
      .fontSize(16)
      .font("Helvetica")
      .text("Donation Receipt", 50, 85, { align: "center" });

    // Reset text color for rest of content
    doc.fill("#000000");

    // Add receipt box
    doc
      .rect(50, 140, doc.page.width - 100, 60)
      .lineWidth(1)
      .stroke("#e2e8f0");

    // Receipt details
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Receipt No:", 70, 155)
      .font("Helvetica")
      .text(`ISKT-${donation.id.toString().padStart(6, "0")}`, 180, 155)
      .font("Helvetica-Bold")
      .text("Date:", 350, 155)
      .font("Helvetica")
      .text(
        new Date(donation.created_at).toLocaleDateString("en-IN"),
        400,
        155
      );

    // Donor Details Section
    doc
      .rect(50, 220, doc.page.width - 100, 200)
      .lineWidth(1)
      .stroke("#e2e8f0");

    doc.fontSize(14).font("Helvetica-Bold").text("Donor Details", 70, 240);

    const detailsY = 270;
    const col1X = 70;
    const col2X = 180;
    const lineHeight = 25;

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Name:", col1X, detailsY)
      .font("Helvetica")
      .text(`${donation.first_name} ${donation.last_name}`, col2X, detailsY)

      .font("Helvetica-Bold")
      .text("Address:", col1X, detailsY + lineHeight)
      .font("Helvetica")
      .text(
        `${donation.street_address}${
          donation.apartment ? ", " + donation.apartment : ""
        }`,
        col2X,
        detailsY + lineHeight
      )
      .text(
        `${donation.city}, ${donation.state} - ${donation.postcode}`,
        col2X,
        detailsY + lineHeight * 2
      )

      .font("Helvetica-Bold")
      .text("Phone:", col1X, detailsY + lineHeight * 3)
      .font("Helvetica")
      .text(donation.phone, col2X, detailsY + lineHeight * 3)

      .font("Helvetica-Bold")
      .text("Email:", col1X, detailsY + lineHeight * 4)
      .font("Helvetica")
      .text(donation.email, col2X, detailsY + lineHeight * 4);

    // Donation Amount Box (Highlighted)
    doc.rect(50, 440, doc.page.width - 100, 80).fill("#f7fafc");

    // Convert amount to number and format it
    const amount = parseFloat(donation.amount);
    const formattedAmount = !isNaN(amount) ? amount.toFixed(2) : "0.00";

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fill("#000000")
      .text("Donation Details", 70, 460);

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Amount:", 70, 485)
      .font("Helvetica")
      .text(`₹${formattedAmount}`, 180, 485)
      .font("Helvetica-Bold")
      .text("Payment Method:", 350, 485)
      .font("Helvetica")
      .text(donation.payment_method, 460, 485);

    // Footer
    doc
      .fontSize(10)
      .text(
        "Thank you for your generous contribution to ISKCON Tirupati.",
        50,
        700,
        { align: "center" }
      )
      .moveDown(0.5)
      .text(
        "This receipt is electronically generated and does not require signature.",
        { align: "center" }
      );

    // Add page border
    doc
      .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
      .lineWidth(1)
      .stroke("#718096");

    doc.end();
  } catch (error) {
    console.error("Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate receipt" });
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
