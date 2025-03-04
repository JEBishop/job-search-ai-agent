import { JobListing, JobPreferences, JobPreferencesZod, MatchedJob, MatchedJobsZod, Input, ResumeParserOutput } from './types.js'
import { Actor } from 'apify';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';
import axios from 'axios';
import { zodResponseFormat } from 'openai/helpers/zod';

export async function callJobScrapers(jobTitle: string, location: string, platform: string): Promise<JobListing[]> {
    let jobResults: JobListing[] = [];

    const scrapers = {
        linkedin: {
            actor: 'bebity/linkedin-jobs-scraper',
            data: {
                title: jobTitle,
                location: location,
                totalRows: 25
            }
        },
        indeed: { 
            actor:'misceres/indeed-scraper',
            data: {
                position: jobTitle,
                location: location,
                maxItems: 25
            }
        },
        glassdoor: {
            actor: 'bebity/glassdoor-jobs-scraper',
            data: {
                keyword: jobTitle,
                location: location,
                maxItems: 25
            }
        },
        test: {
            actor: 'harvest/jobs-stub',
            data: {
                platform: 'glassdoor'
            }
        }
    };
    
    const run = await Actor.call(
        scrapers[platform as keyof typeof scrapers].actor, 
        scrapers[platform as keyof typeof scrapers].data
    );
    
    if (run.defaultDatasetId) {
        const dataset = await Actor.openDataset(run.defaultDatasetId);
        const items = await dataset.getData();
        if (Array.isArray(items.items)) {
            jobResults.push(...items.items as JobListing[]);
        }
    }

    return jobResults;
}

export async function extractResumeText(fileUrl: string): Promise<ResumeParserOutput> {
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });

    const data = await pdfParse(response.data);
    
    return { resumeText: data.text, numPages: data.numpages };
}

export async function extractJobPreferences(openai: OpenAI, preferences: string) {
    const prompt = `
    You are a job-matching assistant. Extract the location, job title, and preferences from this client input:
    
    ${preferences}
    
    Provide ONLY a textual JSON output, each with a title, location, and preferences.
    `;

    const response = await openai.beta.chat.completions.parse({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.7,
        response_format: zodResponseFormat(JobPreferencesZod, 'job_preferences')
    });

    const content = response.choices[0].message.parsed;
    if (content === null) {
        throw new Error('LLM response content is null');
    }

    return content;
}

export async function matchJobsWithLLM(openai: OpenAI, resumeText: string, jobResults: JobListing[], preferences: JobPreferences): Promise<MatchedJob[]> {
    const prompt = `
    You are a job-matching assistant. Based on the candidate's resume and preferences, analyze the following job listings and determine the best matches.
    
    Candidate Resume:
    ${resumeText}
    
    Job Preferences:
    ${JSON.stringify(preferences)}
    
    Job Listings:
    ${JSON.stringify(jobResults)} 
    
    Provide only a structured JSON array output of the top matches, each with a title, company, location, match score (0-100), reason for the match, and a sample cover letter that could be used for the role.
    `;

    const response = await openai.beta.chat.completions.parse({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.7,
        response_format: zodResponseFormat(MatchedJobsZod, 'matchedJobs')
    });

    const content = response.choices[0].message.parsed;
    if (content === null) {
        throw new Error('LLM response content is null');
    }
    
    return content.matchedJobs;
}