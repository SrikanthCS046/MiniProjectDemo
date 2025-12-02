const JobSearch = require("../models/JobSearch");
const { searchJobs, parseJobData } = require("../utils/jobApiClient");

const findJobs = async (req, res) => {
  try {
    const { query, location = "", userId } = req.body;

    if (!query) {
      return res.status(400).json({ ok: false, error: "Search query is required" });
    }

    const jobs = await searchJobs(query, location, 10);

    if (!jobs || jobs.length === 0) {
      return res.json({ ok: true, jobs: [] });
    }

    const parsedJobs = await Promise.all(
      jobs.map(async (job) => {
        const parsed = await parseJobData(job);

        if (userId) {
          try {
            const jobRecord = new JobSearch({
              userId,
              ...parsed,
              createdAt: new Date()
            });
            await jobRecord.save();
          } catch (saveErr) {
            console.warn("Failed to save job record:", saveErr.message);
          }
        }

        return parsed;
      })
    );

    res.json({ ok: true, jobs: parsedJobs });
  } catch (err) {
    console.error("findJobs error", err);
    res.status(500).json({ ok: false, error: "Job search failed" });
  }
};

const saveJob = async (req, res) => {
  try {
    const { userId, jobId } = req.body;

    const job = await JobSearch.findOneAndUpdate(
      { userId, jobId },
      { saved: true },
      { new: true }
    );

    res.json({ ok: true, job });
  } catch (err) {
    console.error("saveJob error", err);
    res.status(500).json({ ok: false, error: "Failed to save job" });
  }
};

const getSavedJobs = async (req, res) => {
  try {
    const { userId } = req.params;
    const jobs = await JobSearch.find({ userId, saved: true }).sort({ createdAt: -1 });
    res.json({ ok: true, jobs });
  } catch (err) {
    console.error("getSavedJobs error", err);
    res.status(500).json({ ok: false, error: "Failed to retrieve saved jobs" });
  }
};

const markApplied = async (req, res) => {
  try {
    const { userId, jobId } = req.body;

    const job = await JobSearch.findOneAndUpdate(
      { userId, jobId },
      { applied: true },
      { new: true }
    );

    res.json({ ok: true, job });
  } catch (err) {
    console.error("markApplied error", err);
    res.status(500).json({ ok: false, error: "Failed to mark job" });
  }
};

module.exports = {
  findJobs,
  saveJob,
  getSavedJobs,
  markApplied
};
