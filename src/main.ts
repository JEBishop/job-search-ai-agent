import { Actor } from 'apify';
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, MessageContentComplex } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import type { Input } from './types.js';
import { agentTools } from './tools.js'
import fs from 'fs';

await Actor.init();
const input = await Actor.getInput<Input>();
if (!input) throw new Error('No input provided.');

await Actor.charge({ eventName: 'init' });
const { OPENAI_API_KEY = '', resumePath, jobPreferences, platform } = input;

let llmAPIKey;
if(!OPENAI_API_KEY || OPENAI_API_KEY.length == 0) {
  llmAPIKey = process.env.OPENAI_API_KEY;
  await Actor.charge({ eventName: 'llm-input', count: jobPreferences.length });
} else {
  llmAPIKey = OPENAI_API_KEY;
}

const agentModel = new ChatOpenAI({ 
  apiKey: llmAPIKey,
  modelName: "gpt-4o-mini",  
}).bind({
  response_format: { type: "json_object" },
  tools: agentTools
});

const agent = createReactAgent({
  llm: agentModel,
  tools: agentTools
});

try {
  const finalState = await agent.invoke(
    {
      messages: [
        new HumanMessage(
          `Follow these steps carefully and in order.:

            STEP 1: Extract the user's preferences for: "${jobPreferences}" into this format { "jobTitle": string, "location": string, "link": string, "prefs": string }
            - 'prefs' includes things like salary, remote work, etc.
             Do not output anything, you will use this information in STEP 3 and STEP 4.

            STEP 2: Extract resume text ${resumePath ? `from "${resumePath}"` : ""} using **extract_resume_text**  
             Do not output anything, you will use this information in STEP 4.

            STEP 3: Fetch jobs from platform "${platform}" with the user's requested job title and location using **call_job_scrapers**  
             Do not output anything, you will use this information in STEP 4.

            STEP 4: Match Jobs & Generate Output:  
            - Using the candidate's resume (from STEP 2) and job preferences (from STEP 1), analyze the jobs retrieved in STEP 3.  
            - Create a JSON array containing ALL relevant job matches (at least 5 if available).
            - Structure each JSON object in the array with these fields:
              {
                "title": "Job Title",
                "company": "Company Name",
                "location": "Location",
                "link": "URL",
                "match_score": 75,
                "match_reason": "Brief explanation",
                "sample_cover_letter": "Cover letter text"
              }
            - Call the response_formatter tool ONCE with this complete JSON array.
            - The response_formatter will return a JSON array.
            - YOUR FINAL OUTPUT MUST BE THIS JSON ARRAY EXACTLY as returned by response_formatter.

            ⚠ IMPORTANT: The final output must be a valid JSON array containing at least 5 job matches (if available).
            - This is the FINAL STEP. Do not process further after the formatter returns.

            STOP_CONDITION = Output from response_formatter is returned
          `
        )
      ]
    }, {
      recursionLimit: 8
    }
  );

  var content = finalState.messages[finalState.messages.length - 1].content;

  /**
   * Some GPT models will wrap the output array in an object, despite response formatting and strict prompting.
   * Ex: { "results": [<< our data array >>] }
   * Need to handle these edge cases gracefully in order to guarantee consistent output for users.
   */
  if (typeof content === 'string') {
    try {
      const parsedContent = JSON.parse(content) as MessageContentComplex[];
      if (typeof parsedContent === 'object' && parsedContent !== null && !Array.isArray(parsedContent)) {
        const possibleKeys = ['input', 'output', 'result', 'results', 'response', 'jobs', 'job_matches', 'jobMatches', 'data'];
        
        const matchingKey = possibleKeys.find(key => key in parsedContent as any);
        
        if (matchingKey) {
          content = (parsedContent as any)[matchingKey];
        } else {
          content = parsedContent;
        }
      } else {
        content = parsedContent; 
      }
    } catch (error) {
      console.error("Failed to parse JSON:", error);
    }
  }
  const output = Array.isArray(content) ? content: [content];

  console.log(output)

  await Actor.charge({ eventName: 'job-results-output', count: output.length });

  await Actor.pushData(output);
} catch (e: any) {
  console.log(e);
  await Actor.pushData({ error: e.message });
}
await Actor.exit();