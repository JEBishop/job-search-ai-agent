import type { Job } from './types.js';

export const formatHtml = (results: Job[]) => {
    let html = `<!DOCTYPE html>
<html>
<head>
    <title>Job Matches</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .job { border-bottom: 1px solid #ccc; padding: 10px 0; }
        .title { font-size: 18px; font-weight: bold; }
        .company { font-size: 16px; color: #555; }
        .location { font-size: 14px; color: #777; }
        .match-score { font-size: 14px; font-weight: bold; }
        .reason { font-size: 14px; }
        .cover-letter { font-size: 14px; background: #f9f9f9; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Job Matches</h1>
    ${results.map((job: Job) => `
        <div class='job'>
            <div class='title'><a href='${job.link}' target='_blank'>${job.title}</a></div>
            <div class='company'>${job.company}</div>
            <div class='location'>${job.location}</div>
            <div class='match-score'>Match Score: ${job.match_score}/100</div>
            <div class='reason'>${job.match_reason}</div>
            <div class='cover-letter'><strong>Sample Cover Letter:</strong><br>${job.sample_cover_letter.replace(/\n/g, '<br>')}</div>
        </div>
    `).join('')}
</body>
</html>`;
    return html.replace(/\s+/g, ' ').trim();
}

export const formatMarkdown = (results: Job[]) => {
    let markdown = `# Job Matches\n\n`;
    results.forEach((job: Job) => {
        markdown += `## [${job.title}](${job.link})\n`;
        markdown += `**Company:** ${job.company}\n\n`;
        markdown += `**Location:** ${job.location}\n\n`;
        markdown += `**Match Score:** ${job.match_score}/100\n\n`;
        markdown += `**Match Reason:** ${job.match_reason}\n\n`;
        markdown += `### Sample Cover Letter\n\n\`\`\`
${job.sample_cover_letter}
\`\`\`\n\n`;
        markdown += `---\n\n`;
    });
    return markdown;
}
