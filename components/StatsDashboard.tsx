'use client';

import { useState, useEffect } from 'react';

interface Stats {
  totalTopics: number;
  pendingTopics: number;
  generatedTopics: number;
  postedTopics: number;
  totalPosts: number;
  draftPosts: number;
  approvedPosts: number;
  scheduledPosts: number;
  postedPosts: number;
}

export default function StatsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const [topicsRes, postsRes] = await Promise.all([
        fetch('/api/topics'),
        fetch('/api/posts'),
      ]);

      const topicsData = await topicsRes.json();
      const postsData = await postsRes.json();

      if (topicsData.success && postsData.success) {
        const topics = topicsData.data;
        const posts = postsData.data;

        const newStats: Stats = {
          totalTopics: topics.length,
          pendingTopics: topics.filter((t: any) => t.status === 'pending').length,
          generatedTopics: topics.filter((t: any) => t.status === 'generated').length,
          postedTopics: topics.filter((t: any) => t.status === 'posted').length,
          totalPosts: posts.length,
          draftPosts: posts.filter((p: any) => p.status === 'draft').length,
          approvedPosts: posts.filter((p: any) => p.status === 'approved').length,
          scheduledPosts: posts.filter((p: any) => p.status === 'scheduled').length,
          postedPosts: posts.filter((p: any) => p.status === 'posted').length,
        };

        setStats(newStats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading statistics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load statistics</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Statistics Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Topics Stats */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">📝 Topics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Total:</span>
              <span className="font-bold text-blue-900">{stats.totalTopics}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Pending:</span>
              <span className="font-bold text-yellow-700">{stats.pendingTopics}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Generated:</span>
              <span className="font-bold text-blue-700">{stats.generatedTopics}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Posted:</span>
              <span className="font-bold text-green-700">{stats.postedTopics}</span>
            </div>
          </div>
        </div>

        {/* Posts Stats */}
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">📊 Posts</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Total:</span>
              <span className="font-bold text-green-900">{stats.totalPosts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Draft:</span>
              <span className="font-bold text-yellow-700">{stats.draftPosts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Approved:</span>
              <span className="font-bold text-blue-700">{stats.approvedPosts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Scheduled:</span>
              <span className="font-bold text-purple-700">{stats.scheduledPosts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Posted:</span>
              <span className="font-bold text-green-700">{stats.postedPosts}</span>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-4">⚙️ System</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">AI Provider:</span>
              <span className="font-bold text-purple-900">
                {process.env.NEXT_PUBLIC_AI_PROVIDER || 'helagpt'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Posts/Day:</span>
              <span className="font-bold text-purple-900">
                {process.env.NEXT_PUBLIC_POSTS_PER_DAY || '2'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Scheduler:</span>
              <span className="font-bold text-green-700">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Quick Actions</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Refresh Stats
          </button>
        </div>
      </div>
    </div>
  );
}

