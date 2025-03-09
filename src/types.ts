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

export interface Input {
  resumePath: string;
  jobPreferences: string;
  platform: string;
  OPENAI_API_KEY: string;
}

export const responseSchema = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
          },
          company: {
            type: "string",
          },
          location: {
            type: "string",
          },
          link: {
            type: "string",
          },
          match_score: {
            type: "string",
          },
          match_reason: {
            type: "string",
          },
          sample_cover_letter: {
            type: "string",
          },
        },
        required: ["title", "company", "location", "link", "match_score", "match_reason", "sample_cover_letter"]
      }
    }
  },
  required: ["results"]
};
