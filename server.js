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
  const { name, email, amount, message } = req.body;

  try {
    const result = await pool.query(
      `
            INSERT INTO donations (name, email, amount, message, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING id
        `,
      [name, email, amount, message]
    );

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
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Donation not found" });
    }

    const donation = result.rows[0];
    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=donation-${donation.id}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(20).text("Donation Receipt", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Receipt ID: ${donation.id}`);
    doc.text(`Date: ${new Date(donation.created_at).toLocaleDateString()}`);
    doc.text(`Donor Name: ${donation.name}`);
    doc.text(`Email: ${donation.email}`);
    doc.text(`Amount: Rs${donation.amount}`);
    if (donation.message) {
      doc.text(`Message: ${donation.message}`);
    }

    doc.end();
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
