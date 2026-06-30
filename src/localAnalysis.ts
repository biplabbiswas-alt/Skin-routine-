import { QuestionnaireAnswers, AnalysisResult, RoutineStep, IngredientRecommendation } from './types';

export function generateLocalAnalysis(answers: QuestionnaireAnswers): AnalysisResult {
  const { skinType, concerns, sensitivity, routineComplexity, primaryGoal, climate, ageGroup } = answers;

  // 1. Determine Skin Type Summary
  let skinTypeFromAI = `${skinType} Skin Profile`;
  if (climate === 'Hot & Humid' && skinType === 'Combination') {
    skinTypeFromAI = 'Humid-Induced Combination Skin (Active T-Zone)';
  } else if (climate === 'Cold & Dry' && skinType === 'Dry') {
    skinTypeFromAI = 'Winter-Dehydrated Xerotic Skin';
  } else if (sensitivity !== 'Normal') {
    skinTypeFromAI = `${sensitivity} & Delicate ${skinType} Skin`;
  }

  // 2. Draft Visual Observations
  let visualObservations = '';
  const sensitivityNotice = sensitivity !== 'Normal' ? 'Mild surface erythema (redness) is observed around the nasal folds and cheeks, indicating a compromised moisture barrier. ' : '';
  
  switch (skinType) {
    case 'Oily':
      visualObservations = `${sensitivityNotice}Subtle lipid sheen detected across the forehead, nose, and chin (T-zone). Dilated follicular openings (pores) are visible, with minor cellular debris accumulation. Surface texture appears thick but resilient.`;
      break;
    case 'Dry':
      visualObservations = `${sensitivityNotice}Fine, superficial desquamation (flaking) observed around the mouth and lower cheeks. Surface lipid level is low, leading to diminished light reflectance (dullness). Elasticity markers indicate high absorption potential.`;
      break;
    case 'Combination':
      visualObservations = `${sensitivityNotice}Bimodal distribution of lipid secretion: active sebaceous activity in the T-zone contrasted with superficial dryness along the U-zone (cheeks and jawline). Minor pore congestion identified along the nasal bridge.`;
      break;
    default:
      visualObservations = `${sensitivityNotice}Balanced epidermal lipid and moisture levels. Surface integrity is high with minimal cellular stress markers. Textural reflectance is uniform across all facial zones.`;
  }

  // 3. Primary Concerns Identified
  const primaryConcernsIdentified = concerns.length > 0 ? [...concerns] : ['General Skin Maintenance', 'Preventative Care'];

  // 4. Ingredient Recommendations & Market Products
  const ingredientPool: { [key: string]: IngredientRecommendation } = {
    'Salicylic Acid': {
      name: 'Salicylic Acid (BHA)',
      benefits: 'Clears pore congestion & controls lipid levels',
      reason: 'This oil-soluble Beta Hydroxy Acid penetrates deeply into sebaceous pathways, liquefying trapped lipids and exfoliating dead follicular lining to prevent ongoing blemish formulation.',
      popularMarketProducts: [
        { brand: 'The Ordinary', productName: 'Salicylic Acid 2% Solution', howItHelps: 'Exfoliator used to target blemish-prone skin.' },
        { brand: "Paula's Choice", productName: 'Skin Perfecting 2% BHA Liquid Exfoliant', howItHelps: 'Global cult-favorite for shrinking pores and smoothing skin texture.' }
      ]
    },
    'Hyaluronic Acid': {
      name: 'Hyaluronic Acid & Panthenol',
      benefits: 'Provides deep humectant-based moisture lock',
      reason: 'These molecules act as powerful moisture magnets, drawing hydration into the extracellular matrix without adding heavy lipids, making them perfect for plumping dehydrated skin.',
      popularMarketProducts: [
        { brand: 'La Roche-Posay', productName: 'Hyalu B5 Pure Hyaluronic Acid Serum', howItHelps: 'Intense re-plumping serum to alleviate surface tightness.' },
        { brand: 'The Inkey List', productName: 'Hyaluronic Acid Serum', howItHelps: 'Simple, lightweight hydrator suitable for daily layering.' }
      ]
    },
    'Niacinamide': {
      name: 'Niacinamide (Vitamin B3)',
      benefits: 'Calms redness & balances sebum production',
      reason: 'A highly bio-compatible antioxidant that reduces environmental stress, decreases melanosome transfer to lighten dark spots, and fortifies the lipid barrier by stimulating ceramide synthesis.',
      popularMarketProducts: [
        { brand: 'The Ordinary', productName: 'Niacinamide 10% + Zinc 1%', howItHelps: 'Highly popular serum to regulate oil flow and clarify surface congestion.' },
        { brand: 'La Roche-Posay', productName: '10% Niacinamide Serum', howItHelps: 'Dermatologist-tested formulation perfect for sensitive skin tones.' }
      ]
    },
    'Ceramides': {
      name: 'Ceramides NP, AP, EOP',
      benefits: 'Fortifies cellular lipid cement to reduce sensitivity',
      reason: 'These naturally occurring intercellular lipids repair intercellular gaps in the stratum corneum, effectively locking in moisture and preventing harmful irritants from triggering sensitivity.',
      popularMarketProducts: [
        { brand: 'CeraVe', productName: 'Daily Moisturizing Lotion', howItHelps: 'Uses MVE technology to deliver three essential ceramides throughout the day.' },
        { brand: 'COSRX', productName: 'Balancium Comfort Ceramide Cream', howItHelps: 'Soothing barrier cream that calms irritation.' }
      ]
    },
    'Retinol': {
      name: 'Encapsulated Retinol (Vitamin A)',
      benefits: 'Accelerates cellular turnover & boosts collagen',
      reason: 'Retinol triggers receptor pathways in the dermis to speed up epidermal shedding, replacing congested or pigment-heavy cells with fresh, luminous tissue while reducing fine lines.',
      popularMarketProducts: [
        { brand: 'The Ordinary', productName: 'Retinol 0.5% in Squalane', howItHelps: 'Moderate-strength retinol targets signs of aging and texturing.' },
        { brand: 'CeraVe', productName: 'Resurfacing Retinol Serum', howItHelps: 'Encapsulated retinol formulated to fade post-acne marks and refine pores.' }
      ]
    },
    'Vitamin C': {
      name: 'L-Ascorbic Acid (Vitamin C)',
      benefits: 'Neutralizes free radicals & brightens pigmentation',
      reason: 'This powerful antioxidant suppresses tyrosinase (the enzyme responsible for melanin/dark spot production) and photoprotects against UV damage, leaving the skin glowing and uniform.',
      popularMarketProducts: [
        { brand: 'The Ordinary', productName: 'Ascorbyl Glucoside Solution 12%', howItHelps: 'Stable, gentle Vitamin C derivative that brightens and hydrates.' },
        { brand: 'Paula\'s Choice', productName: 'C15 Super Booster', howItHelps: '15% pure Vitamin C with Ferulic Acid to drastically improve uneven skin tone.' }
      ]
    },
    'Centella Asiatica': {
      name: 'Centella Asiatica (Cica)',
      benefits: 'Soothes inflammation & speeds up cellular healing',
      reason: 'Rich in active compounds like madecassoside, Centella has exceptional restorative properties that calm active rosacea, acne redness, and compromised skin barrier structures.',
      popularMarketProducts: [
        { brand: 'COSRX', productName: 'Centella Blemish Cream', howItHelps: 'Spot-treatment cream that reduces red and painful acne spots.' },
        { brand: 'La Roche-Posay', productName: 'Cicaplast Baume B5+', howItHelps: 'Multi-purpose soothing balm that heals irritated, dry, or red skin.' }
      ]
    }
  };

  // Select recommended ingredients based on concerns and skin type
  const selectedIngredients: IngredientRecommendation[] = [];
  
  if (concerns.includes('Acne/Blemishes') || concerns.includes('Clogged Pores') || skinType === 'Oily') {
    selectedIngredients.push(ingredientPool['Salicylic Acid']);
    selectedIngredients.push(ingredientPool['Niacinamide']);
  }
  if (concerns.includes('Dryness/Dehydration') || skinType === 'Dry' || climate === 'Cold & Dry') {
    selectedIngredients.push(ingredientPool['Hyaluronic Acid']);
    selectedIngredients.push(ingredientPool['Ceramides']);
  }
  if (concerns.includes('Fine Lines/Aging') || concerns.includes('Loss of Elasticity')) {
    selectedIngredients.push(ingredientPool['Retinol']);
    selectedIngredients.push(ingredientPool['Ceramides']);
  }
  if (concerns.includes('Hyperpigmentation') || concerns.includes('Uneven Texture') || primaryGoal === 'Healthy Radiance') {
    if (!selectedIngredients.some(i => i.name.includes('Vitamin C'))) {
      selectedIngredients.push(ingredientPool['Vitamin C']);
    }
    if (!selectedIngredients.some(i => i.name.includes('Niacinamide'))) {
      selectedIngredients.push(ingredientPool['Niacinamide']);
    }
  }
  if (concerns.includes('Redness/Rosacea') || sensitivity !== 'Normal') {
    selectedIngredients.push(ingredientPool['Centella Asiatica']);
    if (!selectedIngredients.some(i => i.name.includes('Ceramides'))) {
      selectedIngredients.push(ingredientPool['Ceramides']);
    }
  }

  // Fallback if empty
  if (selectedIngredients.length === 0) {
    selectedIngredients.push(ingredientPool['Niacinamide']);
    selectedIngredients.push(ingredientPool['Hyaluronic Acid']);
  }

  // Ensure unique elements in recommended ingredients array
  const ingredientRecommendations = Array.from(new Set(selectedIngredients));

  // 5. Formulate Morning Routine
  const morning: RoutineStep[] = [
    {
      step: 1,
      category: 'Cleanser',
      productName: skinType === 'Oily' || skinType === 'Combination' ? 'Clarifying Gel Cleanser' : 'Hydrating Cream Cleanser',
      keyIngredients: skinType === 'Oily' || skinType === 'Combination' ? ['Salicylic Acid', 'Zinc PCA'] : ['Panthenol', 'Glycerin'],
      howToUse: 'Apply a nickel-sized amount to damp skin. Massage gently in circular motions for 60 seconds, focusing on the T-zone, then rinse with lukewarm water.',
      whyItWorks: skinType === 'Oily' || skinType === 'Combination' 
        ? 'Removes excess overnight sebum and clears pore pathways without stripping vital lipids.' 
        : 'Cleanses impurities while maintaining delicate water levels to prevent tight surface tension.'
    }
  ];

  let nextStepMo = 2;

  // Add Treatment Step if detailed routine
  if (routineComplexity === 'Detailed') {
    if (concerns.includes('Hyperpigmentation') || primaryGoal === 'Healthy Radiance') {
      morning.push({
        step: nextStepMo++,
        category: 'Treatment Serum',
        productName: 'Brightening 10% Vitamin C Serum',
        keyIngredients: ['L-Ascorbic Acid', 'Ferulic Acid'],
        howToUse: 'Smooth 3-4 drops over the entire face, neck, and chest area. Allow to fully absorb for 2 minutes before moisturizing.',
        whyItWorks: 'Directly neutralizes environmental oxidizers throughout the day, lightens dark pigmentation spots, and synergizes with your sunscreen.'
      });
    } else {
      morning.push({
        step: nextStepMo++,
        category: 'Hydration Essence',
        productName: 'Soothing B5 Hydration Drops',
        keyIngredients: ['Hyaluronic Acid', 'Panthenol'],
        howToUse: 'Press 2-3 drops gently into damp skin immediately following your cleanser to maximize water uptake.',
        whyItWorks: 'Acts as a molecular sponge, quenching dry cells, smoothing fine lines, and maintaining plump moisture fields.'
      });
    }
  }

  morning.push({
    step: nextStepMo++,
    category: 'Moisturizer',
    productName: skinType === 'Oily' ? 'Ultra-Lightweight Oil-Free Water Cream' : 'Intense Barrier Shield Gel-Cream',
    keyIngredients: skinType === 'Oily' ? ['Squalane', 'Niacinamide'] : ['Ceramides', 'Centella'],
    howToUse: 'Apply evenly across the face. For combination skin, apply more heavily to cheeks and lightly over the T-zone.',
    whyItWorks: 'Provides crucial hydration locking without occluding pores, keeping the epidermal moisture barrier cohesive.'
  });

  morning.push({
    step: nextStepMo++,
    category: 'Photoprotection',
    productName: 'Broad Spectrum SPF 50+ Fluid',
    keyIngredients: ['Zinc Oxide', 'Niacinamide'],
    howToUse: 'Apply generously (two-finger length) as the final step of your morning routine, 15 minutes before any outdoor activity.',
    whyItWorks: 'Prevents UV-induced collagen degradation, hyperpigmentation darkening, and environmental photo-aging.'
  });


  // 6. Formulate Evening Routine
  const night: RoutineStep[] = [
    {
      step: 1,
      category: 'Cleanser',
      productName: 'Gentle pH-Balanced Micellar Wash',
      keyIngredients: ['Allantoin', 'Chamomile Extract'],
      howToUse: 'Massage over dry or damp skin to emulsify sunscreen, makeup, and accumulated atmospheric micro-dust, then rinse thoroughly.',
      whyItWorks: 'Cleanses deeply but delicately, preparing the cellular pathways to receive active nocturnal treatments.'
    }
  ];

  let nextStepNi = 2;

  // Active Treatment Step
  if (concerns.includes('Acne/Blemishes') || concerns.includes('Clogged Pores')) {
    night.push({
      step: nextStepNi++,
      category: 'Treatment Exfoliator',
      productName: 'Clarifying 2% BHA Toner Liquid',
      keyIngredients: ['Salicylic Acid', 'Green Tea Extract'],
      howToUse: 'Saturate a cotton pad or pat directly with bare hands onto clean, dry skin. Use 3 nights a week initially.',
      whyItWorks: 'Exfoliates intracellular debris inside the pore wall to alleviate active blemishes and minimize visual pore size.'
    });
  } else if (concerns.includes('Fine Lines/Aging') || concerns.includes('Loss of Elasticity') || ageGroup !== 'Teen') {
    night.push({
      step: nextStepNi++,
      category: 'Nocturnal Retinoid',
      productName: 'Barrier-Supported 0.3% Retinol Serum',
      keyIngredients: ['Encapsulated Retinol', 'Ceramides'],
      howToUse: 'Apply a pea-sized amount onto completely dry skin at night. Follow with moisturizer. Introduce gradually.',
      whyItWorks: 'Instructs deep skin layers to accelerate cellular regeneration, smoothing texture and stimulating supportive collagen.'
    });
  } else if (concerns.includes('Redness/Rosacea') || sensitivity !== 'Normal') {
    night.push({
      step: nextStepNi++,
      category: 'Restorative Concentrate',
      productName: 'Soothing Centella & Oat Concentrate',
      keyIngredients: ['Cica (Centella)', 'Colloidal Oat'],
      howToUse: 'Apply 3 drops to areas experiencing active redness or irritation, tapping lightly until absorbed.',
      whyItWorks: 'Instantly quietens cellular distress signals, repairs dry patches, and reduces flushing/sensitivity.'
    });
  }

  // Double moisture locking at night
  night.push({
    step: nextStepNi++,
    category: 'Nocturnal Moisturizer',
    productName: skinType === 'Oily' ? 'Balancing Ceramide Lotion' : 'Deep Restore Overnight Ceramide Balm',
    keyIngredients: ['Ceramides AP/NP', 'Hyaluronic Acid'],
    howToUse: 'Warm a dime-sized amount between clean fingertips and press gently into the face and neck area.',
    whyItWorks: 'Works during the skin\'s high-rate nocturnal repair cycle to rebuild lipid structure and prevent trans-epidermal water loss.'
  });

  // 7. Lifestyle Tips
  const lifestyleTips = [
    'Wash your face with lukewarm water only—hot water strips away vital barrier lipids and induces instant dryness.',
    'Sanitize your mobile screen and pillowcases weekly to minimize bacterial contact on your cheeks and jawline.',
    'Always apply your hydration serums onto slightly damp skin to trap maximum atmospheric moisture into the stratum corneum.',
    climate === 'Hot & Humid' 
      ? 'In humid climates, keep your skincare lighter with gel-creams to prevent sebum clogging.'
      : 'In dry or cold climates, consider a home humidifier to prevent overnight surface dehydration.'
  ];

  return {
    skinTypeFromAI,
    visualObservations,
    primaryConcernsIdentified,
    ingredientRecommendations,
    routine: {
      morning,
      night
    },
    lifestyleTips
  };
}
