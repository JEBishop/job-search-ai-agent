# Job Search AI Agent

## Overview
Job Search AI Agent is an Apify Actor that automates the process of finding job listings based on user-defined preferences. By leveraging OpenAI's GPT capabilities, it analyzes job postings, scores them based on relevance, and even generates tailored cover letters for each opportunity.

## Features
- **Automated Job Searching:** Finds jobs on platforms like Indeed, Glassdoor, and LinkedIn.
- **AI-Powered Matching:** Uses OpenAI to score job postings based on the provided preferences.
- **Resume Analysis:** Parses a provided resume to improve job recommendations.
- **Custom Cover Letter Generation:** Generates personalized cover letters for each matched job.

## Input Configuration
The actor requires the following input parameters:

```json
{
    "title": "Job Search AI Agent",
    "type": "object",
    "schemaVersion": 1,
    "properties": {
        "jobPreferences": {
            "title": "Job Preferences",
            "type": "string",
            "description": "Your job preferences (i.e. remote, title, location, etc.)",
            "editor": "textfield",
            "prefill": "I'm looking for remote software engineering roles in San Francisco, CA."
        },
        "OPENAI_API_KEY": {
            "title": "OpenAI API Key",
            "type": "string",
            "description": "The API key to use for prompting ChatGPT.",
            "editor": "textfield"
        },
        "resumePath": {
            "title": "Resume URL Path",
            "type": "string",
            "description": "The URL of the resume to parse.",
            "editor": "textfield"
        },
        "platform": {
            "title": "Platform",
            "type": "string",
            "enum": ["indeed", "glassdoor", "linkedin", "test"],
            "description": "Job platform to return.",
            "editor": "select",
            "prefill": "indeed"
        }
    },
    "required": ["OPENAI_API_KEY", "jobPreferences", "resumePath"]
}
```

## Output
The actor returns a list of matched job opportunities, including:
- **Title**
- **Company**
- **Location**
- **Match Score**
- **Reason for match**
- **AI-Generated Cover Letter**

Example output:
```json
[
    {
        "title": "Business Systems Analyst (Analytics & Insights)",
        "company": "Saama Technologies Inc",
        "location": "San Francisco, CA",
        "matchScore": 85,
        "reason": "The role involves data analytics and problem-solving, which aligns with the candidate's analytical skills and experience. It also offers a position in San Francisco, matching the candidate's location preference.",
        "coverLetter": "Dear Hiring Manager,\n\nI am writing to express my interest in the Business Systems Analyst (Analytics & Insights) position at Saama Technologies. With a strong background in analytical skills and a commitment to data-driven problem solving, I believe I can contribute significantly to your team.\n\nThroughout my academic and professional journey, I have honed my ability to analyze complex data sets and communicate insights effectively. My experience in coordinating projects and collaborating with cross-functional teams has equipped me with the skills necessary to excel in a dynamic environment such as Saama's.\n\nI am particularly drawn to your emphasis on innovation and collaboration. I am eager to bring my results-oriented mindset and dedication to solving complex business challenges to your organization. I look forward to the opportunity to discuss how my skills align with the needs of your team.\n\nThank you for considering my application. I hope to speak with you soon.\n\nSincerely,\n[Your Name]"
    }
]
```

## Pricing
This actor operates on a **pay-per-event** model:
- **Actor Initialization:** $1 per run
- **Resume Parse:** $0.25 per page
- **Job Result:** $0.05 per result returned

## Usage Instructions
1. Deploy the actor on Apify.
2. Provide the required input parameters.
3. Run the actor to fetch job listings and AI-generated cover letters.
4. Review the output and apply to jobs efficiently.

## Requirements
- Apify account
- OpenAI API key
- Resume hosted at a publicly accessible URL

## Support
For any issues or feature requests, please reach out via the Apify community or GitHub repository.

---
**Note:** This actor relies on third-party job platforms, and availability of job listings may vary based on platform restrictions.