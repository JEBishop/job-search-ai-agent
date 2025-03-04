import { Actor } from 'apify';
import { JobListing, JobPreferences, JobPreferencesZod, MatchedJob, MatchedJobsZod, Input } from './types.js'
import { extractJobPreferences, extractResumeText, callJobScrapers, matchJobsWithLLM } from './utils.js'
import OpenAI from 'openai';

await Actor.init();

const input = await Actor.getInput<Input>();
if (!input) throw new Error('No input provided.');

await Actor.charge({ eventName: 'init' });

const { OPENAI_API_KEY, resumePath, jobPreferences, platform } = input;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const prefs: JobPreferences = await extractJobPreferences(openai, jobPreferences);

let resumeText = '';
if (resumePath) {
    const extracted = await extractResumeText(resumePath);
    resumeText = extracted.resumeText;
    await Actor.charge({
        eventName: 'resume-parse-page',
        count: extracted.numPages,
    });
}

const jobResults = await callJobScrapers(prefs.jobTitle, prefs.location, platform);
await Actor.charge({
    eventName: 'job-results-output',
    count: jobResults.length,
});

const matchedJobs: MatchedJob[] = await matchJobsWithLLM(openai, resumeText, jobResults, prefs);

await Actor.pushData(matchedJobs);

await Actor.exit();