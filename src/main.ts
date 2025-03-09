import { Actor } from 'apify';
import log from '@apify/log';
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import type { Input, Job } from './types.js';
import { agentTools } from './tools.js'
import { responseSchema } from './types.js'
import { setContextVariable } from "@langchain/core/context";
import { RunnableLambda } from "@langchain/core/runnables";

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
  tools: agentTools,
  responseFormat: responseSchema
});

try {
  const handleRunTimeRequestRunnable = RunnableLambda.from(
    async ({ jobPreferences: jobPreferences, platform: platform, resumePath: resumePath }) => {
      setContextVariable("jobPreferences", jobPreferences);
      setContextVariable("platform", platform);
      setContextVariable("resumePath", resumePath);
      const modelResponse = await agent.invoke({
        messages: [new HumanMessage(`
          Follow these steps carefully and in order.:

            STEP 1: Extract user job preferences:
            - Extract the user's preferences for: "${jobPreferences}" using the extract_job_preferences tool.

            STEP 2: Get the user's resume:
            - Extract the user's resume text ${resumePath ? `from "${resumePath}"` : ""} using the extract_resume_text tool.

            STEP 3: Fetch jobs:
            - Fetch jobs from platform "${platform}" with the user's requested job title, location, and preferences using the call_job_scrapers tool.

            STEP 4: Match Jobs & Generate Output:  
            - Using the candidate's resume text and job preferences, analyze the fetched jobs. 
            - Output a JSON array containing ALL relevant job matches (at least 5 if available) and stop any further processing.
          `)]
      }, {
        recursionLimit: 10
      });
      return modelResponse.structuredResponse as Job[];
    }
  );

  const output: Job[] = await handleRunTimeRequestRunnable.invoke({ 
    jobPreferences: jobPreferences,
    platform: platform,
    resumePath: resumePath
  });

  log.info(JSON.stringify(output));

  await Actor.charge({ eventName: 'job-results-output', count: output.length });

  await Actor.pushData(output);
} catch (e: any) {
  console.log(e);
  await Actor.pushData({ error: e.message });
}
await Actor.exit();