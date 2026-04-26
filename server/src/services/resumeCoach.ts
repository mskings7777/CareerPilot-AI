import type { IResume } from '../models';
import { recommendCareers } from './careerEngine';
import type { CareerMatch } from './careerEngine';

export interface ResumeTargetRole {
  careerPathId: string;
  title: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface ResumeImprovementSuggestion {
  area: 'summary' | 'experience' | 'projects' | 'skills' | 'keywords';
  priority: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  action: string;
}

export interface ResumeProjectSuggestion {
  title: string;
  targetCareer: string;
  summary: string;
  skillsToPractice: string[];
  deliverables: string[];
  whyItHelps: string;
  resumeBullet: string;
}

export interface ResumeCoachReport {
  targetRoles: ResumeTargetRole[];
  focusSkills: string[];
  improvementSuggestions: ResumeImprovementSuggestion[];
  projectSuggestions: ResumeProjectSuggestion[];
}

const normalize = (value: string): string => value.toLowerCase().trim();

const unique = (values: string[]): string[] => {
  const seen = new Set<string>();

  return values.filter((value) => {
    const normalizedValue = normalize(value);
    if (!normalizedValue || seen.has(normalizedValue)) {
      return false;
    }

    seen.add(normalizedValue);
    return true;
  });
};

const toSentence = (values: string[]): string => {
  if (values.length === 0) return '';
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;

  return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`;
};

const buildFocusSkills = (matches: CareerMatch[]): string[] => {
  const counts = new Map<string, number>();

  matches.forEach((match, index) => {
    const weight = Math.max(1, matches.length - index);

    match.missingSkills.slice(0, 6).forEach((skill) => {
      const key = normalize(skill);
      counts.set(key, (counts.get(key) || 0) + weight);
    });
  });

  const rankedMissingSkills = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([skill]) => skill);

  if (rankedMissingSkills.length > 0) {
    return rankedMissingSkills.slice(0, 8);
  }

  return unique(matches.flatMap((match) => match.matchedSkills)).slice(0, 8);
};

const buildImprovementSuggestions = (
  resume: IResume,
  matches: CareerMatch[],
  focusSkills: string[]
): ResumeImprovementSuggestion[] => {
  const suggestions: ResumeImprovementSuggestion[] = [];
  const topMatch = matches[0];
  const summary = resume.parsed.summary?.trim() || '';
  const summaryWordCount = summary.split(/\s+/).filter(Boolean).length;
  const rawText = resume.rawText || '';
  const lowerRawText = rawText.toLowerCase();
  const hasProjectsSection = /\bprojects?\b/.test(lowerRawText);
  const hasMetrics = /(\d+%|\$\d[\d,]*|\d+\+|\b\d+\s+(users|customers|clients|requests|tests|pipelines|deployments|dashboards|models|features)\b)/i.test(rawText);
  const experienceEntries = resume.parsed.experience || [];
  const weakExperienceBullets = experienceEntries.filter((entry) => {
    const wordCount = entry.description?.trim().split(/\s+/).filter(Boolean).length || 0;
    return wordCount > 0 && wordCount < 12;
  }).length;
  const topMissingSkills = unique(topMatch?.missingSkills || []).slice(0, 4);
  const strongestSkills = unique(topMatch?.matchedSkills || resume.parsed.skills || []).slice(0, 4);

  if (summaryWordCount < 25) {
    suggestions.push({
      area: 'summary',
      priority: 'high',
      title: 'Lead with a sharper summary',
      detail:
        summaryWordCount === 0
          ? 'Your resume does not surface a clear professional summary.'
          : 'Your current summary is too short to position you for a target role.',
      action: topMatch
        ? `Open with the role you are aiming for (${topMatch.careerPath.title}) and back it with 3-4 strengths such as ${toSentence(strongestSkills.slice(0, 3))}.`
        : `Open with your target role, strongest tools, and the type of problems you solve in one concise paragraph.`,
    });
  } else if (topMatch) {
    suggestions.push({
      area: 'summary',
      priority: 'medium',
      title: 'Tune the summary to your strongest-fit role',
      detail: `Your best current match is ${topMatch.careerPath.title} at ${topMatch.matchScore}% compatibility.`,
      action: `Mirror that direction in the first 2 lines and foreground ${toSentence(strongestSkills.slice(0, 3))} before less relevant details.`,
    });
  }

  if (experienceEntries.length === 0) {
    suggestions.push({
      area: 'experience',
      priority: 'high',
      title: 'Add evidence-driven experience bullets',
      detail: 'No structured experience entries were extracted from the resume.',
      action: `Add internships, freelance work, or substantial projects with clear actions, tools, and outcomes tied to ${toSentence(focusSkills.slice(0, 3)) || 'your target role'}.`,
    });
  } else if (!hasMetrics || weakExperienceBullets > 0) {
    suggestions.push({
      area: 'experience',
      priority: 'high',
      title: 'Quantify your impact more clearly',
      detail: 'Your experience reads more like a task list than evidence of results.',
      action: 'Rewrite bullets as action + tools + measurable outcome, for example improved performance, reduced manual work, or shipped features/users supported.',
    });
  }

  if (!hasProjectsSection) {
    suggestions.push({
      area: 'projects',
      priority: 'high',
      title: 'Add a projects section for proof of work',
      detail: 'Your resume is missing an obvious projects section, which makes it harder to demonstrate depth outside job titles.',
      action: `Add 2-3 portfolio projects that showcase ${toSentence(focusSkills.slice(0, 4)) || 'your strongest technical skills'} and link each one to a GitHub repo or live demo.`,
    });
  }

  if ((resume.parsed.skills || []).length < 10) {
    suggestions.push({
      area: 'skills',
      priority: 'medium',
      title: 'Make the skills section easier to scan',
      detail: `Only ${(resume.parsed.skills || []).length} skills were confidently extracted from the resume.`,
      action: 'Group skills into clear buckets such as languages, frameworks, data, cloud, and tooling so recruiters can scan them faster.',
    });
  }

  if (topMissingSkills.length > 0) {
    suggestions.push({
      area: 'keywords',
      priority: 'medium',
      title: `Close the gap for ${topMatch?.careerPath.title || 'your target roles'}`,
      detail: `The recurring capability gaps across your top matches are ${toSentence(topMissingSkills)}.`,
      action: `Only add these terms if you have real hands-on exposure; otherwise build them through the suggested projects first, then reflect them in your skills and project bullets.`,
    });
  }

  return suggestions.slice(0, 5);
};

const buildProjectBlueprint = (
  match: CareerMatch
): Pick<ResumeProjectSuggestion, 'title' | 'summary' | 'deliverables' | 'resumeBullet'> => {
  switch (match.careerPath.slug) {
    case 'full-stack-developer':
      return {
        title: 'Build a workflow collaboration platform',
        summary: 'Create a multi-user product with a polished frontend, API layer, persistent data, and production-style delivery.',
        deliverables: [
          'Responsive dashboard with authentication and role-based views',
          'REST or GraphQL API backed by a database and input validation',
          'Deployment pipeline with tests, environment management, and documentation',
        ],
        resumeBullet:
          'Built and shipped a full-stack workflow platform with authentication, dashboards, and a production-ready API, documenting architecture and deployment for portfolio review.',
      };
    case 'frontend-developer':
      return {
        title: 'Launch an interactive analytics dashboard',
        summary: 'Design and build a frontend-heavy experience that proves UI architecture, state handling, accessibility, and data visualization skills.',
        deliverables: [
          'Responsive UI with filtering, search, and multi-step interactions',
          'Accessible charts or visualizations fed by a real or mocked API',
          'Performance and UX polish with loading, error, and empty states',
        ],
        resumeBullet:
          'Designed and delivered an interactive analytics dashboard with accessible UI patterns, rich data visualizations, and resilient state handling across loading and error states.',
      };
    case 'backend-developer':
      return {
        title: 'Build a production-style service API',
        summary: 'Create a backend system that emphasizes data modeling, API design, observability, and operational readiness.',
        deliverables: [
          'Well-structured API with authentication, validation, and pagination',
          'Relational or document database design with migrations or seed data',
          'Operational readiness via logging, tests, and deployment docs',
        ],
        resumeBullet:
          'Engineered a backend service with authenticated APIs, durable data modeling, and deployment-ready operational tooling including validation, tests, and logging.',
      };
    case 'data-scientist':
      return {
        title: 'Ship an end-to-end insight and prediction project',
        summary: 'Take a real dataset from cleaning through analysis, modeling, and decision-ready storytelling.',
        deliverables: [
          'Exploratory analysis notebook with clear business questions',
          'Model training and evaluation with explainable metrics',
          'Dashboard or report that translates findings into recommendations',
        ],
        resumeBullet:
          'Delivered an end-to-end data science project covering data cleaning, exploratory analysis, model evaluation, and stakeholder-ready insights backed by clear metrics.',
      };
    case 'ml-engineer':
      return {
        title: 'Deploy an ML inference service',
        summary: 'Build a machine learning project that proves model development, serving, and production thinking.',
        deliverables: [
          'Train and version a model with repeatable experiments',
          'Serve predictions through an API or lightweight app',
          'Containerize the workflow and document monitoring or retraining considerations',
        ],
        resumeBullet:
          'Built and deployed an ML inference service with repeatable model training, API-based serving, and production-minded packaging for reproducible delivery.',
      };
    case 'devops-engineer':
      return {
        title: 'Automate a cloud deployment pipeline',
        summary: 'Demonstrate infrastructure, release automation, and observability through a real deployment workflow.',
        deliverables: [
          'Infrastructure as code for application and supporting services',
          'CI/CD pipeline for test, build, and deployment automation',
          'Monitoring, alerting, and rollback or recovery documentation',
        ],
        resumeBullet:
          'Automated a cloud deployment pipeline with infrastructure as code, CI/CD workflows, and observability components to improve release confidence and operational visibility.',
      };
    case 'data-analyst':
      return {
        title: 'Create a decision-ready business dashboard',
        summary: 'Use SQL, analysis, and visualization to answer a concrete business question from messy data.',
        deliverables: [
          'Data extraction and cleaning workflow with documented assumptions',
          'Business KPI dashboard with trend, cohort, or funnel analysis',
          'Written recommendations that connect analysis to business action',
        ],
        resumeBullet:
          'Built a business intelligence project that combined SQL analysis, cleaned reporting layers, and decision-ready dashboards with actionable recommendations for stakeholders.',
      };
    case 'mobile-developer':
      return {
        title: 'Launch a cross-platform mobile app',
        summary: 'Build a mobile product that proves UX execution, device integration, and release discipline.',
        deliverables: [
          'Mobile app with authentication, offline handling, or notifications',
          'Polished user flows across multiple screens and device states',
          'Release-ready documentation, testing, and analytics instrumentation',
        ],
        resumeBullet:
          'Developed a cross-platform mobile application with polished user flows, device-aware features, and release-ready documentation that demonstrated end-to-end product execution.',
      };
    case 'cloud-solutions-architect':
      return {
        title: 'Design a scalable cloud reference architecture',
        summary: 'Show systems thinking by designing, automating, and documenting a scalable cloud environment for a realistic workload.',
        deliverables: [
          'Architecture diagram covering networking, compute, storage, and security',
          'Infrastructure as code that provisions core services',
          'Cost, resiliency, and scaling tradeoff notes for reviewers',
        ],
        resumeBullet:
          'Designed and automated a scalable cloud reference architecture, documenting infrastructure decisions, security boundaries, and resiliency tradeoffs for a realistic workload.',
      };
    case 'qa-test-automation-engineer':
      return {
        title: 'Build an automated quality engineering suite',
        summary: 'Create a testing project that proves framework design, regression coverage, and CI integration.',
        deliverables: [
          'Layered test coverage across unit, integration, and UI flows',
          'Reusable test data or fixture strategy for stable automation',
          'CI execution with reporting and failure triage guidance',
        ],
        resumeBullet:
          'Built an automated quality engineering suite with reusable test coverage, CI execution, and reporting workflows that improved regression confidence and defect visibility.',
      };
    default:
      return {
        title: `Build a portfolio piece for ${match.careerPath.title}`,
        summary: 'Create a scoped project that turns your target skills into visible, reviewable work.',
        deliverables: [
          'Core workflow that solves a real user or business problem',
          'Technical implementation that demonstrates target skills clearly',
          'Clear documentation, screenshots, and deployment or demo notes',
        ],
        resumeBullet:
          'Built a portfolio project that translated target role requirements into a documented, reviewable implementation with clear technical tradeoffs and outcomes.',
      };
  }
};

const buildProjectSuggestions = (matches: CareerMatch[]): ResumeProjectSuggestion[] => {
  return matches.slice(0, 3).map((match) => {
    const blueprint = buildProjectBlueprint(match);
    const skillsToPractice = unique([
      ...match.missingSkills.slice(0, 3),
      ...match.matchedSkills.slice(0, 2),
    ]).slice(0, 5);
    const primaryFocus = toSentence(skillsToPractice.slice(0, 3)) || match.careerPath.title;

    return {
      title: blueprint.title,
      targetCareer: match.careerPath.title,
      summary: `${blueprint.summary} Focus it on ${primaryFocus}.`,
      skillsToPractice,
      deliverables: blueprint.deliverables,
      whyItHelps: `This project gives you concrete proof for ${toSentence(match.missingSkills.slice(0, 3)) || 'the next-level skills hiring teams expect'} while reinforcing ${toSentence(match.matchedSkills.slice(0, 2)) || 'the strengths already visible in your resume'}.`,
      resumeBullet: blueprint.resumeBullet,
    };
  });
};

export const generateResumeCoachReport = async (
  resume: IResume
): Promise<ResumeCoachReport> => {
  const matches = await recommendCareers(resume.parsed.skills || []);
  const topMatches = matches.slice(0, 3);
  const focusSkills = buildFocusSkills(topMatches);

  return {
    targetRoles: topMatches.map((match) => ({
      careerPathId: match.careerPath._id.toString(),
      title: match.careerPath.title,
      matchScore: match.matchScore,
      matchedSkills: unique(match.matchedSkills).slice(0, 6),
      missingSkills: unique(match.missingSkills).slice(0, 6),
    })),
    focusSkills,
    improvementSuggestions: buildImprovementSuggestions(resume, topMatches, focusSkills),
    projectSuggestions: buildProjectSuggestions(topMatches),
  };
};
