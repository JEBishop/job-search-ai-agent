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