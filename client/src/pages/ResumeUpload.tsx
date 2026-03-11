import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { resumeApi, careerApi } from '../lib/api';
import type { Resume } from '../types';
import { Upload, FileText, Trash2, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ResumeUpload = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await resumeApi.upload(file);
      toast.success('Resume uploaded and parsed successfully!');
      setSelectedResume(response.data.data);
      fetchResumes();
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
        <p className="text-gray-600 mt-1">Upload and manage your resumes</p>
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
      )}
    </div>
  );
};

export default ResumeUpload;
