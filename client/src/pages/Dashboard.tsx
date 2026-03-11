import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { careerApi } from '../lib/api';
import type { DashboardData } from '../types';
import { FileText, Target, Compass, TrendingUp, Upload, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await careerApi.getDashboard();
        setData(response.data.data);
      } catch {
        toast.error('Failed to load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600"></div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Resumes Uploaded',
      value: data?.stats.resumesUploaded || 0,
      icon: FileText,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Skills Identified',
      value: data?.stats.skillsIdentified || 0,
      icon: Target,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Career Matches',
      value: data?.stats.careerMatchesFound || 0,
      icon: Compass,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Skill Gap',
      value: `${data?.stats.skillGapPercentage || 0}%`,
      icon: TrendingUp,
      color: 'bg-orange-50 text-orange-600',
    },
  ];

  const chartData =
    data?.topCareerMatches?.map((m) => ({
      name: m.title.length > 18 ? m.title.substring(0, 18) + '...' : m.title,
      score: m.matchScore,
    })) || [];

  const barColors = ['#0369a1', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc'];

  const hasData = (data?.stats.resumesUploaded || 0) > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Your career guidance overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {!hasData ? (
        /* Empty state */
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Upload className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Get Started</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Upload your resume to get AI-powered career recommendations, skill gap analysis, and personalized learning roadmaps.
          </p>
          <Link
            to="/resume"
            className="inline-flex items-center gap-2 bg-ocean-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-ocean-700 transition-colors"
          >
            Upload Resume <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Career Matches Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Career Matches</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'Match Score']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={barColors[i % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-12">No career matches yet.</p>
            )}
          </div>

          {/* Top Skills */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Top Skills</h2>
            {data?.topSkills && data.topSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.topSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 bg-ocean-50 text-ocean-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-12">No skills extracted yet.</p>
            )}

            {data?.latestResume && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Latest Resume</p>
                <p className="text-sm font-medium text-gray-900">{data.latestResume.filename}</p>
                <p className="text-xs text-gray-400">
                  Uploaded {new Date(data.latestResume.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link
          to="/resume"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-ocean-300 hover:shadow-sm transition-all"
        >
          <div className="p-2 rounded-lg bg-ocean-50">
            <FileText className="h-5 w-5 text-ocean-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Upload Resume</p>
            <p className="text-sm text-gray-500">Parse your skills</p>
          </div>
        </Link>
        <Link
          to="/skill-gap"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-ocean-300 hover:shadow-sm transition-all"
        >
          <div className="p-2 rounded-lg bg-green-50">
            <Target className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Skill Gap Analysis</p>
            <p className="text-sm text-gray-500">Find what to learn</p>
          </div>
        </Link>
        <Link
          to="/careers"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-ocean-300 hover:shadow-sm transition-all"
        >
          <div className="p-2 rounded-lg bg-purple-50">
            <Compass className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Explore Careers</p>
            <p className="text-sm text-gray-500">Browse career paths</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
