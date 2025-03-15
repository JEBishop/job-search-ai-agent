export type ScraperPlatform = "indeed" | "nowhiteboard";

export interface ScraperConfig {
  actor: string,
  data: Record<string, string | number>
}

export interface Job {
  title: string;
  company: string;
  location: string;
  link: string;
  match_score: number;
  match_reason: string;
  sample_cover_letter: string;
}

export interface JobListingsOutput {
  listings: Job[];
}
export interface Input {
  resumePath: string;
  jobPreferences: string;
  platform: string;
  OPENAI_API_KEY: string;
}

export const responseSchema = {
  type: "object",
  properties: {
    listings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The job title."
          },
          company: {
            type: "string",
            description: "The company name."
          },
          location: {
            type: "string",
            description: "The work location."
          },
          link: {
            type: "string",
            description: "The URL of the job posting."
          },
          match_score: {
            type: "number",
            description: "Score on a 100-point scale of how well the job matches the candidate."
          },
          match_reason: {
            type: "string",
            description: "The justification for the match_score."
          },
          sample_cover_letter: {
            type: "string",
            description: "A sample cover letter that the candidate could use to apply to the role."
          },
        },
        required: ["title", "company", "location", "link", "match_score", "match_reason", "sample_cover_letter"]
      }
    }
  },
  required: ["results"]
};
