const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
  } catch (e) {
    console.error("Error reading data file:", e);
  }
  return [];
}

function writeData(entries) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), "utf8");
}

// Get all entries
app.get("/api/entries", (req, res) => {
  res.json(readData());
});

// Add an entry
app.post("/api/entries", (req, res) => {
  const { name, location, dates, colorIdx } = req.body;
  if (!name || !location || !Array.isArray(dates)) {
    return res.status(400).json({ error: "name, location, and dates[] are required" });
  }
  const entries = readData();
  entries.push({ name: name.trim(), location, dates, colorIdx: colorIdx ?? 0 });
  writeData(entries);
  res.json({ ok: true });
});

// Delete all entries for a person
app.delete("/api/entries/:name", (req, res) => {
  const entries = readData();
  const filtered = entries.filter(
    (e) => e.name.toLowerCase() !== req.params.name.toLowerCase()
  );
  writeData(filtered);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
