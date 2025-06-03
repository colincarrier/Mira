export interface SubscriptionTier {
  name: string;
  aiRequestsPerHour: number;
  aiRequestsPerDay: number;
  maxNotesStored: number;
  maxAudioMinutesPerMonth: number;
  collaborativeNotes: boolean;
  priorityProcessing: boolean;
  advancedAIFeatures: boolean;
  customCollections: boolean;
  exportFeatures: boolean;
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  free: {
    name: "Free",
    aiRequestsPerHour: 5,
    aiRequestsPerDay: 20,
    maxNotesStored: 100,
    maxAudioMinutesPerMonth: 10,
    collaborativeNotes: false,
    priorityProcessing: false,
    advancedAIFeatures: false,
    customCollections: false,
    exportFeatures: false,
  },
  pro: {
    name: "Pro",
    aiRequestsPerHour: 50,
    aiRequestsPerDay: 200,
    maxNotesStored: 5000,
    maxAudioMinutesPerMonth: 120,
    collaborativeNotes: true,
    priorityProcessing: true,
    advancedAIFeatures: true,
    customCollections: true,
    exportFeatures: true,
  },
  enterprise: {
    name: "Enterprise",
    aiRequestsPerHour: -1, // unlimited
    aiRequestsPerDay: -1, // unlimited
    maxNotesStored: -1, // unlimited
    maxAudioMinutesPerMonth: -1, // unlimited
    collaborativeNotes: true,
    priorityProcessing: true,
    advancedAIFeatures: true,
    customCollections: true,
    exportFeatures: true,
  },
  developer: {
    name: "Developer",
    aiRequestsPerHour: -1, // unlimited
    aiRequestsPerDay: -1, // unlimited
    maxNotesStored: -1, // unlimited
    maxAudioMinutesPerMonth: -1, // unlimited
    collaborativeNotes: true,
    priorityProcessing: true,
    advancedAIFeatures: true,
    customCollections: true,
    exportFeatures: true,
  }
};

export function getUserTier(userId: string | null): SubscriptionTier {
  // Developer accounts (you can add specific user IDs here)
  const devAccounts = [
    process.env.DEV_USER_ID, // Your dev account
    "dev", // Generic dev identifier
  ];
  
  if (userId && devAccounts.includes(userId)) {
    return SUBSCRIPTION_TIERS.developer;
  }
  
  // TODO: Look up user's actual subscription tier from database
  // For now, return free tier for all users
  return SUBSCRIPTION_TIERS.free;
}

export function checkAIRequestLimit(tier: SubscriptionTier, hourlyCount: number, dailyCount: number): boolean {
  if (tier.aiRequestsPerHour === -1) return true; // unlimited
  if (hourlyCount >= tier.aiRequestsPerHour) return false;
  if (dailyCount >= tier.aiRequestsPerDay) return false;
  return true;
}