'use client';

import { useState, useEffect } from 'react';

type Platform = 'linkedin' | 'facebook' | 'instagram' | 'x' | 'tiktok';

interface Post {
  _id: string;
  platform: Platform;
  topicId: {
    _id: string;
    title: string;
  };
  content: string;
  hashtags: string[];
  videoScript?: string;
  status: 'draft' | 'scheduled' | 'posted' | 'approved';
  scheduledTime?: string;
  postedAt?: string;
  linkedInPostId?: string;
  facebookPostId?: string;
  instagramPostId?: string;
  xPostId?: string;
  tiktokPostId?: string;
  createdAt: string;
}

export default function PostManager() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editForm, setEditForm] = useState({ content: '', hashtags: [] as string[] });

  useEffect(() => {
    fetchPosts();
  }, [filter, platformFilter]);

  const fetchPosts = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (platformFilter !== 'all') params.append('platform', platformFilter);
      
      const url = `/api/posts${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        setPosts(result.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const getPlatformName = (platform: Platform): string => {
    const names: Record<Platform, string> = {
      linkedin: 'LinkedIn',
      facebook: 'Facebook',
      instagram: 'Instagram',
      x: 'X (Twitter)',
      tiktok: 'TikTok',
    };
    return names[platform];
  };

  const getPlatformColor = (platform: Platform): string => {
    const colors: Record<Platform, string> = {
      linkedin: 'bg-blue-600',
      facebook: 'bg-blue-800',
      instagram: 'bg-pink-600',
      x: 'bg-black',
      tiktok: 'bg-gray-900',
    };
    return colors[platform];
  };

  const getPostUrl = (post: Post): string | null => {
    if (post.status !== 'posted') return null;
    
    switch (post.platform) {
      case 'linkedin':
        return post.linkedInPostId ? `https://www.linkedin.com/feed/update/${post.linkedInPostId}` : null;
      case 'facebook':
        return post.facebookPostId ? `https://www.facebook.com/${post.facebookPostId}` : null;
      case 'instagram':
        return post.instagramPostId ? `https://www.instagram.com/p/${post.instagramPostId}` : null;
      case 'x':
        return post.xPostId ? `https://twitter.com/i/web/status/${post.xPostId}` : null;
      case 'tiktok':
        return post.tiktokPostId ? `https://www.tiktok.com/@yourusername/video/${post.tiktokPostId}` : null;
      default:
        return null;
    }
  };

  const handlePublish = async (postId: string) => {
    const post = posts.find(p => p._id === postId);
    if (!post) return;
    
    if (!confirm(`Are you sure you want to publish this post to ${getPlatformName(post.platform)}?`)) return;

    setLoading(true);
    try {
      const response = await fetch('/api/posts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`Post published successfully to ${getPlatformName(result.platform)}!`);
        fetchPosts();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('Failed to publish post');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setEditForm({
      content: post.content,
      hashtags: post.hashtags,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;

    setLoading(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPost._id,
          content: editForm.content,
          hashtags: editForm.hashtags,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setEditingPost(null);
        fetchPosts();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/posts?id=${postId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        fetchPosts();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const handleApprove = async (postId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: postId,
          status: 'approved',
        }),
      });

      const result = await response.json();
      if (result.success) {
        fetchPosts();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error approving post:', error);
      alert('Failed to approve post');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Post Management</h2>
        <div className="flex gap-2">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Platforms</option>
            <option value="linkedin">LinkedIn</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="x">X (Twitter)</option>
            <option value="tiktok">TikTok</option>
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Posts</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="scheduled">Scheduled</option>
            <option value="posted">Posted</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No posts yet. Generate posts from topics!</p>
        ) : (
          posts.map((post) => (
            <div
              key={post._id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              {editingPost?._id === post._id ? (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content
                    </label>
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      rows={6}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hashtags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={editForm.hashtags.join(', ')}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          hashtags: e.target.value.split(',').map((h) => h.trim()),
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Nextjs, Nodejs, AI"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={loading}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingPost(null)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {post.topicId?.title || 'Unknown Topic'}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium text-white ${getPlatformColor(
                            post.platform
                          )}`}
                        >
                          {getPlatformName(post.platform)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            post.status
                          )}`}
                        >
                          {post.status}
                        </span>
                        {post.postedAt && (
                          <span className="text-xs text-gray-500">
                            Posted: {new Date(post.postedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {post.videoScript && (
                        <div className="mt-2 p-2 bg-purple-50 rounded text-sm">
                          <strong>Video Script:</strong>
                          <pre className="whitespace-pre-wrap text-xs mt-1">{post.videoScript}</pre>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-700 whitespace-pre-line mb-2">{post.content}</p>
                    {post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {post.hashtags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-sm"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {post.status === 'draft' && (
                      <button
                        onClick={() => handleApprove(post._id)}
                        disabled={loading}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {post.status === 'approved' && (
                      <button
                        onClick={() => handlePublish(post._id)}
                        disabled={loading}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        Publish Now
                      </button>
                    )}
                    {post.status !== 'posted' && (
                      <button
                        onClick={() => handleEdit(post)}
                        className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    {post.status !== 'posted' && (
                      <button
                        onClick={() => handleDelete(post._id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                    {getPostUrl(post) && (
                      <a
                        href={getPostUrl(post)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        View on {getPlatformName(post.platform)}
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

