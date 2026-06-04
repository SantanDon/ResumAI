/**
 * Send Application Page
 * Final step: compose email and send application
 */

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Loader, Send, ArrowLeft } from 'lucide-react';

interface SendApplicationPageProps {
  userId: string;
  jobPostingId: string;
  tailoredCVId: string;
  coverLetterId: string;
  recruiterEmail: string;
  jobTitle: string;
  companyName: string;
  onBack?: () => void;
  onSuccess?: (applicationId: string) => void;
}

export const SendApplicationPage: React.FC<SendApplicationPageProps> = ({
  userId,
  jobPostingId,
  tailoredCVId,
  coverLetterId,
  recruiterEmail,
  jobTitle,
  companyName,
  onBack,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [emailSubject, setEmailSubject] = useState(
    `Application for ${jobTitle} Position at ${companyName}`
  );
  const [emailBody, setEmailBody] = useState(
    `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${jobTitle} position at ${companyName}.\n\nPlease find my resume attached for your review.\n\nThank you for considering my application.\n\nBest regards`
  );

  const handleSendApplication = async () => {
    if (!recruiterEmail) {
      setError('Recruiter email is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/applications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          jobPostingId,
          tailoredCVId,
          coverLetterId,
          recruiterEmail
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send application');
      }

      const data = await response.json();
      if (data.success) {
        setApplicationId(data.applicationId);
        setSuccess(true);

        if (onSuccess) {
          onSuccess(data.applicationId);
        }
      } else {
        setError(data.error || 'Failed to send application');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-12">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-6">
              <CheckCircle className="text-green-600" size={48} />
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Application Sent Successfully!
            </h1>

            <p className="text-lg text-gray-600 mb-6">
              Your application for the <strong>{jobTitle}</strong> position at{' '}
              <strong>{companyName}</strong> has been sent to {recruiterEmail}.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
              <ul className="text-blue-800 space-y-2">
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Check your email for confirmation</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Keep an eye on your inbox for recruiter responses</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>You can track this application in your history</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/applications'}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                View All Applications
              </button>

              <button
                onClick={() => window.location.href = '/job-search'}
                className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
              >
                Find More Jobs
              </button>
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
        <div className="mb-8 flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-white rounded-lg transition"
            >
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
          )}
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Send Application
            </h1>
            <p className="text-lg text-gray-600">
              Final step: review and send your application
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Summary */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Application Summary
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Position
                  </label>
                  <p className="text-lg text-gray-900">{jobTitle}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Company
                  </label>
                  <p className="text-lg text-gray-900">{companyName}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Recruiter Email
                  </label>
                  <p className="text-lg text-blue-600 break-all">{recruiterEmail}</p>
                </div>
              </div>
            </div>

            {/* Email Composition */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Email Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Body
                  </label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full h-48 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Attachments
              </h2>

              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="text-green-800 font-medium">Tailored CV (PDF)</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="text-green-800 font-medium">Cover Letter</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 flex items-start gap-4">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSendApplication}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition text-lg"
            >
              {loading ? (
                <>
                  <Loader size={24} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={24} />
                  Send Application
                </>
              )}
            </button>
          </div>

          {/* Sidebar - Checklist */}
          <div className="bg-white rounded-lg shadow-lg p-6 h-fit">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Application Checklist
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600" size={20} />
                <span className="text-gray-700">Job parsed</span>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600" size={20} />
                <span className="text-gray-700">CV tailored</span>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600" size={20} />
                <span className="text-gray-700">Cover letter generated</span>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600" size={20} />
                <span className="text-gray-700">Email ready</span>
              </div>

              <div className="border-t pt-3 mt-3">
                <p className="text-sm text-gray-600">
                  ✓ All set! Click "Send Application" to submit your application.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendApplicationPage;
