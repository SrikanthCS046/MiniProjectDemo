const express = require("express");
const router = express.Router();
const {
  findJobs,
  saveJob,
  getSavedJobs,
  markApplied
} = require("../controllers/jobController");

router.post("/search", findJobs);
router.post("/save", saveJob);
router.get("/saved/:userId", getSavedJobs);
router.post("/mark-applied", markApplied);

module.exports = router;
