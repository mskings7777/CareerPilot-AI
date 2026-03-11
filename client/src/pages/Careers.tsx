import { useState, useEffect } from 'react';
import { careerApi, resumeApi } from '../lib/api';
import type { CareerPath, Resume, PersonalizedRoadmap, PersonalizedRoadmapPhase } from '../types';
import {
  TrendingUp,
  DollarSign,
  BookOpen,
  X,
  ExternalLink,
  Target,
  ChevronDown,
  CheckCircle,
  GraduationCap,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';

const demandColors = {
  high: 'bg-green-50 text-green-700',
  medium: 'bg-yellow-50 text-yellow-700',
  low: 'bg-gray-50 text-gray-600',
};

const stageColors: Record<string, string> = {
  Beginner: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Intermediate: 'bg-blue-100 text-blue-800 border-blue-300',
  Advanced: 'bg-purple-100 text-purple-800 border-purple-300',
};

const stageIcons: Record<string, string> = {
  Beginner: '1',
  Intermediate: '2',
  Advanced: '3',
};

const Careers = () => {
  const [careers, setCareers] = useState<CareerPath[]>([]);
  const [selectedCareer, setSelectedCareer] = useState<CareerPath | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Personalized roadmap state
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [personalizedRoadmap, setPersonalizedRoadmap] = useState<PersonalizedRoadmap | null>(null);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
  const [showPersonalized, setShowPersonalized] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [careersRes, resumesRes] = await Promise.all([
          careerApi.getPaths(),
          resumeApi.getAll(),
        ]);
        setCareers(careersRes.data.data);
        const resumeData = resumesRes.data.data;
        setResumes(resumeData);
        if (resumeData.length > 0) {
          setSelectedResumeId(resumeData[0]._id);
        }
      } catch {
        toast.error('Failed to load career paths.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const viewCareerDetail = async (slug: string) => {
    setIsLoadingDetail(true);
    setPersonalizedRoadmap(null);
    setShowPersonalized(false);
    try {
      const response = await careerApi.getPathBySlug(slug);
      setSelectedCareer(response.data.data);
    } catch {
      toast.error('Failed to load career details.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeModal = () => {
    setSelectedCareer(null);
    setPersonalizedRoadmap(null);
    setShowPersonalized(false);
  };

  const handleGenerateRoadmap = async () => {
    if (!selectedCareer || !selectedResumeId) {
      toast.error('Please select a resume first.');
      return;
    }
    setIsLoadingRoadmap(true);
    try {
      const response = await careerApi.getPersonalizedRoadmap(selectedCareer._id, selectedResumeId);
      setPersonalizedRoadmap(response.data.data);
      setShowPersonalized(true);
    } catch {
      toast.error('Failed to generate personalized roadmap.');
    } finally {
      setIsLoadingRoadmap(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Career Paths</h1>
        <p className="text-gray-600 mt-1">
          Explore career paths with salary data, required skills, and personalized learning roadmaps
        </p>
      </div>

      {/* Career Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {careers.map((career) => (
          <div
            key={career._id}
            onClick={() => viewCareerDetail(career.slug)}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:border-ocean-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{career.title}</h3>
                <p className="text-sm text-gray-500">{career.category}</p>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  demandColors[career.demandLevel]
                }`}
              >
                {career.demandLevel} demand
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{career.description}</p>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {(career.averageSalary?.min / 1000).toFixed(0)}k -
                {(career.averageSalary?.max / 1000).toFixed(0)}k
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                {career.requiredSkills?.length || 0} skills
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              {career.requiredSkills?.slice(0, 5).map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                >
                  {skill}
                </span>
              ))}
              {(career.requiredSkills?.length || 0) > 5 && (
                <span className="px-2 py-0.5 text-gray-400 text-xs">
                  +{career.requiredSkills.length - 5} more
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Career Detail Modal */}
      {selectedCareer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-8 shadow-xl">
            {isLoadingDetail ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600"></div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedCareer.title}
                      </h2>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm text-gray-500">{selectedCareer.category}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            demandColors[selectedCareer.demandLevel]
                          }`}
                        >
                          {selectedCareer.demandLevel} demand
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={closeModal}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
                  {/* Description */}
                  <p className="text-gray-600">{selectedCareer.description}</p>

                  {/* Salary & Outlook */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">Average Salary</span>
                      </div>
                      <p className="text-xl font-bold text-green-700">
                        ${selectedCareer.averageSalary?.min?.toLocaleString()} - $
                        {selectedCareer.averageSalary?.max?.toLocaleString()}
                      </p>
                      <p className="text-sm text-green-600">
                        {selectedCareer.averageSalary?.currency}/year
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-800">Growth Outlook</span>
                      </div>
                      <p className="text-sm text-blue-700">{selectedCareer.growthOutlook}</p>
                    </div>
                  </div>

                  {/* Required Skills */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCareer.requiredSkills?.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-ocean-50 text-ocean-700 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedCareer.optionalSkills?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Optional / Bonus Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCareer.optionalSkills.map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Personalized Roadmap Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-ocean-600" />
                        {showPersonalized ? 'Your Personalized Roadmap' : 'Learning Roadmap'}
                      </h3>
                      {!showPersonalized && (
                        <div className="flex items-center gap-2">
                          {/* Toggle between generic and personalized */}
                          {resumes.length > 0 ? (
                            <button
                              onClick={() => setShowPersonalized(true)}
                              className="text-sm text-ocean-600 hover:text-ocean-700 font-medium flex items-center gap-1"
                            >
                              Personalize
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">Upload a resume to personalize</span>
                          )}
                        </div>
                      )}
                      {showPersonalized && (
                        <button
                          onClick={() => {
                            setShowPersonalized(false);
                            setPersonalizedRoadmap(null);
                          }}
                          className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                        >
                          View Generic Roadmap
                        </button>
                      )}
                    </div>

                    {/* Personalized Roadmap Controls & Display */}
                    {showPersonalized && (
                      <div className="space-y-6">
                        {/* Resume selector + generate button */}
                        {!personalizedRoadmap && (
                          <div className="bg-ocean-50 rounded-lg p-4">
                            <p className="text-sm text-ocean-800 mb-3">
                              Select a resume to generate a personalized roadmap that skips skills you already have.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 items-end">
                              <div className="flex-1 w-full">
                                <label className="block text-xs font-medium text-ocean-700 mb-1">
                                  Resume
                                </label>
                                <div className="relative">
                                  <select
                                    value={selectedResumeId}
                                    onChange={(e) => setSelectedResumeId(e.target.value)}
                                    className="w-full px-3 py-2 border border-ocean-200 rounded-lg appearance-none focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none bg-white text-sm"
                                  >
                                    {resumes.map((r) => (
                                      <option key={r._id} value={r._id}>
                                        {r.originalFilename} ({r.parsed?.skills?.length || 0} skills)
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className="h-4 w-4 text-ocean-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                              </div>
                              <button
                                onClick={handleGenerateRoadmap}
                                disabled={isLoadingRoadmap}
                                className="px-5 py-2 bg-ocean-600 text-white rounded-lg text-sm font-medium hover:bg-ocean-700 transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
                              >
                                {isLoadingRoadmap ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-4 w-4" />
                                    Generate Roadmap
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Personalized Roadmap Display */}
                        {personalizedRoadmap && (
                          <PersonalizedRoadmapView roadmap={personalizedRoadmap} />
                        )}
                      </div>
                    )}

                    {/* Generic Roadmap (original) */}
                    {!showPersonalized && selectedCareer.roadmap?.length > 0 && (
                      <div className="space-y-4">
                        {selectedCareer.roadmap.map((phase) => (
                          <div key={phase.phase} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="h-8 w-8 rounded-full bg-ocean-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                                {phase.phase}
                              </div>
                              {phase.phase < selectedCareer.roadmap.length && (
                                <div className="w-0.5 flex-1 bg-ocean-200 mt-1"></div>
                              )}
                            </div>
                            <div className="pb-6">
                              <h4 className="font-medium text-gray-900">{phase.title}</h4>
                              <p className="text-sm text-gray-600 mb-2">{phase.description}</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                {phase.skills?.map((skill) => (
                                  <span
                                    key={skill}
                                    className="px-2 py-0.5 bg-ocean-50 text-ocean-700 rounded text-xs font-medium"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                <span className="text-xs text-gray-400">
                                  ~{phase.durationWeeks} weeks
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Learning Resources */}
                  {!showPersonalized && selectedCareer.learningResources?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">
                        <BookOpen className="h-5 w-5 inline mr-1" />
                        Learning Resources
                      </h3>
                      <div className="space-y-2">
                        {selectedCareer.learningResources.map((resource, i) => (
                          <a
                            key={i}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{resource.title}</p>
                              <p className="text-xs text-gray-500">
                                {resource.provider} &middot;{' '}
                                <span className="capitalize">{resource.type}</span> &middot;{' '}
                                {resource.isFree ? (
                                  <span className="text-green-600">Free</span>
                                ) : (
                                  <span className="text-gray-500">Paid</span>
                                )}
                              </p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Personalized Roadmap Sub-component ---

const PersonalizedRoadmapView = ({ roadmap }: { roadmap: PersonalizedRoadmap }) => {
  return (
    <div className="space-y-5">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-ocean-700">{roadmap.completionPercentage}%</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Already Complete</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-orange-600">{roadmap.totalSkillsToLearn}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Skills to Learn</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{roadmap.totalSkillsKnown}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Skills You Have</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-700">{roadmap.totalWeeks}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Estimated Weeks</p>
        </div>
      </div>

      {/* Completion Progress Bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Your Progress</span>
          <span>{roadmap.completionPercentage}% of skills covered</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className="bg-ocean-500 h-2.5 rounded-full transition-all"
            style={{ width: `${roadmap.completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Phases */}
      {roadmap.phases.length === 0 ? (
        <div className="bg-green-50 rounded-lg p-6 text-center">
          <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
          <p className="text-green-800 font-medium">You already have all the required skills!</p>
          <p className="text-sm text-green-600 mt-1">No additional learning needed for this career path.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {roadmap.phases.map((phase, idx) => (
            <PersonalizedPhaseCard
              key={phase.phase}
              phase={phase}
              isLast={idx === roadmap.phases.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PersonalizedPhaseCard = ({
  phase,
  isLast,
}: {
  phase: PersonalizedRoadmapPhase;
  isLast: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex gap-4">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className="h-8 w-8 rounded-full bg-ocean-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
          {stageIcons[phase.stage] || phase.phase}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-ocean-200 mt-1"></div>}
      </div>

      {/* Phase Content */}
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h4 className="font-medium text-gray-900">{phase.title}</h4>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
              stageColors[phase.stage] || 'bg-gray-100 text-gray-600 border-gray-300'
            }`}
          >
            {phase.stage}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            ~{phase.estimatedWeeks} weeks
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-3">{phase.description}</p>

        {/* Skills to Learn */}
        {phase.skillsToLearn.length > 0 && (
          <div className="mb-2">
            <span className="text-[10px] uppercase tracking-wider text-orange-600 font-medium flex items-center gap-1 mb-1.5">
              <GraduationCap className="h-3 w-3" />
              Skills to learn ({phase.skillsToLearn.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {phase.skillsToLearn.map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Skills Already Known */}
        {phase.skillsAlreadyKnown.length > 0 && (
          <div className="mb-2">
            <span className="text-[10px] uppercase tracking-wider text-green-600 font-medium flex items-center gap-1 mb-1.5">
              <CheckCircle className="h-3 w-3" />
              Already known ({phase.skillsAlreadyKnown.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {phase.skillsAlreadyKnown.map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium line-through decoration-green-400"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Resources (collapsible) */}
        {phase.resources.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-ocean-600 hover:text-ocean-700 font-medium"
            >
              <Layers className="h-3 w-3" />
              {expanded ? 'Hide' : 'Show'} {phase.resources.length} learning resource{phase.resources.length !== 1 ? 's' : ''}
              <ChevronDown
                className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </button>
            {expanded && (
              <div className="mt-2 space-y-1.5">
                {phase.resources.map((resource, i) => (
                  <a
                    key={i}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-800 text-xs">{resource.title}</p>
                      <p className="text-[10px] text-gray-500">
                        {resource.provider} &middot;{' '}
                        <span className="capitalize">{resource.type}</span> &middot;{' '}
                        {resource.isFree ? (
                          <span className="text-green-600">Free</span>
                        ) : (
                          <span className="text-gray-500">Paid</span>
                        )}
                      </p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-gray-400 shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Careers;
