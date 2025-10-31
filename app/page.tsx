'use client';

import { useState, useEffect } from 'react';
import TopicManager from '@/components/TopicManager';
import PostManager from '@/components/PostManager';
import StatsDashboard from '@/components/StatsDashboard';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'topics' | 'posts' | 'stats'>('topics');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🌐 SocialPost AI
          </h1>
          <p className="text-gray-600">
            Multi-Platform AI Content Automation System
          </p>
        </header>

        {/* Navigation Tabs */}
        <div className="mb-6 flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('topics')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'topics'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📝 Topics
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'posts'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Posts
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'stats'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📈 Statistics
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {activeTab === 'topics' && <TopicManager />}
          {activeTab === 'posts' && <PostManager />}
          {activeTab === 'stats' && <StatsDashboard />}
        </div>
      </div>
    </div>
  );
}

