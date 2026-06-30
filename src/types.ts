export interface QuestionnaireAnswers {
  skinType: string;
  concerns: string[];
  sensitivity: string;
  routineComplexity: string;
  primaryGoal: string;
  ageGroup: string;
  gender: string;
  climate: string;
}

export interface MarketProduct {
  brand: string;
  productName: string;
  howItHelps: string;
}

export interface IngredientRecommendation {
  name: string;
  reason: string;
  benefits: string;
  popularMarketProducts?: MarketProduct[];
}

export interface RoutineStep {
  step: number;
  category: string;
  productName: string;
  keyIngredients: string[];
  howToUse: string;
  whyItWorks: string;
}

export interface AnalysisResult {
  skinTypeFromAI: string;
  visualObservations: string;
  primaryConcernsIdentified: string[];
  ingredientRecommendations: IngredientRecommendation[];
  routine: {
    morning: RoutineStep[];
    night: RoutineStep[];
  };
  lifestyleTips: string[];
}
