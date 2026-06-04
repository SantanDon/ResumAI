/**
 * Cover Letter Preview Page
 * Displays generated cover letter with editing and quality score
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Download, Loader, ArrowRight, Edit2 } from 'lucide-react';

interface CoverLetterPreviewProps {
  userId: string;
  jobPostingId: string;
  jobTitle: string;
  companyName: string;
  onProceedToSend?: (coverLetterId: string, content: string) => void;
}

export const CoverLetterPreview: React.FC<CoverLetterPreviewProps> = ({
  userId,
  jobPostingId,
  jobTitle,
  companyName,
  onProceedToSend
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [editedCoverLetter, setEditedCoverLetter] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [matchedSkills, setMatchedSkills] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [coverLetterId, setCoverLetterId] = useState('');

  useEffect(() => {
    const generateCoverLetter = async () => {
      try {
        const response = await fetch('/api/cover-letter/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            jobTitle,
            companyName,
            tone: 'professional'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate cover letter');
        }

        const data = await response.json();
        if (data.success) {
          setCoverLetterId(data.coverLetterId);
          setCoverLetter(data.coverLetter);
          setEditedCoverLetter(data.coverLetter);
          setWordCount(data.wordCount);
          setMatchedSkills(data.matchedSkills);
          setSuggestions(data.suggestions);
        } else {
          setError(data.error || 'Failed to generate cover letter');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    generateCoverLetter();
  }, [userId, jobTitle, companyName]);

  const handleSaveEdit = () => {
    setCoverLetter(editedCoverLetter);
    setWordCount(editedCoverLetter.split(/\s+/).length);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedCoverLetter(coverLetter);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-700">Generating your cover letter...</p>
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Cover Letter Preview
          </h1>
          <p className="text-lg text-gray-600">
            Personalized for {jobTitle} at {companyName}
          </p>
        </div>

        {/* Quality Metrics */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Word Count */}
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{wordCount}</div>
              <p className="text-gray-600">Words</p>
              <p className="text-sm text-gray-500 mt-1">
                {wordCount >= 250 && wordCount <= 350 ? '✓ Ideal length' : 'Adjust to 250-350 words'}
              </p>
            </div>

            {/* Matched Skills */}
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">{matchedSkills.length}</div>
              <p className="text-gray-600">Skills Matched</p>
              <div className="flex flex-wrap gap-1 justify-center mt-2">
                {matchedSkills.slice(0, 3).map((skill, idx) => (
                  <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Quality Score */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 mb-2">
                <span className="text-3xl font-bold text-white">A</span>
              </div>
              <p className="text-gray-600">Quality Grade</p>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <CheckCircle size={20} />
              Suggestions for Improvement
            </h3>
            <ul className="space-y-2">
              {suggestions.map((suggestion, idx) => (
                <li key={idx} className="text-blue-800 flex gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cover Letter Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Cover Letter</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
              >
                <Edit2 size={18} />
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <textarea
                value={editedCoverLetter}
                onChange={(e) => setEditedCoverLetter(e.target.value)}
                className="w-full h-96 p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <div className="bg-gray-50 p-6 rounded-lg whitespace-pre-wrap text-gray-800 leading-relaxed">
                Dear Hiring Manager,

                {coverLetter}

                I have attached my resume for your review. I would welcome the opportunity to discuss how my skills and experience align with your team's needs.

                Thank you for considering my application. I look forward to hearing from you.

                Best regards,
                [Your Name]
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <button className="flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition">
            <Download size={20} />
            Download
          </button>

          <button
            onClick={() => {
              if (onProceedToSend) {
                onProceedToSend(coverLetterId, coverLetter);
              }
            }}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
          >
            Send Application
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterPreview;
