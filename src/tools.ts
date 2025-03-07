import { Tool } from '@langchain/core/tools';
import { Actor } from 'apify';
import pdfParse from 'pdf-parse';
import axios from 'axios';
import { Job, ScraperConfig, ScraperPlatform } from './types.js'
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
});

class ResponseFormatterTool extends Tool {
    name = 'response_formatter';
    description = 'Format the output response. The required format is this: [{ "title": string, "company": string, "location": string, "link": string, "match_score": number, "match_reason": string, "sample_cover_letter: string" }]';
    async _call(arg: string) {
      try {
        let jobs: Job[];
        if (typeof arg === 'string') {
          try { jobs = JSON.parse(arg); } 
          catch (e) { throw new Error('Input string is not valid JSON'); }
        } else if (Array.isArray(arg)) {
          jobs = arg as Job[];
        } else {
          throw new Error('Input must be array or JSON string');
        }

        console.log(`Formatting output for ${jobs.length} matched roles.`);
          
        const output = jobs.map((job: Job) => ({
          title: job.title || 'Unknown Title',
          company: job.company || 'Unknown Company',
          location: job.location || 'Location not specified',
          link: job.link || 'URL unknown',
          match_score: Math.min(Math.max(job.match_score || 0, 0), 100), // Clamp 0-100
          match_reason: job.match_reason || 'Strong alignment with candidate profile',
          sample_cover_letter: job.sample_cover_letter || 'Dear Hiring Manager... [DEFAULT]'
        }));

        return JSON.stringify(output);
      } catch (error) {
          console.error('ResponseFormatterTool encountered an error:', error);
          throw new Error('Response formatting failed');
      }
  }
}

class ExtractResumeTextTool extends Tool {
  name = 'extract_resume_text';
  description = 'Extract text from resume PDF. Input: { "resumePath": string }';
  async _call(arg: string) {
    try {
      const resumePath = arg;

      console.log(`Pulling resume from ${resumePath}`);
      new URL(resumePath);
      
      const response = await axios.get(resumePath, { responseType: 'arraybuffer' });
      const data = await pdfParse(response.data);
      console.log('resume pages');
      console.log(data.numpages);
      await Actor.charge({ eventName: 'resume-parse-page', count: data.numpages });
      return JSON.stringify({ resumeText: data.text });
    } catch (err: any) {
        console.log('Invalid URL or error processing resume:', err.message);
        return JSON.stringify({ error: err.message });
    }
  }
}

class CallJobScrapersTool extends Tool {
  name = 'call_job_scrapers';
  description = 'Fetch job listings. Input: { "jobTitle": string, "location": string, "link": string, "platform": string }';
  async _call(arg: string) {
    const { jobTitle, location, platform } = JSON.parse(arg);

    console.log(`Finding ${jobTitle} roles in ${location} on ${platform}`);

    const scraper: ScraperConfig = getScraper(jobTitle, location, platform);

    try {
        const run = await client.actor(scraper.actor).call(scraper.data);
        const { items: jobResults } = await client.dataset(run.defaultDatasetId).listItems();
        
        console.log(`Found ${jobResults.length} roles`);
        
        return JSON.stringify({ jobResults: jobResults });
    } catch (err: any) {
        console.log(err.message);
        return JSON.stringify([]);
    }
  }
}

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
                results: 10
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
  new ExtractResumeTextTool(),
  new CallJobScrapersTool(),
  new ResponseFormatterTool()
];