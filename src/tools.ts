import { tool } from '@langchain/core/tools';
import pdfParse from 'pdf-parse';
import { ApifyClient } from 'apify-client';
import { z } from 'zod';
import log from '@apify/log';
import { ScraperConfig, ScraperPlatform } from './types.js';
import axios from 'axios';
import { Actor } from 'apify';

const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
});

const extractJobPreferencesTool = tool(
  async(input) => {
    log.info('in extract_job_preferences');
    log.info(JSON.stringify(input));
    return JSON.stringify({
      jobTitle: input.jobTitle,
      location: input.location,
      locjobPreferencesation: input.jobPreferences,
      platform: input.platform
    });
  },
  {
    name: 'extract_job_preferences',
    description: 'Convert the user\'s request into a JSON object.',
    schema: z.object({
      jobTitle: z.string().describe('Target job title.'),
      location: z.string().describe('Target work location.'),
      jobPreferences: z.string().describe('User\'s job preferences - (remote work, work-from-home, salary, etc).'),
      platform: z.string().describe('Platform to scrape jobs from.')
    })
  }
)

const callJobScrapersTool = tool(
  async (input) => {
    log.info('in call_job_scrapers');
    log.info(JSON.stringify(input));
    try {
      const scraper: ScraperConfig = getScraper(input.jobTitle, input.location, input.platform);
      const run = await client.actor(scraper.actor).call(scraper.data);
      const { items: listings } = await client.dataset(run.defaultDatasetId).listItems();
    
      log.info(`Found ${listings.length} ${input.jobTitle} from ${input.platform}.`);
      return JSON.stringify(listings);
    } catch (err: any) {
      log.error('call_job_scrapers error: ' + err.message);
      return JSON.stringify([]);
    }
  },
  {
    name: 'call_job_scrapers',
    description: 'Fetch job listings.',
    schema: z.object({
      jobTitle: z.string().describe('Target job title. (This should be a job title and not a profession - engineer, not engineering.'),
      location: z.string().describe('Target work location.'),
      platform: z.string().describe('Platform to scrape jobs from.')
    })
  }
);

const extractResumeTextTool = tool(
  async (input) => {
    log.info('in extract_resume_text');
    log.info(JSON.stringify(input));
    try {
      log.info(`Pulling resume from ${input.resumePath}`);
      new URL(input.resumePath);
      
      const response = await axios.get(input.resumePath, { responseType: 'arraybuffer' });
      const data = await pdfParse(response.data);

      log.info('Resume pages: ' + data.numpages);

      await Actor.charge({ eventName: 'resume-parse-page', count: data.numpages });
      return JSON.stringify({ resumeText: data.text });
    } catch (err: any) {
      log.error('Invalid URL or error processing resume:', err.message);
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: 'extract_resume_test',
    description: 'Extract text from a PDF resume.',
    schema: z.object({
      resumePath: z.string().describe('URL for the resume to extract text from.')
    })
  }
);

function getScraper(jobTitle: string, location: string, platform: string): ScraperConfig {
    const scrapers: Record<ScraperPlatform, ScraperConfig> = {
        indeed: { 
            actor: 'hMvNSpz3JnHgl5jkh',
            data: {
                position: jobTitle,
                location: location,
                maxItems: 10
            }
        },
        nowhiteboard: {
            actor: 'YSaUTFTERTT3Kzncj',
            data: {
                location: location,
                results: 10,
                jobTitle: jobTitle
            }
        }
    };

    if (!(platform in scrapers)) {
        throw new Error(`Invalid platform: ${platform}`);
    }

    console.log(scrapers[platform as ScraperPlatform])
    return scrapers[platform as ScraperPlatform];
}

export const agentTools = [
  extractJobPreferencesTool,
  callJobScrapersTool,
  extractResumeTextTool
];