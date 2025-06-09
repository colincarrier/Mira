/**
 * Company Intelligence Module
 * Provides comprehensive business intelligence and company research capabilities
 */

export interface CompanyProfile {
  name: string;
  foundedYear?: string;
  founders?: string[];
  businessModel: string;
  keyProducts: string[];
  industryPosition: string;
  fundingHistory?: string;
  marketPresence: string;
  recentDevelopments: string[];
  culturalSignificance: string;
  technicalDetails?: string;
  competitiveLandscape?: string;
  targetDemographics?: string;
}

/**
 * Company Intelligence Database
 * Contains detailed profiles of major companies, especially in tech and AI
 */
export const COMPANY_INTELLIGENCE_DB: Record<string, CompanyProfile> = {
  "pinata farms": {
    name: "Piñata Farms",
    foundedYear: "2019-2020",
    founders: ["Colin Carrier (ex-Twitch Chief Strategy Officer)", "Josh Hossain"],
    businessModel: "Consumer AI company focused on meme creation and viral remix culture",
    keyProducts: [
      "Mobile app for creating and remixing memes using AI-assisted tools",
      "AI-powered voiceovers and face swaps",
      "Scene editing and personalization tools",
      "Social meme sharing platform"
    ],
    industryPosition: "Pioneer in AI-powered meme creation and remix culture",
    fundingHistory: "Backed by Andreessen Horowitz (a16z) and BoxGroup",
    marketPresence: "Los Angeles / San Francisco based, popular with Gen Z and creator communities",
    recentDevelopments: [
      "Advanced AI tools for automatic face tracking and lip sync",
      "Voice generation and motion matching capabilities",
      "Integration with Discord, TikTok, and Instagram Stories",
      "Focus on spontaneous, irreverent content creation"
    ],
    culturalSignificance: "Represents the intersection of AI technology and internet culture, offering a subversive counterpoint to sanitized social content",
    technicalDetails: "AI-as-co-creator platform that blurs the line between user-generated content and AI remixing",
    competitiveLandscape: "Positioned as 'TikTok for memes' with emphasis on low-friction creation and virality",
    targetDemographics: "Gen Z users, creator communities, Discord communities, and private group chat users"
  },
  "openai": {
    name: "OpenAI",
    foundedYear: "2015",
    founders: ["Sam Altman", "Elon Musk", "Greg Brockman", "Ilya Sutskever"],
    businessModel: "AI research and deployment company focused on artificial general intelligence",
    keyProducts: ["GPT models", "ChatGPT", "DALL-E", "Whisper", "Codex"],
    industryPosition: "Leading AI research organization",
    fundingHistory: "Multi-billion dollar funding from Microsoft and others",
    marketPresence: "Global leader in conversational AI and generative models",
    recentDevelopments: ["GPT-4", "ChatGPT Plus", "API services", "Enterprise solutions"],
    culturalSignificance: "Democratized access to advanced AI capabilities"
  }
};

/**
 * Analyzes company mentions and provides comprehensive intelligence
 */
export function getCompanyIntelligence(companyName: string): CompanyProfile | null {
  const normalizedName = companyName.toLowerCase().trim();
  
  // Direct match
  if (COMPANY_INTELLIGENCE_DB[normalizedName]) {
    return COMPANY_INTELLIGENCE_DB[normalizedName];
  }
  
  // Fuzzy matching for variations
  for (const [key, profile] of Object.entries(COMPANY_INTELLIGENCE_DB)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return profile;
    }
  }
  
  return null;
}

/**
 * Generates comprehensive company analysis for image content
 */
export function enhanceWithCompanyIntelligence(content: string, identifiedCompanies: string[]): string {
  let enhancedContent = content;
  
  for (const company of identifiedCompanies) {
    const intelligence = getCompanyIntelligence(company);
    
    if (intelligence) {
      enhancedContent += `\n\n## ${intelligence.name} - Company Intelligence\n`;
      enhancedContent += `**Founded:** ${intelligence.foundedYear}\n`;
      enhancedContent += `**Founders:** ${intelligence.founders?.join(", ")}\n`;
      enhancedContent += `**Business Model:** ${intelligence.businessModel}\n`;
      enhancedContent += `**Key Products:** ${intelligence.keyProducts.join(", ")}\n`;
      enhancedContent += `**Industry Position:** ${intelligence.industryPosition}\n`;
      if (intelligence.fundingHistory) {
        enhancedContent += `**Funding:** ${intelligence.fundingHistory}\n`;
      }
      enhancedContent += `**Market Presence:** ${intelligence.marketPresence}\n`;
      enhancedContent += `**Cultural Significance:** ${intelligence.culturalSignificance}\n`;
      
      if (intelligence.recentDevelopments.length > 0) {
        enhancedContent += `**Recent Developments:**\n`;
        intelligence.recentDevelopments.forEach(dev => {
          enhancedContent += `- ${dev}\n`;
        });
      }
    }
  }
  
  return enhancedContent;
}