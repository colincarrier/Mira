/**
 * Intelligence-V2 Feature Flag System
 * Controls rollout of new recursive reasoning capabilities
 */

export interface FeatureFlags {
  INTELLIGENCE_V2_ENABLED: boolean;
  VECTOR_SEARCH_ENABLED: boolean;
  RECURSIVE_REASONING_ENABLED: boolean;
  RELATIONSHIP_MAPPING_ENABLED: boolean;
  PROACTIVE_DELIVERY_ENABLED: boolean;
  ENHANCED_COLLECTIONS_ENABLED: boolean;
  ADVANCED_NOTIFICATIONS_ENABLED: boolean;
}

export class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  private flags: FeatureFlags;

  private constructor() {
    this.flags = this.loadFeatureFlags();
    console.log('🚩 Feature Flags initialized:', this.flags);
  }

  public static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  private loadFeatureFlags(): FeatureFlags {
    return {
      INTELLIGENCE_V2_ENABLED: process.env.FEATURE_INTELLIGENCE_V2 === 'true',
      VECTOR_SEARCH_ENABLED: process.env.FEATURE_VECTOR_SEARCH === 'true' || process.env.FEATURE_INTELLIGENCE_V2 === 'true',
      RECURSIVE_REASONING_ENABLED: process.env.FEATURE_RECURSIVE_REASONING === 'true' || process.env.FEATURE_INTELLIGENCE_V2 === 'true',
      RELATIONSHIP_MAPPING_ENABLED: process.env.FEATURE_RELATIONSHIP_MAPPING === 'true' || process.env.FEATURE_INTELLIGENCE_V2 === 'true',
      PROACTIVE_DELIVERY_ENABLED: process.env.FEATURE_PROACTIVE_DELIVERY === 'true' || process.env.FEATURE_INTELLIGENCE_V2 === 'true',
      ENHANCED_COLLECTIONS_ENABLED: process.env.FEATURE_ENHANCED_COLLECTIONS === 'true' || process.env.FEATURE_INTELLIGENCE_V2 === 'true',
      ADVANCED_NOTIFICATIONS_ENABLED: process.env.FEATURE_ADVANCED_NOTIFICATIONS === 'true' || process.env.FEATURE_INTELLIGENCE_V2 === 'true'
    };
  }

  public isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag] || false;
  }

  public getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  public refreshFlags(): void {
    this.flags = this.loadFeatureFlags();
  }

  public logFlagStatus(): void {
    console.log('🚩 Feature Flags Status:');
    Object.entries(this.flags).forEach(([flag, enabled]) => {
      console.log(`  ${flag}: ${enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
    });
  }
}