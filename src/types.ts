import { z } from 'zod';

export const scrapers: { [key: string]: string } = {
    linkedin: "scraper1",
    indeed: "scraper2",
    glassdoor: "scraper3",
    test: "scraper4",
};

export interface ScraperConfig {
    actor: string,
    data: Record<string, string | number>
}

export interface UserPreference {
    jobTitle: string,
    location: string,
    prefs: string
}

export const ResponseFormatter = z.object({
    title: z.string().describe('The job title'),
    company: z.string().describe('The hiring company'),
    location: z.string().describe('The location of the role'),
    match_score: z.number().describe('Scale 0-100 how well the user meets the criteria of the job'),
    match_reason: z.string().describe('The justification for the user\'s match_score'),
    sample_cover_letter: z.string().describe('A sample cover letter that the user can use to apply to the role')
});

export interface Job {
    title: string;
    company: string;
    location: string;
    link: string;
    match_score: number;
    match_reason: string;
    sample_cover_letter: string;
}

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