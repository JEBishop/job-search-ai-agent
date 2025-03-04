import { z } from 'zod';

export const scrapers: { [key: string]: string } = {
    linkedin: "scraper1",
    indeed: "scraper2",
    glassdoor: "scraper3",
    test: "scraper4",
};

export interface ResumeParserOutput {
    resumeText: string;
    numPages: number;
}

export interface JobPreferences {
    jobTitle: string;
    location: string;
    prefs: string | null;
}

export const JobPreferencesZod = z.object({
  jobTitle: z.string(),
  location: z.string(),
  prefs: z.string(),
});

export interface JobListing {
    title: string;
    company: string;
    location: string;
    url: string;
}

export interface Input {
    resumePath: string;
    jobPreferences: string;
    platform: string;
    OPENAI_API_KEY: string;
}

export interface MatchedJob {
    title: string;
    company: string;
    location: string;
    matchScore: number;
    reason: string;
    coverLetter: string;
}

export const MatchedJobZod = z.object({
    title: z.string(),
    company: z.string(),
    location: z.string(),
    matchScore: z.number(),
    reason: z.string(),
    coverLetter: z.string()
});

export const MatchedJobsZod = z.object({
    matchedJobs: z.array(MatchedJobZod)
});

export type Platform = keyof typeof scrapers