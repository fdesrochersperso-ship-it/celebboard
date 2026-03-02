// Removes stale .next/dev/lock so next dev can start (handles crash/kill leftovers)
const fs = require("fs");
const path = require("path");
const lockPath = path.join(__dirname, "..", ".next", "dev", "lock");
try {
  if (fs.existsSync(lockPath)) {
    fs.unlinkSync(lockPath);
  }
} catch (_) {}
