/**
 * CV Tailor Preview Page
 * Shows original vs tailored CV with highlighted changes
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Download, Loader, ArrowRight } from 'lucide-react';

interface CVChange {
  type: 'reordered' | 'enhanced' | 'highlighted' | 'added' | 'removed';
  section: string;
  description: string;
}

interface CVTailorPreviewProps {
  userId: string;
  jobPostingId: string;
  onProceedToCoverLetter?: (tailoredCVId: string) => void;
}

export const CVTailorPreview: React.FC<CVTailorPreviewProps> = ({
  userId,
  jobPostingId,
  onProceedToCoverLetter
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tailoredCV, setTailoredCV] = useState<any>(null);
  const [changes, setChanges] = useState<CVChange[]>([]);
  const [matchScore, setMatchScore] = useState(0);
  const [matchedSkills, setMatchedSkills] = useState<string[]>([]);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [tailoredCVId, setTailoredCVId] = useState('');

  useEffect(() => {
    const tailorCV = async () => {
      try {
        const response = await fetch('/api/cv/tailor-for-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, jobPostingId })
        });

        if (!response.ok) {
          throw new Error('Failed to tailor CV');
        }

        const data = await response.json();
        if (data.success) {
          setTailoredCVId(data.tailoredCVId);
          setTailoredCV(data.tailoredCV);
          setChanges(data.changes);
          setMatchScore(data.matchScore);
          setMatchedSkills(data.matchedSkills);
          setMissingSkills(data.missingSkills);
        } else {
          setError(data.error || 'Failed to tailor CV');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    tailorCV();
  }, [userId, jobPostingId]);

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'enhanced':
        return 'bg-blue-50 border-blue-200';
      case 'added':
        return 'bg-green-50 border-green-200';
      case 'highlighted':
        return 'bg-yellow-50 border-yellow-200';
      case 'reordered':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'enhanced':
        return '✨';
      case 'added':
        return '➕';
      case 'highlighted':
        return '⭐';
      case 'reordered':
        return '🔄';
      default:
        return '•';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-700">Tailoring your CV for this job...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 flex items-start gap-4">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Tailored CV Preview
          </h1>
          <p className="text-lg text-gray-600">
            Your CV has been customized for this job position
          </p>
        </div>

        {/* Match Score Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Match Score */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mb-4">
                <span className="text-4xl font-bold text-white">{matchScore}%</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Match Score</h3>
              <p className="text-sm text-gray-600">How well your CV matches the job</p>
            </div>

            {/* Matched Skills */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="text-green-600" size={20} />
                Matched Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {matchedSkills.slice(0, 6).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {matchedSkills.length} skills matched
              </p>
            </div>

            {/* Missing Skills */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="text-orange-600" size={20} />
                Missing Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {missingSkills.slice(0, 6).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {missingSkills.length} skills to highlight
              </p>
            </div>
          </div>
        </div>

        {/* Changes Made */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes Made</h2>
          <div className="space-y-3">
            {changes.map((change, idx) => (
              <div
                key={idx}
                className={`p-4 border-l-4 rounded-lg ${getChangeColor(change.type)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getChangeIcon(change.type)}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {change.type.charAt(0).toUpperCase() + change.type.slice(1)} - {change.section}
                    </p>
                    <p className="text-gray-700 text-sm mt-1">{change.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CV Preview */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Tailored CV</h2>

          {tailoredCV && (
            <div className="space-y-6">
              {/* Personal Info */}
              {tailoredCV.personalInfo && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {tailoredCV.personalInfo.fullName}
                  </h3>
                  <p className="text-gray-600">
                    {tailoredCV.personalInfo.email} | {tailoredCV.personalInfo.phone} | {tailoredCV.personalInfo.location}
                  </p>
                </div>
              )}

              {/* Summary */}
              {tailoredCV.summary && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Professional Summary</h4>
                  <p className="text-gray-700">{tailoredCV.summary}</p>
                </div>
              )}

              {/* Skills */}
              {tailoredCV.technicalSkills?.skills && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Technical Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {tailoredCV.technicalSkills.skills.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {tailoredCV.experience && tailoredCV.experience.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Experience</h4>
                  <div className="space-y-3">
                    {tailoredCV.experience.map((exp: string, idx: number) => (
                      <p key={idx} className="text-gray-700 text-sm">
                        • {exp}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {tailoredCV.projects && tailoredCV.projects.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Projects</h4>
                  <div className="space-y-3">
                    {tailoredCV.projects.map((project: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded">
                        <p className="font-medium text-gray-900">{project.name}</p>
                        <p className="text-gray-700 text-sm mt-1">{project.description}</p>
                        {project.url && (
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-sm mt-2 inline-block hover:underline"
                          >
                            View Project →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <button className="flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition">
            <Download size={20} />
            Download CV
          </button>

          <button
            onClick={() => {
              if (onProceedToCoverLetter) {
                onProceedToCoverLetter(tailoredCVId);
              }
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Generate Cover Letter
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CVTailorPreview;
