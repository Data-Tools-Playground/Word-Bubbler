'use client';

import React, { useState, useEffect } from 'react';
import { ProfileService } from '@/services/profileService';
import {
  RespondentProfile,
  ProfileSummary,
  ProfileFilter,
  LongitudinalInsight,
  OpinionLeaderInsight,
} from '@/types/profiles';

interface ProfileManagementProps {
  sessionId?: string; // Optional: filter to specific session
}

const ProfileManagement: React.FC<ProfileManagementProps> = ({ sessionId }) => {
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ProfileSummary | null>(null);
  const [longitudinalData, setLongitudinalData] = useState<LongitudinalInsight | null>(null);
  const [opinionLeaders, setOpinionLeaders] = useState<OpinionLeaderInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profiles' | 'insights' | 'leaders'>('profiles');

  // Filter state
  const [filter, setFilter] = useState<ProfileFilter>({
    isActive: true,
    responseCountRange: [1, 1000],
  });

  const [searchText, setSearchText] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'responses' | 'sentiment'>('recent');

  useEffect(() => {
    loadProfiles();
    if (activeTab === 'leaders') {
      loadOpinionLeaders();
    }
  }, [filter, activeTab, sessionId]);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const searchFilter = {
        ...filter,
        searchText: searchText.trim() || undefined,
        tags: tagFilter.trim() ? [tagFilter.trim()] : undefined,
      };

      const profileData = await ProfileService.getProfiles(searchFilter);

      // Sort profiles
      let sortedProfiles = [...profileData];
      switch (sortBy) {
        case 'responses':
          sortedProfiles.sort((a, b) => b.totalResponses - a.totalResponses);
          break;
        case 'sentiment':
          sortedProfiles.sort((a, b) => (b.avgSentiment || 0) - (a.avgSentiment || 0));
          break;
        default: // recent
          sortedProfiles.sort((a, b) =>
            new Date(b.lastResponseDate || b.createdAt).getTime() -
            new Date(a.lastResponseDate || a.createdAt).getTime()
          );
      }

      setProfiles(sortedProfiles);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOpinionLeaders = async () => {
    try {
      const leaders = await ProfileService.getOpinionLeaderInsights(sessionId);
      setOpinionLeaders(leaders.slice(0, 10)); // Top 10
    } catch (error) {
      console.error('Error loading opinion leaders:', error);
    }
  };

  const loadLongitudinalData = async (profileId: string) => {
    try {
      const data = await ProfileService.getLongitudinalInsights(profileId);
      setLongitudinalData(data);
    } catch (error) {
      console.error('Error loading longitudinal data:', error);
    }
  };

  const handleProfileSelect = (profile: ProfileSummary) => {
    setSelectedProfile(profile);
    loadLongitudinalData(profile.id);
  };

  const handleAddTag = async (profileId: string, tagName: string) => {
    try {
      await ProfileService.addProfileTag(profileId, tagName, 'manual', undefined, 'admin');
      loadProfiles(); // Refresh
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const handleRemoveTag = async (profileId: string, tagName: string) => {
    try {
      await ProfileService.removeProfileTag(profileId, tagName, 'manual');
      loadProfiles(); // Refresh
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const getSentimentColor = (sentiment?: number) => {
    if (!sentiment) return 'text-gray-500';
    if (sentiment > 0.1) return 'text-green-600';
    if (sentiment < -0.1) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getSentimentLabel = (sentiment?: number) => {
    if (!sentiment) return 'Neutral';
    if (sentiment > 0.1) return 'Positive';
    if (sentiment < -0.1) return 'Negative';
    return 'Neutral';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Profile Management & Evolution
        </h1>
        <p className="text-gray-600">
          Track participant engagement, behavior patterns, and longitudinal insights across sessions.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'profiles', label: '👥 Profiles', count: profiles.length },
            { id: 'insights', label: '📊 Insights', count: selectedProfile ? 1 : 0 },
            { id: 'leaders', label: '🌟 Opinion Leaders', count: opinionLeaders.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Profiles Tab */}
      {activeTab === 'profiles' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters & Profile List */}
          <div className="lg:col-span-2">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Filters & Search</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Phone, name, or notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
                  <input
                    type="text"
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    placeholder="Filter by tag..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="responses">Most Responses</option>
                    <option value="sentiment">Best Sentiment</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-4">
                <button
                  onClick={loadProfiles}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Apply Filters
                </button>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="activeOnly"
                    checked={filter.isActive}
                    onChange={(e) => setFilter({ ...filter, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="activeOnly" className="text-sm text-gray-700">Active profiles only</label>
                </div>
              </div>
            </div>

            {/* Profile List */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Participant Profiles ({profiles.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">Loading profiles...</div>
                ) : profiles.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No profiles found</div>
                ) : (
                  profiles.map((profile) => (
                    <div
                      key={profile.id}
                      onClick={() => handleProfileSelect(profile)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedProfile?.id === profile.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {profile.displayName || 'Anonymous'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatPhoneNumber(profile.phoneNumber)}
                            </span>
                            {!profile.isActive && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Inactive</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span>{profile.totalResponses} responses</span>
                            <span>{profile.sessionsParticipated} sessions</span>
                            <span className={getSentimentColor(profile.avgSentiment)}>
                              {getSentimentLabel(profile.avgSentiment)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {profile.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 text-right">
                          <div>
                            Last: {profile.lastResponseDate
                              ? new Date(profile.lastResponseDate).toLocaleDateString()
                              : 'Never'
                            }
                          </div>
                          <div>
                            Joined: {new Date(profile.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-1">
            {selectedProfile ? (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Details</h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Display Name</label>
                    <p className="text-gray-900">{selectedProfile.displayName || 'Not set'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                    <p className="text-gray-900">{formatPhoneNumber(selectedProfile.phoneNumber)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{selectedProfile.email || 'Not provided'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Total Responses</label>
                      <p className="text-2xl font-bold text-blue-600">{selectedProfile.totalResponses}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Sessions</label>
                      <p className="text-2xl font-bold text-green-600">{selectedProfile.sessionsParticipated}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Average Sentiment</label>
                    <p className={`text-lg font-semibold ${getSentimentColor(selectedProfile.avgSentiment)}`}>
                      {getSentimentLabel(selectedProfile.avgSentiment)}
                      {selectedProfile.avgSentiment && ` (${selectedProfile.avgSentiment.toFixed(2)})`}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Tags</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedProfile.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded cursor-pointer hover:bg-red-100 hover:text-red-800"
                          onClick={() => handleRemoveTag(selectedProfile.id, tag)}
                          title="Click to remove"
                        >
                          {tag} ×
                        </span>
                      ))}
                    </div>

                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Add new tag..."
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const target = e.target as HTMLInputElement;
                            const tagName = target.value.trim();
                            if (tagName) {
                              handleAddTag(selectedProfile.id, tagName);
                              target.value = '';
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <button
                      onClick={() => setActiveTab('insights')}
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 text-sm font-medium"
                    >
                      View Longitudinal Insights
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">👥</div>
                <p>Select a profile to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          {selectedProfile && longitudinalData ? (
            <>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Longitudinal Analysis: {selectedProfile.displayName}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{longitudinalData.sessionCount}</div>
                    <div className="text-sm text-blue-800">Sessions</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{longitudinalData.responseCount}</div>
                    <div className="text-sm text-green-800">Total Responses</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600 capitalize">
                      {longitudinalData.engagementPattern}
                    </div>
                    <div className="text-sm text-purple-800">Engagement Pattern</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {longitudinalData.sentimentTrend.length > 0 ?
                        longitudinalData.sentimentTrend[longitudinalData.sentimentTrend.length - 1].avgSentiment.toFixed(2) :
                        'N/A'
                      }
                    </div>
                    <div className="text-sm text-yellow-800">Latest Sentiment</div>
                  </div>
                </div>

                {/* Sentiment Trend */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Sentiment Evolution</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {longitudinalData.sentimentTrend.length > 0 ? (
                      <div className="space-y-2">
                        {longitudinalData.sentimentTrend.map((point, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {new Date(point.sessionDate).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className={`w-20 h-2 rounded-full bg-gray-200 relative`}>
                                <div
                                  className={`h-full rounded-full ${
                                    point.avgSentiment > 0 ? 'bg-green-500' :
                                    point.avgSentiment < 0 ? 'bg-red-500' : 'bg-yellow-500'
                                  }`}
                                  style={{ width: `${Math.abs(point.avgSentiment) * 50 + 50}%` }}
                                />
                              </div>
                              <span className={getSentimentColor(point.avgSentiment)}>
                                {point.avgSentiment.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center">No sentiment data available</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p>Select a profile from the Profiles tab to view longitudinal insights</p>
            </div>
          )}
        </div>
      )}

      {/* Opinion Leaders Tab */}
      {activeTab === 'leaders' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Opinion Leaders & Influencers</h3>
            <p className="text-gray-600 mt-1">
              Participants with high influence scores, unique contributions, and consistent engagement.
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {opinionLeaders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">🌟</div>
                <p>No opinion leaders identified yet</p>
                <p className="text-sm mt-1">Leaders are identified based on response patterns and influence metrics</p>
              </div>
            ) : (
              opinionLeaders.map((leader, index) => (
                <div key={leader.profileId} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="text-2xl font-bold text-yellow-600 min-w-[2rem]">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-900">
                            {leader.profile.displayName || 'Anonymous'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatPhoneNumber(leader.profile.phoneNumber)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Influence Score</span>
                            <div className="font-semibold text-purple-600">
                              {(leader.influenceScore * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Unique Contributions</span>
                            <div className="font-semibold text-blue-600">{leader.uniqueContributions}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Consistency</span>
                            <div className="font-semibold text-green-600">
                              {(leader.consistencyScore * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Total Responses</span>
                            <div className="font-semibold text-gray-900">{leader.profile.totalResponses}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedProfile(leader.profile as ProfileSummary);
                        setActiveTab('insights');
                        loadLongitudinalData(leader.profileId);
                      }}
                      className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileManagement;