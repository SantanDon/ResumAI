/**
 * Job Input Page
 * Allows users to paste job descriptions and extract key information
 */

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface JobDetails {
  title: string;
  company: string;
  location: string;
  salary?: string;
  requirements: string[];
  skills: string[];
  recruiterEmail?: string;
}

interface JobInputPageProps {
  userId: string;
  onJobParsed?: (jobPostingId: string, jobDetails: JobDetails) => void;
}

export const JobInputPage: React.FC<JobInputPageProps> = ({ userId, onJobParsed }) => {
  const [jobText, setJobText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [jobPostingId, setJobPostingId] = useState('');

  const handleParseJob = async () => {
    if (!jobText.trim()) {
      setError('Please paste a job description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/jobs/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, jobText })
      });

      if (!response.ok) {
        throw new Error('Failed to parse job posting');
      }

      const data = await response.json();
      if (data.success) {
        setJobPostingId(data.jobPostingId);
        setJobDetails(data.jobPosting);
        
        if (onJobParsed) {
          onJobParsed(data.jobPostingId, data.jobPosting);
        }
      } else {
        setError(data.error || 'Failed to parse job posting');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setJobText('');
    setJobDetails(null);
    setJobPostingId('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Job Application Assistant
          </h1>
          <p className="text-lg text-gray-600">
            Paste a job description to get started with your tailored application
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Paste Job Description
            </h2>

            <textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Paste the complete job description here..."
              className="w-full h-64 p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
            />

            {error && (
              <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded flex items-start gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleParseJob}
                disabled={loading || !jobText.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Parsing...
                  </>
                ) : (
                  'Parse Job Description'
                )}
              </button>

              <button
                onClick={handleClear}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Extracted Information
            </h2>

            {jobDetails ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-green-700 font-medium">Job details extracted successfully</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Job Title
                  </label>
                  <p className="text-lg text-gray-900 font-medium">{jobDetails.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Company
                  </label>
                  <p className="text-lg text-gray-900 font-medium">{jobDetails.company}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Location
                    </label>
                    <p className="text-gray-900">{jobDetails.location}</p>
                  </div>
                  {jobDetails.salary && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Salary
                      </label>
                      <p className="text-gray-900">{jobDetails.salary}</p>
                    </div>
                  )}
                </div>

                {jobDetails.recruiterEmail && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Recruiter Email
                    </label>
                    <p className="text-blue-600 break-all">{jobDetails.recruiterEmail}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Required Skills ({jobDetails.skills.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {jobDetails.skills.slice(0, 8).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {jobDetails.skills.length > 8 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                        +{jobDetails.skills.length - 8} more
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Key Requirements ({jobDetails.requirements.length})
                  </label>
                  <ul className="space-y-2 max-h-40 overflow-y-auto">
                    {jobDetails.requirements.slice(0, 5).map((req, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                    {jobDetails.requirements.length > 5 && (
                      <li className="text-sm text-gray-600 italic">
                        +{jobDetails.requirements.length - 5} more requirements
                      </li>
                    )}
                  </ul>
                </div>

                <button
                  onClick={() => {
                    if (onJobParsed) {
                      onJobParsed(jobPostingId, jobDetails);
                    }
                  }}
                  className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  Proceed to Tailor CV
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  Paste a job description and click "Parse Job Description" to see extracted information here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobInputPage;
