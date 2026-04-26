import { Skill, CareerPath, ICareerPath, ISkill } from '../models';
import { runPythonAiTask } from './pythonAiBridge';

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

interface SerializedSkill {
  name: string;
  category: string;
  demandLevel: 'high' | 'medium' | 'low';
  relatedSkills: string[];
}

interface SerializedCareerPath {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  requiredSkills: string[];
  optionalSkills: string[];
  averageSalary: {
    min: number;
    max: number;
    currency: string;
  };
  demandLevel: 'high' | 'medium' | 'low';
  growthOutlook: string;
}

interface PythonCareerMatch extends Omit<CareerMatch, 'careerPath'> {
  careerPathId: string;
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

const serializeSkill = (skill: ISkill): SerializedSkill => ({
  name: normalize(skill.name),
  category: skill.category,
  demandLevel: skill.demandLevel,
  relatedSkills: (skill.relatedSkills || []).map(normalize),
});

const serializeCareer = (career: ICareerPath): SerializedCareerPath => ({
  _id: career._id.toString(),
  title: career.title,
  slug: career.slug,
  description: career.description,
  category: career.category,
  requiredSkills: career.requiredSkills.map(normalize),
  optionalSkills: career.optionalSkills.map(normalize),
  averageSalary: career.averageSalary,
  demandLevel: career.demandLevel,
  growthOutlook: career.growthOutlook,
});

// ────────────────────────────────────────────────────────────────
// Skill Gap Analysis
// ────────────────────────────────────────────────────────────────

export const analyzeSkillGap = async (
  userSkills: string[],
  careerPathId?: string
): Promise<SkillGapResult> => {
  const normalizedUserSkills = userSkills.map(normalize);
  const [allSkillDocs, allCareers] = await Promise.all([
    Skill.find(),
    CareerPath.find(),
  ]);

  return runPythonAiTask<SkillGapResult>('analyze_skill_gap', {
    userSkills: normalizedUserSkills,
    careerPathId,
    careers: allCareers.map(serializeCareer),
    skills: allSkillDocs.map(serializeSkill),
  });
};

// ────────────────────────────────────────────────────────────────
// Career Recommendation Engine (Python NLP + Text Similarity)
// ────────────────────────────────────────────────────────────────

export const recommendCareers = async (
  userSkills: string[]
): Promise<CareerMatch[]> => {
  const normalizedSkills = userSkills.map(normalize);
  const [allCareers, allSkillDocs] = await Promise.all([
    CareerPath.find(),
    Skill.find(),
  ]);

  const pythonMatches = await runPythonAiTask<PythonCareerMatch[]>('recommend_careers', {
    userSkills: normalizedSkills,
    careers: allCareers.map(serializeCareer),
    skills: allSkillDocs.map(serializeSkill),
  });

  const careersById = new Map(allCareers.map((career) => [career._id.toString(), career]));

  return pythonMatches.flatMap((match) => {
    const careerPath = careersById.get(match.careerPathId);
    if (!careerPath) {
      return [];
    }

    const { careerPathId: _careerPathId, ...rest } = match;

    return [{
      ...rest,
      careerPath,
    }];
  });
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
