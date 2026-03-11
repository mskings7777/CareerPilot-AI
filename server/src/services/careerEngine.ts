import { Skill, CareerPath, ICareerPath, ISkill } from '../models';

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export interface SkillWeight {
  skill: string;
  tfidf: number;
  category: string;
  demandLevel: 'high' | 'medium' | 'low';
  proficiency: 'beginner' | 'intermediate' | 'advanced';
}

export interface SkillGapResult {
  currentSkills: string[];
  requiredSkills: string[];
  matchedSkills: SkillWeight[];
  missingSkills: SkillWeight[];
  matchScore: number;
  gapPercentage: number;
  categoryBreakdown: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  matched: number;
  missing: string[];
  proficiencyDistribution: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
}

export interface ExplainableFactor {
  factor: string;
  score: number;
  maxScore: number;
  weight: number;
  description: string;
}

export interface CareerMatch {
  careerPath: ICareerPath;
  matchScore: number;
  skillFitScore: number;
  demandScore: number;
  growthScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string;
  factors: ExplainableFactor[];
  cosineSimilarity: number;
}

export interface PersonalizedRoadmapPhase {
  phase: number;
  title: string;
  stage: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  skillsToLearn: string[];
  skillsAlreadyKnown: string[];
  estimatedWeeks: number;
  resources: {
    title: string;
    url: string;
    type: string;
    provider: string;
    isFree: boolean;
  }[];
}

export interface PersonalizedRoadmap {
  careerPathId: string;
  careerTitle: string;
  totalWeeks: number;
  totalSkillsToLearn: number;
  totalSkillsKnown: number;
  completionPercentage: number;
  phases: PersonalizedRoadmapPhase[];
}

// ────────────────────────────────────────────────────────────────
// Skill Matching (exact / word-boundary, no loose substring)
// ────────────────────────────────────────────────────────────────

const normalize = (s: string): string => s.toLowerCase().trim();

/**
 * Returns true when two skill strings refer to the same skill.
 * Uses exact match, then falls back to multi-word token containment
 * with word-boundary checks so that "go" won't match "mongo".
 */
const skillsMatch = (a: string, b: string): boolean => {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;

  // Common aliases / normalizations
  const aliases: Record<string, string[]> = {
    'node.js': ['nodejs', 'node'],
    'next.js': ['nextjs', 'next'],
    'react native': ['react-native'],
    'vue': ['vue.js', 'vuejs'],
    'c++': ['cpp'],
    'c#': ['csharp', 'c-sharp'],
    'ci/cd': ['cicd', 'ci cd'],
    'spring boot': ['springboot', 'spring-boot'],
    'scikit-learn': ['sklearn', 'scikit learn'],
    'power bi': ['powerbi', 'power-bi'],
    'google cloud': ['gcp', 'google-cloud'],
  };

  for (const [canonical, alts] of Object.entries(aliases)) {
    const group = [canonical, ...alts];
    if (group.includes(na) && group.includes(nb)) return true;
  }

  return false;
};

const userHasSkill = (userSkills: string[], target: string): boolean =>
  userSkills.some((us) => skillsMatch(us, target));

// ────────────────────────────────────────────────────────────────
// TF-IDF Computation
// ────────────────────────────────────────────────────────────────

/**
 * Builds TF-IDF weights for a set of skills given the full corpus
 * of career paths (as "documents"). Each career path's combined
 * required+optional skills list forms one document.
 *
 * TF(skill, doc) = occurrences of skill in doc / total skills in doc
 * IDF(skill)     = log(N / df) where df = # docs containing skill
 *
 * Because skills are unique per career, TF simplifies to 1/|doc|
 * for present skills and 0 for absent skills.
 */
const buildTfidfVectors = (
  allCareers: ICareerPath[],
  skillUniverse: string[]
): { vectors: Map<string, number[]>; idfMap: Map<string, number> } => {
  const N = allCareers.length;

  // Document frequency: how many careers list each skill
  const df = new Map<string, number>();
  for (const skill of skillUniverse) {
    let count = 0;
    for (const career of allCareers) {
      const careerSkills = [
        ...career.requiredSkills,
        ...career.optionalSkills,
      ].map(normalize);
      if (careerSkills.some((cs) => skillsMatch(cs, skill))) {
        count++;
      }
    }
    df.set(skill, count);
  }

  // IDF: log(N / df). If df=0, idf=0 (skill not in any career)
  const idfMap = new Map<string, number>();
  for (const skill of skillUniverse) {
    const docFreq = df.get(skill) || 0;
    idfMap.set(skill, docFreq > 0 ? Math.log(N / docFreq) : 0);
  }

  // Build TF-IDF vector per career
  const vectors = new Map<string, number[]>();
  for (const career of allCareers) {
    const careerSkills = [
      ...career.requiredSkills,
      ...career.optionalSkills,
    ].map(normalize);
    const docLen = careerSkills.length || 1;

    const vec: number[] = skillUniverse.map((skill) => {
      const present = careerSkills.some((cs) => skillsMatch(cs, skill));
      if (!present) return 0;

      // Required skills get 2x TF boost
      const isRequired = career.requiredSkills
        .map(normalize)
        .some((rs) => skillsMatch(rs, skill));
      const tf = (isRequired ? 2 : 1) / docLen;
      const idf = idfMap.get(skill) || 0;
      return tf * idf;
    });
    vectors.set(career._id.toString(), vec);
  }

  return { vectors, idfMap };
};

/**
 * Creates a TF-IDF vector for the user's skill set using the same
 * IDF values computed from the career corpus.
 */
const buildUserVector = (
  userSkills: string[],
  skillUniverse: string[],
  idfMap: Map<string, number>
): number[] => {
  const docLen = userSkills.length || 1;
  return skillUniverse.map((skill) => {
    const present = userHasSkill(userSkills, skill);
    if (!present) return 0;
    const tf = 1 / docLen;
    const idf = idfMap.get(skill) || 0;
    return tf * idf;
  });
};

// ────────────────────────────────────────────────────────────────
// Cosine Similarity
// ────────────────────────────────────────────────────────────────

const cosineSimilarity = (a: number[], b: number[]): number => {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
};

// ────────────────────────────────────────────────────────────────
// Skill Proficiency Estimation
// ────────────────────────────────────────────────────────────────

/**
 * Heuristic: if the user has many related skills in the same category
 * they're likely more advanced. This is an estimate — a real system
 * would use self-assessment or quiz data.
 */
const estimateProficiency = (
  skill: string,
  userSkills: string[],
  skillDb: ISkill[]
): 'beginner' | 'intermediate' | 'advanced' => {
  const skillDoc = skillDb.find((s) => skillsMatch(s.name, skill));
  if (!skillDoc) return 'beginner';

  const relatedOwned = (skillDoc.relatedSkills || []).filter((rs) =>
    userHasSkill(userSkills, rs)
  ).length;

  const totalRelated = skillDoc.relatedSkills?.length || 0;
  if (totalRelated === 0) return 'intermediate';

  const ratio = relatedOwned / totalRelated;
  if (ratio >= 0.6) return 'advanced';
  if (ratio >= 0.3) return 'intermediate';
  return 'beginner';
};

// ────────────────────────────────────────────────────────────────
// Skill Gap Analysis
// ────────────────────────────────────────────────────────────────

export const analyzeSkillGap = async (
  userSkills: string[],
  careerPathId?: string
): Promise<SkillGapResult> => {
  const normalizedUserSkills = userSkills.map(normalize);
  const allSkillDocs = await Skill.find();

  let requiredSkillNames: string[] = [];
  if (careerPathId) {
    const careerPath = await CareerPath.findById(careerPathId);
    if (careerPath) {
      requiredSkillNames = [
        ...careerPath.requiredSkills.map(normalize),
        ...careerPath.optionalSkills.map(normalize),
      ];
    }
  } else {
    const highDemandSkills = await Skill.find({ demandLevel: 'high' });
    requiredSkillNames = highDemandSkills.map((s) => normalize(s.name));
  }

  // Deduplicate required skills
  requiredSkillNames = [...new Set(requiredSkillNames)];

  // Compute IDF from all careers for weighting
  const allCareers = await CareerPath.find();
  const skillUniverse = [...new Set([
    ...requiredSkillNames,
    ...allSkillDocs.map((s) => normalize(s.name)),
  ])];
  const { idfMap } = buildTfidfVectors(allCareers, skillUniverse);

  const matched: SkillWeight[] = [];
  const missing: SkillWeight[] = [];

  for (const reqSkill of requiredSkillNames) {
    const skillDoc = allSkillDocs.find((s) => skillsMatch(s.name, reqSkill));
    const tfidf = idfMap.get(reqSkill) || 0;
    const category = skillDoc?.category || 'other';
    const demandLevel = skillDoc?.demandLevel || 'medium';

    if (userHasSkill(normalizedUserSkills, reqSkill)) {
      matched.push({
        skill: reqSkill,
        tfidf,
        category,
        demandLevel,
        proficiency: estimateProficiency(reqSkill, normalizedUserSkills, allSkillDocs),
      });
    } else {
      missing.push({
        skill: reqSkill,
        tfidf,
        category,
        demandLevel,
        proficiency: 'beginner', // user doesn't have it
      });
    }
  }

  // Match score: weighted by TF-IDF
  const totalWeight = [...matched, ...missing].reduce((sum, s) => sum + s.tfidf, 0);
  const matchedWeight = matched.reduce((sum, s) => sum + s.tfidf, 0);
  const matchScore = totalWeight > 0
    ? Math.round((matchedWeight / totalWeight) * 100)
    : requiredSkillNames.length === 0 ? 100 : 0;

  // Simple gap percentage (unweighted for intuitive display)
  const gapPercentage = requiredSkillNames.length > 0
    ? Math.round((missing.length / requiredSkillNames.length) * 100)
    : 0;

  // Category breakdown
  const categoryMap = new Map<string, CategoryBreakdown>();
  for (const sw of [...matched, ...missing]) {
    if (!categoryMap.has(sw.category)) {
      categoryMap.set(sw.category, {
        category: sw.category,
        total: 0,
        matched: 0,
        missing: [],
        proficiencyDistribution: { beginner: 0, intermediate: 0, advanced: 0 },
      });
    }
    const entry = categoryMap.get(sw.category)!;
    entry.total++;

    const isMatched = matched.some((m) => m.skill === sw.skill);
    if (isMatched) {
      entry.matched++;
      entry.proficiencyDistribution[sw.proficiency]++;
    } else {
      entry.missing.push(sw.skill);
    }
  }

  return {
    currentSkills: normalizedUserSkills,
    requiredSkills: requiredSkillNames,
    matchedSkills: matched,
    missingSkills: missing,
    matchScore,
    gapPercentage,
    categoryBreakdown: Array.from(categoryMap.values()),
  };
};

// ────────────────────────────────────────────────────────────────
// Career Recommendation Engine (TF-IDF + Cosine Similarity)
// ────────────────────────────────────────────────────────────────

// Factor weights for final composite score
const FACTOR_WEIGHTS = {
  skillFit: 0.60,   // 60% — cosine similarity of TF-IDF vectors
  demand: 0.20,     // 20% — market demand
  growth: 0.20,     // 20% — growth outlook keywords
};

const demandScoreMap: Record<string, number> = {
  high: 100,
  medium: 60,
  low: 30,
};

const estimateGrowthScore = (growthOutlook: string): number => {
  const text = (growthOutlook || '').toLowerCase();
  const positiveWords = ['strong', 'excellent', 'explosive', 'rapid', 'high', 'growing', 'abundant'];
  const neutralWords = ['steady', 'consistent', 'stable', 'moderate'];
  const negativeWords = ['declining', 'shrinking', 'limited', 'low'];

  let score = 50; // baseline
  for (const w of positiveWords) if (text.includes(w)) score += 10;
  for (const w of neutralWords) if (text.includes(w)) score += 3;
  for (const w of negativeWords) if (text.includes(w)) score -= 15;
  return Math.max(0, Math.min(100, score));
};

export const recommendCareers = async (
  userSkills: string[]
): Promise<CareerMatch[]> => {
  const normalizedSkills = userSkills.map(normalize);
  const allCareers = await CareerPath.find();
  const allSkillDocs = await Skill.find();

  // Build skill universe from all skills in DB + career paths
  const skillUniverse = [
    ...new Set([
      ...allSkillDocs.map((s) => normalize(s.name)),
      ...allCareers.flatMap((c) =>
        [...c.requiredSkills, ...c.optionalSkills].map(normalize)
      ),
    ]),
  ];

  // Build TF-IDF vectors
  const { vectors, idfMap } = buildTfidfVectors(allCareers, skillUniverse);
  const userVec = buildUserVector(normalizedSkills, skillUniverse, idfMap);

  const matches: CareerMatch[] = allCareers.map((career) => {
    const careerId = career._id.toString();
    const careerVec = vectors.get(careerId) || [];

    // 1. Cosine similarity (skill fit)
    const cosine = cosineSimilarity(userVec, careerVec);
    const skillFitScore = Math.round(cosine * 100);

    // 2. Demand score (independent of skill fit)
    const demandScore = demandScoreMap[career.demandLevel] || 50;

    // 3. Growth score
    const growthScore = estimateGrowthScore(career.growthOutlook);

    // Composite weighted score
    const matchScore = Math.round(
      skillFitScore * FACTOR_WEIGHTS.skillFit +
      demandScore * FACTOR_WEIGHTS.demand +
      growthScore * FACTOR_WEIGHTS.growth
    );

    // Enumerate matched & missing skills (using proper matching)
    const allRequired = career.requiredSkills.map(normalize);
    const allCareerSkills = [
      ...new Set([...allRequired, ...career.optionalSkills.map(normalize)]),
    ];

    const matchedSkills = normalizedSkills.filter((skill) =>
      allCareerSkills.some((cs) => skillsMatch(skill, cs))
    );

    const missingSkills = allRequired.filter(
      (skill) => !userHasSkill(normalizedSkills, skill)
    );

    // Explainable factors
    const factors: ExplainableFactor[] = [
      {
        factor: 'Skill Fit',
        score: skillFitScore,
        maxScore: 100,
        weight: FACTOR_WEIGHTS.skillFit,
        description: `Your skills have ${skillFitScore}% TF-IDF cosine similarity with this career's requirements.`,
      },
      {
        factor: 'Market Demand',
        score: demandScore,
        maxScore: 100,
        weight: FACTOR_WEIGHTS.demand,
        description: `This career has ${career.demandLevel} market demand.`,
      },
      {
        factor: 'Growth Outlook',
        score: growthScore,
        maxScore: 100,
        weight: FACTOR_WEIGHTS.growth,
        description: career.growthOutlook || 'No growth data available.',
      },
    ];

    const explanation = generateExplanation(
      career,
      matchedSkills,
      missingSkills,
      matchScore,
      factors
    );

    return {
      careerPath: career,
      matchScore,
      skillFitScore,
      demandScore,
      growthScore,
      matchedSkills,
      missingSkills,
      explanation,
      factors,
      cosineSimilarity: Math.round(cosine * 1000) / 1000, // 3 decimal places
    };
  });

  // Sort by composite score, then by skill fit as tiebreaker
  return matches
    .sort((a, b) => b.matchScore - a.matchScore || b.skillFitScore - a.skillFitScore)
    .slice(0, 10);
};

// ────────────────────────────────────────────────────────────────
// Explanation Generator
// ────────────────────────────────────────────────────────────────

const generateExplanation = (
  career: ICareerPath,
  matchedSkills: string[],
  missingSkills: string[],
  matchScore: number,
  factors: ExplainableFactor[]
): string => {
  const parts: string[] = [];

  if (matchScore >= 70) {
    parts.push(
      `You are a strong match for ${career.title} with ${matchScore}% compatibility.`
    );
  } else if (matchScore >= 40) {
    parts.push(
      `You are a moderate match for ${career.title} with ${matchScore}% compatibility.`
    );
  } else {
    parts.push(
      `${career.title} could be a stretch goal with ${matchScore}% current compatibility.`
    );
  }

  if (matchedSkills.length > 0) {
    parts.push(
      `Your relevant skills include: ${matchedSkills.slice(0, 5).join(', ')}.`
    );
  }

  if (missingSkills.length > 0) {
    parts.push(
      `Key skills to develop: ${missingSkills.slice(0, 5).join(', ')}.`
    );
  }

  // Highlight strongest factor
  const strongest = factors.reduce((best, f) =>
    f.score * f.weight > best.score * best.weight ? f : best
  );
  parts.push(`Your strongest factor is ${strongest.factor} (${strongest.score}%).`);

  return parts.join(' ');
};

// ────────────────────────────────────────────────────────────────
// Personalized Roadmap Generator
// ────────────────────────────────────────────────────────────────

/**
 * Generates a personalized learning roadmap for a specific career path
 * based on the user's existing skills. Skips skills the user already has,
 * organises remaining skills into Beginner/Intermediate/Advanced stages,
 * and maps learning resources to each phase.
 */
export const generatePersonalizedRoadmap = async (
  userSkills: string[],
  careerPathId: string
): Promise<PersonalizedRoadmap> => {
  const normalizedUserSkills = userSkills.map(normalize);
  const career = await CareerPath.findById(careerPathId);
  if (!career) {
    throw new Error('Career path not found');
  }

  const allSkillDocs = await Skill.find();

  // Map resources by skill keyword for assignment to phases
  const resourcesBySkill = new Map<string, typeof career.learningResources>();
  for (const resource of career.learningResources || []) {
    // Associate resource with skills mentioned in its title
    for (const skill of [...career.requiredSkills, ...career.optionalSkills]) {
      const ns = normalize(skill);
      if (normalize(resource.title).includes(ns) || ns.includes(normalize(resource.provider))) {
        if (!resourcesBySkill.has(ns)) resourcesBySkill.set(ns, []);
        resourcesBySkill.get(ns)!.push(resource);
      }
    }
  }

  const phases: PersonalizedRoadmapPhase[] = [];
  let phaseNumber = 0;

  // Use the career's existing roadmap phases as structure
  for (const originalPhase of career.roadmap || []) {
    const skillsToLearn: string[] = [];
    const skillsAlreadyKnown: string[] = [];

    for (const skill of originalPhase.skills) {
      if (userHasSkill(normalizedUserSkills, skill)) {
        skillsAlreadyKnown.push(skill);
      } else {
        skillsToLearn.push(skill);
      }
    }

    // Skip phase entirely if user already knows all skills in it
    if (skillsToLearn.length === 0) continue;

    phaseNumber++;

    // Determine stage based on original phase ordering
    const totalPhases = career.roadmap.length;
    const originalIndex = career.roadmap.indexOf(originalPhase);
    let stage: 'Beginner' | 'Intermediate' | 'Advanced';
    if (originalIndex < totalPhases / 3) {
      stage = 'Beginner';
    } else if (originalIndex < (totalPhases * 2) / 3) {
      stage = 'Intermediate';
    } else {
      stage = 'Advanced';
    }

    // Reduce duration proportionally to skills already known
    const knownRatio = skillsAlreadyKnown.length / originalPhase.skills.length;
    const estimatedWeeks = Math.max(
      1,
      Math.round(originalPhase.durationWeeks * (1 - knownRatio * 0.7))
    );

    // Collect resources relevant to skills in this phase
    const phaseResources: PersonalizedRoadmapPhase['resources'] = [];
    const seenUrls = new Set<string>();
    for (const skill of skillsToLearn) {
      const rs = resourcesBySkill.get(normalize(skill)) || [];
      for (const r of rs) {
        if (!seenUrls.has(r.url)) {
          seenUrls.add(r.url);
          phaseResources.push({
            title: r.title,
            url: r.url,
            type: r.type,
            provider: r.provider,
            isFree: r.isFree,
          });
        }
      }
    }

    // If no skill-specific resources, include general career resources for this stage
    if (phaseResources.length === 0 && career.learningResources.length > 0) {
      // Assign one general resource per phase
      const idx = (phaseNumber - 1) % career.learningResources.length;
      const r = career.learningResources[idx];
      phaseResources.push({
        title: r.title,
        url: r.url,
        type: r.type,
        provider: r.provider,
        isFree: r.isFree,
      });
    }

    phases.push({
      phase: phaseNumber,
      title: originalPhase.title,
      stage,
      description: originalPhase.description,
      skillsToLearn,
      skillsAlreadyKnown,
      estimatedWeeks,
      resources: phaseResources,
    });
  }

  const totalSkillsInCareer = [
    ...new Set([
      ...career.requiredSkills.map(normalize),
      ...career.optionalSkills.map(normalize),
    ]),
  ];
  const knownCount = totalSkillsInCareer.filter((s) =>
    userHasSkill(normalizedUserSkills, s)
  ).length;

  return {
    careerPathId: career._id.toString(),
    careerTitle: career.title,
    totalWeeks: phases.reduce((sum, p) => sum + p.estimatedWeeks, 0),
    totalSkillsToLearn: totalSkillsInCareer.length - knownCount,
    totalSkillsKnown: knownCount,
    completionPercentage: Math.round(
      (knownCount / (totalSkillsInCareer.length || 1)) * 100
    ),
    phases,
  };
};
