'use client';

import { useState, useEffect } from 'react';

type Platform = 'linkedin' | 'facebook' | 'instagram' | 'x' | 'tiktok';

interface Topic {
  _id: string;
  title: string;
  description?: string;
  status: 'pending' | 'generating' | 'generated' | 'posted';
  platforms?: string[];
  createdAt: string;
}

export default function TopicManager() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '',
    platforms: ['linkedin', 'facebook', 'instagram', 'x'] as Platform[]
  });

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/topics');
      const result = await response.json();
      if (result.success) {
        setTopics(result.data);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          platforms: formData.platforms,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setFormData({ title: '', description: '', platforms: ['linkedin', 'facebook', 'instagram', 'x'] });
        setShowForm(false);
        fetchTopics();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating topic:', error);
      alert('Failed to create topic');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;

    try {
      const response = await fetch(`/api/topics?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        fetchTopics();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert('Failed to delete topic');
    }
  };

  const handlePlatformToggle = (platform: Platform) => {
    setFormData(prev => {
      const platforms = prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform];
      return { ...prev, platforms };
    });
  };

  const handleGeneratePost = async (topicId: string, platforms?: string[]) => {
    setLoading(true);
    try {
      const response = await fetch('/api/posts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, platforms }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`Generated ${result.data?.length || 0} posts for ${platforms?.length || 0} platforms! Check the Posts tab.`);
        fetchTopics();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error generating post:', error);
      alert('Failed to generate posts');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted':
        return 'bg-green-100 text-green-800';
      case 'generated':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Topic Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Topic'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Next.js server actions"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Additional context or details..."
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platforms *
            </label>
            <div className="flex flex-wrap gap-2">
              {(['linkedin', 'facebook', 'instagram', 'x', 'tiktok'] as Platform[]).map((platform) => (
                <label
                  key={platform}
                  className={`flex items-center px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    formData.platforms.includes(platform)
                      ? 'bg-primary-100 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.platforms.includes(platform)}
                    onChange={() => handlePlatformToggle(platform)}
                    className="mr-2"
                  />
                  <span className="capitalize">{platform === 'x' ? 'X (Twitter)' : platform}</span>
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || formData.platforms.length === 0}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Topic'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {topics.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No topics yet. Add one to get started!</p>
        ) : (
          topics.map((topic) => (
            <div
              key={topic._id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {topic.title}
                  </h3>
                  {topic.description && (
                    <p className="text-gray-600 text-sm mb-2">{topic.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        topic.status
                      )}`}
                    >
                      {topic.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(topic.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4 flex-wrap">
                  {topic.platforms && topic.platforms.length > 0 && (
                    <div className="flex gap-1 mb-2">
                      {topic.platforms.map((platform) => (
                        <span
                          key={platform}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize"
                        >
                          {platform === 'x' ? 'X' : platform}
                        </span>
                      ))}
                    </div>
                  )}
                  {(topic.status === 'pending' || topic.status === 'generating') && (
                    <button
                      onClick={() => handleGeneratePost(topic._id, topic.platforms)}
                      disabled={loading || topic.status === 'generating'}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {topic.status === 'generating' ? 'Generating...' : 'Generate Posts'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(topic._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

