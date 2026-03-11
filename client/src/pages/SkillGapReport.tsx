import { useState, useEffect } from 'react';
import { careerApi, resumeApi } from '../lib/api';
import type { Resume, SkillGap } from '../types';
import { Target, AlertTriangle, CheckCircle, ChevronDown, BarChart3, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import toast from 'react-hot-toast';

const proficiencyColors = {
  beginner: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  intermediate: 'bg-blue-100 text-blue-700 border-blue-300',
  advanced: 'bg-green-100 text-green-700 border-green-300',
};

const demandBadge = {
  high: 'bg-red-50 text-red-600',
  medium: 'bg-yellow-50 text-yellow-600',
  low: 'bg-gray-50 text-gray-500',
};

const SkillGapReport = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [skillGap, setSkillGap] = useState<SkillGap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const response = await resumeApi.getAll();
        const data = response.data.data;
        setResumes(data);
        if (data.length > 0) {
          setSelectedResumeId(data[0]._id);
        }
      } catch {
        toast.error('Failed to load resumes.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchResumes();
  }, []);

  const handleAnalyze = async () => {
    if (!selectedResumeId) {
      toast.error('Please select a resume first.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await careerApi.getSkillGap(selectedResumeId);
      setSkillGap(response.data.data);
    } catch {
      toast.error('Failed to analyze skill gap.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600"></div>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Skill Gap Analysis</h1>
          <p className="text-gray-600 mt-1">Upload a resume first to analyze your skill gaps</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No resumes found. Please upload a resume first.</p>
        </div>
      </div>
    );
  }

  const pieData = skillGap
    ? [
      { name: 'Skills You Have', value: skillGap.matchedSkills.length },
      { name: 'Skills to Learn', value: skillGap.missingSkills.length },
    ]
    : [];

  const PIE_COLORS = ['#0369a1', '#f97316'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Skill Gap Analysis</h1>
        <p className="text-gray-600 mt-1">
          TF-IDF weighted comparison of your skills against industry requirements
        </p>
      </div>

      {/* Resume Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Resume
            </label>
            <div className="relative">
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none bg-white"
              >
                {resumes.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.originalFilename} ({r.parsed?.skills?.length || 0} skills)
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-6 py-2.5 bg-ocean-600 text-white rounded-lg font-medium hover:bg-ocean-700 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Skill Gap'}
          </button>
        </div>
      </div>

      {/* Results */}
      {skillGap && (
        <div className="space-y-6">
          {/* Score Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-3xl font-bold text-ocean-700">{skillGap.matchScore}%</p>
              <p className="text-xs text-gray-500 mt-1">Weighted Match Score</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{skillGap.gapPercentage}%</p>
              <p className="text-xs text-gray-500 mt-1">Skill Gap</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{skillGap.matchedSkills.length}</p>
              <p className="text-xs text-gray-500 mt-1">Skills Matched</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-3xl font-bold text-red-500">{skillGap.missingSkills.length}</p>
              <p className="text-xs text-gray-500 mt-1">Skills Missing</p>
            </div>
          </div>

          {/* Overview */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills Overview</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Matched Skills with Proficiency & TF-IDF */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="flex items-center gap-2 text-sm font-medium text-green-600 uppercase tracking-wider mb-3">
                <CheckCircle className="h-4 w-4" /> Your Matched Skills ({skillGap.matchedSkills.length})
              </h3>
              <div className="space-y-2 max-h-[230px] overflow-y-auto">
                {skillGap.matchedSkills
                  .sort((a, b) => b.tfidf - a.tfidf)
                  .map((sw) => (
                    <div
                      key={sw.skill}
                      className="flex items-center justify-between py-1.5 px-3 bg-green-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{sw.skill}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${proficiencyColors[sw.proficiency]
                            }`}
                        >
                          {sw.proficiency}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${demandBadge[sw.demandLevel]}`}>
                          {sw.demandLevel}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono w-12 text-right">
                          {sw.tfidf.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Missing Skills with TF-IDF importance */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="flex items-center gap-2 text-sm font-medium text-orange-600 uppercase tracking-wider mb-3">
              <AlertTriangle className="h-4 w-4" /> Skills to Learn ({skillGap.missingSkills.length})
              <span className="text-[10px] text-gray-400 font-normal normal-case ml-2">
                sorted by TF-IDF importance
              </span>
            </h3>
            {skillGap.missingSkills.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {skillGap.missingSkills
                  .sort((a, b) => b.tfidf - a.tfidf)
                  .map((sw) => (
                    <div
                      key={sw.skill}
                      className="flex items-center justify-between py-2 px-3 bg-orange-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-orange-400" />
                        <span className="text-sm font-medium text-gray-800">{sw.skill}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${demandBadge[sw.demandLevel]}`}>
                          {sw.demandLevel}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono w-12 text-right">
                          {sw.tfidf.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Great! No skill gaps found.</p>
            )}
          </div>

          {/* Category Breakdown with Proficiency Distribution */}
          {skillGap.categoryBreakdown && skillGap.categoryBreakdown.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <BarChart3 className="h-5 w-5 text-ocean-600" />
                Category Breakdown
              </h2>
              <div className="space-y-5">
                {skillGap.categoryBreakdown.map((cat) => {
                  const pct = cat.total > 0 ? Math.round((cat.matched / cat.total) * 100) : 0;
                  const prof = cat.proficiencyDistribution;
                  return (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {cat.category.replace('-', ' ')}
                        </span>
                        <span className="text-sm text-gray-500">
                          {cat.matched}/{cat.total} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className="bg-ocean-500 h-2.5 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        {prof && (prof.beginner > 0 || prof.intermediate > 0 || prof.advanced > 0) && (
                          <div className="flex items-center gap-2 text-[10px]">
                            {prof.beginner > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">
                                {prof.beginner} beginner
                              </span>
                            )}
                            {prof.intermediate > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                {prof.intermediate} intermediate
                              </span>
                            )}
                            {prof.advanced > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                                {prof.advanced} advanced
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {cat.missing.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          Missing: {cat.missing.join(', ')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillGapReport;
