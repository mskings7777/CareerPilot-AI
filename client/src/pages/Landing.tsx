import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Compass, FileText, Target, Zap, ArrowRight, BarChart3, BookOpen } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Resume Parsing',
    description: 'Upload your resume and our AI extracts your skills, experience, and education automatically.',
  },
  {
    icon: Target,
    title: 'Skill Gap Analysis',
    description: 'Compare your skills with industry requirements and discover exactly what you need to learn.',
  },
  {
    icon: Zap,
    title: 'Career Recommendations',
    description: 'Get AI-powered career path suggestions matched to your unique skill profile.',
  },
  {
    icon: BookOpen,
    title: 'Learning Roadmap',
    description: 'Receive step-by-step learning paths with courses, certifications, and resources.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard Analytics',
    description: 'Track your progress with visual dashboards showing skills, gaps, and career matches.',
  },
  {
    icon: Compass,
    title: 'Career Exploration',
    description: 'Browse career paths with salary data, demand levels, and growth outlooks.',
  },
];

const Landing = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Compass className="h-8 w-8 text-ocean-600" />
              <span className="text-xl font-bold text-ocean-700">CareerPilot</span>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="bg-ocean-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ocean-700 transition-colors"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-ocean-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ocean-700 transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-ocean-600 via-ocean-700 to-ocean-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
              Navigate Your Career with AI-Powered Guidance
            </h1>
            <p className="text-lg lg:text-xl text-ocean-100 mb-8">
              Upload your resume, discover skill gaps, and get personalized career
              recommendations backed by real-time job market data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="inline-flex items-center justify-center gap-2 bg-white text-ocean-700 px-6 py-3 rounded-lg font-semibold hover:bg-ocean-50 transition-colors"
              >
                Start Free <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 border border-white/30 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Career Success
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform analyzes your skills, identifies gaps, and creates
              a personalized roadmap to your dream career.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-xl border border-gray-200 hover:border-ocean-200 hover:shadow-lg transition-all"
                >
                  <div className="h-12 w-12 rounded-lg bg-ocean-50 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-ocean-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Four simple steps to your ideal career path</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Upload Resume', desc: 'Upload your PDF or DOCX resume' },
              { step: '2', title: 'AI Analysis', desc: 'Our AI extracts and analyzes your skills' },
              { step: '3', title: 'Get Insights', desc: 'View skill gaps and career matches' },
              { step: '4', title: 'Plan & Grow', desc: 'Follow your personalized learning roadmap' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="h-14 w-14 rounded-full bg-ocean-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-ocean-700 text-white">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Pilot Your Career?</h2>
          <p className="text-ocean-100 text-lg mb-8">
            Join thousands of professionals who have found their ideal career path with CareerPilot.
          </p>
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="inline-flex items-center gap-2 bg-white text-ocean-700 px-8 py-3 rounded-lg font-semibold hover:bg-ocean-50 transition-colors"
          >
            Get Started Free <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Compass className="h-6 w-6 text-ocean-400" />
            <span className="text-lg font-bold text-white">CareerPilot</span>
          </div>
          <p className="text-sm">AI-powered career guidance for everyone.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
