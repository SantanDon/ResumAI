/**
 * Application History Page
 * View all sent applications and their status
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader, Download, Eye, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Application {
  id: string;
  job_posting_id: string;
  recruiter_email: string;
  status: 'draft' | 'ready' | 'sent' | 'rejected' | 'interview' | 'offer';
  sent_at?: string;
  created_at: string;
}

interface ApplicationHistoryPageProps {
  userId: string;
}

export const ApplicationHistoryPage: React.FC<ApplicationHistoryPageProps> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState<'all' | 'sent' | 'interview' | 'offer'>('all');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch(`/api/applications/user/${userId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }

        const data = await response.json();
        if (data.success) {
          setApplications(data.applications);
        } else {
          setError(data.error || 'Failed to fetch applications');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [userId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Clock className="text-blue-600" size={20} />;
      case 'interview':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'offer':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'rejected':
        return <XCircle className="text-red-600" size={20} />;
      default:
        return <Clock className="text-gray-600" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-green-100 text-green-800';
      case 'offer':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Sent';
      case 'interview':
        return 'Interview Scheduled';
      case 'offer':
        return 'Offer Received';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Draft';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const stats = {
    total: applications.length,
    sent: applications.filter(a => a.status === 'sent').length,
    interviews: applications.filter(a => a.status === 'interview').length,
    offers: applications.filter(a => a.status === 'offer').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-700">Loading applications...</p>
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
            Application History
          </h1>
          <p className="text-lg text-gray-600">
            Track all your job applications and their status
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-gray-600 mt-1">Total Applications</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600">{stats.sent}</div>
            <p className="text-gray-600 mt-1">Sent</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600">{stats.interviews}</div>
            <p className="text-gray-600 mt-1">Interviews</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-emerald-600">{stats.offers}</div>
            <p className="text-gray-600 mt-1">Offers</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6 p-4 flex gap-2 flex-wrap">
          {(['all', 'sent', 'interview', 'offer'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'All' : f === 'interview' ? 'Interviews' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6 flex items-start gap-4">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-lg text-gray-600 mb-4">
              {filter === 'all'
                ? 'No applications yet. Start by parsing a job posting!'
                : `No ${filter} applications yet.`}
            </p>
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">
              Find Jobs
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map(app => (
              <div
                key={app.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Main Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(app.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(app.status)}`}>
                        {getStatusLabel(app.status)}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-2">
                      To: <span className="text-blue-600 font-medium">{app.recruiter_email}</span>
                    </p>

                    <p className="text-gray-500 text-sm">
                      Sent: {app.sent_at ? formatDate(app.sent_at) : 'Not sent yet'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      title="View Details"
                      className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-gray-900"
                    >
                      <Eye size={20} />
                    </button>

                    <button
                      title="Download CV"
                      className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-gray-900"
                    >
                      <Download size={20} />
                    </button>

                    <button
                      title="Delete"
                      className="p-2 hover:bg-red-100 rounded-lg transition text-gray-600 hover:text-red-600"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Export Button */}
        {applications.length > 0 && (
          <div className="mt-8 text-center">
            <button className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition">
              Export as CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationHistoryPage;
