import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { resumeApi, careerApi } from '../lib/api';
import type { Resume, ResumeCoachReport, ResumeImprovementSuggestion, ResumeProjectSuggestion } from '../types';
import {
  Upload,
  FileText,
  Trash2,
  Zap,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCcw,
  FolderKanban,
  Target,
  Lightbulb,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ResumeUpload = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestionsByResumeId, setSuggestionsByResumeId] = useState<Record<string, ResumeCoachReport>>({});
  const [loadingSuggestionsResumeId, setLoadingSuggestionsResumeId] = useState<string | null>(null);

  const fetchResumes = async () => {
    try {
      const response = await resumeApi.getAll();
      setResumes(response.data.data);
    } catch {
      toast.error('Failed to load resumes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const loadSuggestions = useCallback(
    async (resumeId: string, force = false) => {
      if (!force && suggestionsByResumeId[resumeId]) {
        return;
      }

      setLoadingSuggestionsResumeId(resumeId);
      try {
        const response = await resumeApi.getSuggestions(resumeId);
        setSuggestionsByResumeId((prev) => ({
          ...prev,
          [resumeId]: response.data.data,
        }));
      } catch {
        toast.error('Failed to load resume suggestions.');
      } finally {
        setLoadingSuggestionsResumeId((current) => (current === resumeId ? null : current));
      }
    },
    [suggestionsByResumeId]
  );

  useEffect(() => {
    if (!selectedResume?._id) {
      return;
    }

    loadSuggestions(selectedResume._id);
  }, [loadSuggestions, selectedResume?._id]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await resumeApi.upload(file);
      toast.success('Resume uploaded and parsed successfully!');
      setSelectedResume(response.data.data);
      await fetchResumes();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleDelete = async (id: string) => {
    try {
      await resumeApi.delete(id);
      toast.success('Resume deleted.');
      setResumes((prev) => prev.filter((r) => r._id !== id));
      setSuggestionsByResumeId((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (selectedResume?._id === id) setSelectedResume(null);
    } catch {
      toast.error('Failed to delete resume.');
    }
  };

  const handleAnalyze = async (resumeId: string) => {
    setIsAnalyzing(true);
    try {
      await careerApi.analyze(resumeId);
      toast.success('Analysis complete! Check your career recommendations.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const viewResume = async (id: string) => {
    try {
      const response = await resumeApi.getById(id);
      setSelectedResume(response.data.data);
    } catch {
      toast.error('Failed to load resume details.');
    }
  };

  const selectedResumeSuggestions = selectedResume?._id
    ? suggestionsByResumeId[selectedResume._id]
    : null;
  const isLoadingSuggestions = selectedResume?._id === loadingSuggestionsResumeId;

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
        <h1 className="text-2xl font-bold text-gray-900">Resume</h1>
        <p className="text-gray-600 mt-1">
          Upload, review parsed resume content, and get targeted improvement ideas.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-ocean-400 bg-ocean-50'
            : 'border-gray-300 hover:border-ocean-300 hover:bg-ocean-50/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragActive ? 'text-ocean-500' : 'text-gray-400'}`} />
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Uploading and parsing resume...</p>
          </>
        ) : isDragActive ? (
          <p className="text-ocean-600 font-medium">Drop your resume here...</p>
        ) : (
          <>
            <p className="text-gray-900 font-medium mb-1">
              Drag & drop your resume here, or click to browse
            </p>
            <p className="text-sm text-gray-500">Supports PDF and DOCX (max 10MB)</p>
          </>
        )}
      </div>

      {/* Resume List */}
      {resumes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Resumes</h2>
          <div className="space-y-3">
            {resumes.map((resume) => (
              <div
                key={resume._id}
                className={`flex items-center justify-between p-4 bg-white rounded-xl border transition-colors cursor-pointer ${
                  selectedResume?._id === resume._id
                    ? 'border-ocean-300 ring-1 ring-ocean-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => viewResume(resume._id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-8 w-8 text-ocean-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{resume.originalFilename}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(resume.createdAt).toLocaleDateString()} &middot;{' '}
                      {resume.parsed?.skills?.length || 0} skills found
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {resume.isProcessed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAnalyze(resume._id);
                    }}
                    disabled={isAnalyzing}
                    className="flex items-center gap-1 px-3 py-1.5 bg-ocean-50 text-ocean-700 rounded-lg text-sm font-medium hover:bg-ocean-100 transition-colors disabled:opacity-50"
                  >
                    <Zap className="h-4 w-4" />
                    Analyze
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(resume._id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Resume Details */}
      {selectedResume && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Parsed Results: {selectedResume.originalFilename}
            </h2>

            {/* Skills */}
            {selectedResume.parsed?.skills?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Skills ({selectedResume.parsed.skills.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedResume.parsed.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-ocean-50 text-ocean-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {selectedResume.parsed?.experience?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Experience ({selectedResume.parsed.experience.length})
                </h3>
                <div className="space-y-3">
                  {selectedResume.parsed.experience.map((exp, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">{exp.title}</p>
                      {exp.company && <p className="text-sm text-gray-600">{exp.company}</p>}
                      {exp.duration && <p className="text-sm text-gray-400">{exp.duration}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {selectedResume.parsed?.education?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Education ({selectedResume.parsed.education.length})
                </h3>
                <div className="space-y-3">
                  {selectedResume.parsed.education.map((edu, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">{edu.degree}</p>
                      {edu.institution && <p className="text-sm text-gray-600">{edu.institution}</p>}
                      {edu.year && <p className="text-sm text-gray-400">{edu.year}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {selectedResume.parsed?.certifications?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Certifications ({selectedResume.parsed.certifications.length})
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {selectedResume.parsed.certifications.map((cert, i) => (
                    <li key={i} className="text-sm text-gray-700">
                      {cert}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Summary */}
            {selectedResume.parsed?.summary && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Summary
                </h3>
                <p className="text-sm text-gray-700">{selectedResume.parsed.summary}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-ocean-600" />
                  Resume Improvement & Project Suggestions
                </h2>
                <p className="text-sm text-gray-600 mt-1 max-w-2xl">
                  Personalized advice based on your extracted skills and strongest-fit career paths.
                </p>
              </div>
              <button
                onClick={() => loadSuggestions(selectedResume._id, true)}
                disabled={isLoadingSuggestions}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-ocean-200 text-ocean-700 bg-ocean-50 hover:bg-ocean-100 transition-colors disabled:opacity-50"
              >
                {isLoadingSuggestions ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-ocean-700"></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4" />
                    Refresh Suggestions
                  </>
                )}
              </button>
            </div>

            {isLoadingSuggestions && !selectedResumeSuggestions ? (
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600 mx-auto mb-3"></div>
                <p className="text-sm text-gray-600">Generating resume coaching suggestions...</p>
              </div>
            ) : selectedResumeSuggestions ? (
              <div className="space-y-6">
                {selectedResumeSuggestions.targetRoles.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-ocean-600" />
                      <h3 className="font-medium text-gray-900">Best-Fit Roles</h3>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {selectedResumeSuggestions.targetRoles.map((role) => (
                        <div key={role.careerPathId} className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-gray-900">{role.title}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {role.matchedSkills.length} matched skills
                              </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-ocean-100 text-ocean-700">
                              {role.matchScore}%
                            </span>
                          </div>
                          {role.missingSkills.length > 0 && (
                            <p className="text-xs text-gray-600 mt-3">
                              Biggest gaps: {role.missingSkills.slice(0, 3).join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedResumeSuggestions.focusSkills.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-amber-600" />
                      <h3 className="font-medium text-amber-900">High-Value Skills To Prove Next</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedResumeSuggestions.focusSkills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 rounded-full bg-white text-amber-800 text-xs font-medium border border-amber-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-amber-800 mt-3">
                      Add these only when you can back them up with coursework, projects, or hands-on work.
                    </p>
                  </div>
                )}

                {selectedResumeSuggestions.improvementSuggestions.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Resume Improvements</h3>
                    <div className="grid gap-3 lg:grid-cols-2">
                      {selectedResumeSuggestions.improvementSuggestions.map((suggestion, index) => (
                        <ImprovementSuggestionCard
                          key={`${suggestion.area}-${index}`}
                          suggestion={suggestion}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {selectedResumeSuggestions.projectSuggestions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FolderKanban className="h-4 w-4 text-ocean-600" />
                      <h3 className="font-medium text-gray-900">Project Suggestions</h3>
                    </div>
                    <div className="grid gap-4 xl:grid-cols-3 md:grid-cols-2">
                      {selectedResumeSuggestions.projectSuggestions.map((project, index) => (
                        <ProjectSuggestionCard key={`${project.title}-${index}`} project={project} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-8 text-center">
                <p className="text-sm text-gray-600">
                  Select a processed resume to load tailored improvement suggestions.
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">
                Suggestions are generated from the extracted skills in this resume and the top career paths in the platform.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const priorityStyles: Record<ResumeImprovementSuggestion['priority'], string> = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-gray-50 text-gray-700 border-gray-200',
};

const areaLabels: Record<ResumeImprovementSuggestion['area'], string> = {
  summary: 'Summary',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  keywords: 'Keywords',
};

const ImprovementSuggestionCard = ({ suggestion }: { suggestion: ResumeImprovementSuggestion }) => {
  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-gray-50 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-gray-900">{suggestion.title}</p>
          <p className="text-xs text-gray-500 mt-1">{areaLabels[suggestion.area]}</p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-[11px] font-semibold border capitalize ${priorityStyles[suggestion.priority]}`}
        >
          {suggestion.priority}
        </span>
      </div>
      <p className="text-sm text-gray-600">{suggestion.detail}</p>
      <div className="rounded-lg bg-white border border-gray-200 p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-ocean-700 mb-1">Recommended action</p>
        <p className="text-sm text-gray-700">{suggestion.action}</p>
      </div>
    </div>
  );
};

const ProjectSuggestionCard = ({ project }: { project: ResumeProjectSuggestion }) => {
  return (
    <div className="rounded-xl border border-gray-200 p-5 bg-gray-50 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-1 rounded-full bg-ocean-100 text-ocean-700 text-[11px] font-semibold">
            {project.targetCareer}
          </span>
        </div>
        <h4 className="font-semibold text-gray-900">{project.title}</h4>
        <p className="text-sm text-gray-600 mt-2">{project.summary}</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Skills To Practice
        </p>
        <div className="flex flex-wrap gap-2">
          {project.skillsToPractice.map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-700"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Suggested Deliverables
        </p>
        <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
          {project.deliverables.map((deliverable) => (
            <li key={deliverable}>{deliverable}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg bg-white border border-gray-200 p-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-ocean-700">Why this helps</p>
        <p className="text-sm text-gray-700">{project.whyItHelps}</p>
      </div>

      <div className="rounded-lg bg-slate-900 p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
          Resume bullet after you build it
        </p>
        <p className="text-sm text-slate-100">{project.resumeBullet}</p>
      </div>
    </div>
  );
};

export default ResumeUpload;
