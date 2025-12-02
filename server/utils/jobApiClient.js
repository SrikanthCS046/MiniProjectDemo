const axios = require("axios");

const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY || "";
const JSEARCH_HOST = "jsearch.p.rapidapi.com";

async function searchJobs(query, location = "", limit = 10) {
  try {
    if (!JSEARCH_API_KEY) {
      console.warn("JSearch API key not configured");
      return [];
    }

    const options = {
      method: "GET",
      url: "https://jsearch.p.rapidapi.com/search",
      params: {
        query: query,
        page: "1",
        num_pages: "1"
      },
      headers: {
        "x-rapidapi-key": JSEARCH_API_KEY,
        "x-rapidapi-host": JSEARCH_HOST
      }
    };

    if (location) options.params.location = location;

    const response = await axios.request(options);
    return response.data?.data || [];
  } catch (error) {
    console.warn("Job search API error (non-fatal):", error.message);
    return [];
  }
}

async function parseJobData(job) {
  return {
    jobId: job.job_id,
    jobTitle: job.job_title,
    company: job.employer_name,
    location: `${job.job_city}, ${job.job_state}, ${job.job_country}`,
    jobUrl: job.job_apply_link,
    description: job.job_description,
    salary: job.job_salary_currency
      ? `${job.job_salary_currency} ${job.job_min_salary || "N/A"} - ${job.job_max_salary || "N/A"}`
      : "Not listed",
    jobType: job.job_employment_type,
    postedDate: job.job_posted_at_datetime_utc || "Recently",
    applicantCount: job.job_apply_count || 0,
    requiredSkills: job.job_required_skills || []
  };
}

module.exports = {
  searchJobs,
  parseJobData
};
