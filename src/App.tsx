/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Instagram, 
  ShieldAlert, 
  ShieldCheck, 
  Settings, 
  Moon, 
  Sun, 
  Send, 
  Trash2, 
  BarChart3, 
  Lock, 
  Unlock,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Heart,
  Share2,
  Bookmark,
  MoreHorizontal,
  Flag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Modality } from "@google/genai";
import { detectBullying, DetectionResult } from './utils/detector';
import { Comment, Post, AppState } from './types';

const ADMIN_PASSWORD = "vimal428100@";

const INITIAL_POSTS: Post[] = [
  {
    id: 'p1',
    username: 'nature_explorer',
    avatar: 'https://picsum.photos/seed/nature/100/100',
    imageUrl: 'https://picsum.photos/seed/forest/1080/1080',
    caption: 'Lost in the beauty of the deep forest. 🌲✨ #nature #peace',
    likes: 1248,
    timestamp: Date.now() - 7200000,
    comments: [
      {
        id: '1',
        username: 'alex_j',
        avatar: 'https://picsum.photos/seed/alex/100/100',
        text: 'This sunset is absolutely beautiful!',
        timestamp: Date.now() - 3600000,
        isBullying: false,
        score: 0,
        confidence: 100,
        label: 'Non-Bullying'
      },
      {
        id: '2',
        username: 'toxic_user',
        avatar: 'https://picsum.photos/seed/toxic/100/100',
        text: 'You are so stupid and ugly, why do you even post?',
        timestamp: Date.now() - 1800000,
        isBullying: true,
        score: 0.45,
        confidence: 85,
        label: 'Bullying'
      }
    ]
  },
  {
    id: 'p2',
    username: 'city_vibes',
    avatar: 'https://picsum.photos/seed/city/100/100',
    imageUrl: 'https://picsum.photos/seed/tokyo/1080/1080',
    caption: 'Tokyo nights are something else. 🌃✨ #travel #tokyo',
    likes: 3452,
    timestamp: Date.now() - 14400000,
    comments: [
      {
        id: '3',
        username: 'traveler_sam',
        avatar: 'https://picsum.photos/seed/sam/100/100',
        text: 'I miss this place so much!',
        timestamp: Date.now() - 7200000,
        isBullying: false,
        score: 0,
        confidence: 100,
        label: 'Non-Bullying'
      }
    ]
  },
  {
    id: 'p3',
    username: 'tech_guru',
    avatar: 'https://picsum.photos/seed/tech/100/100',
    imageUrl: 'https://picsum.photos/seed/setup/1080/1080',
    caption: 'New setup is finally complete! 💻🔥 #setup #coding',
    likes: 892,
    timestamp: Date.now() - 21600000,
    comments: []
  },
  {
    id: 'p4',
    username: 'foodie_life',
    avatar: 'https://picsum.photos/seed/food/100/100',
    imageUrl: 'https://picsum.photos/seed/pasta/1080/1080',
    caption: 'Best pasta in town! 🍝🇮🇹 #foodie #italy',
    likes: 2105,
    timestamp: Date.now() - 28800000,
    comments: [
      {
        id: '4',
        username: 'hungry_joe',
        avatar: 'https://picsum.photos/seed/joe/100/100',
        text: 'Looks delicious!',
        timestamp: Date.now() - 14400000,
        isBullying: false,
        score: 0,
        confidence: 100,
        label: 'Non-Bullying'
      }
    ]
  },
  {
    id: 'p5',
    username: 'fitness_motivation',
    avatar: 'https://picsum.photos/seed/gym/100/100',
    imageUrl: 'https://picsum.photos/seed/workout/1080/1080',
    caption: 'Morning workout done! 💪🔥 #fitness #health',
    likes: 1567,
    timestamp: Date.now() - 36000000,
    comments: []
  }
];

export default function App() {
  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem('cyber_bullying_posts');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('cyber_bullying_theme');
    return saved === 'dark';
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [inputTexts, setInputTexts] = useState<Record<string, string>>({});
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState<'feed' | 'admin'>('feed');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' }), []);

  const speakWarning = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: 'You were crossing the limits, severe action will be taken.' }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Puck' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        // Gemini TTS returns raw PCM (L16) at 24kHz. We need to wrap it in a WAV header to play it.
        const binaryString = window.atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // WAV Header
        const wavHeader = new Uint8Array(44);
        const view = new DataView(wavHeader.buffer);
        
        // RIFF identifier
        view.setUint32(0, 0x52494646, false); // "RIFF"
        // file length
        view.setUint32(4, 36 + len, true);
        // RIFF type
        view.setUint32(8, 0x57415645, false); // "WAVE"
        // format chunk identifier
        view.setUint32(12, 0x666d7420, false); // "fmt "
        // format chunk length
        view.setUint32(16, 16, true);
        // sample format (raw)
        view.setUint16(20, 1, true);
        // channel count
        view.setUint16(22, 1, true);
        // sample rate
        view.setUint32(24, 24000, true);
        // byte rate (sample rate * block align)
        view.setUint32(28, 24000 * 2, true);
        // block align (channel count * bytes per sample)
        view.setUint16(32, 2, true);
        // bits per sample
        view.setUint16(34, 16, true);
        // data chunk identifier
        view.setUint32(36, 0x64617461, false); // "data"
        // data chunk length
        view.setUint32(40, len, true);

        const blob = new Blob([wavHeader, bytes], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        await audio.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      const utterance = new SpeechSynthesisUtterance("You were crossing the limits, severe action will be taken.");
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    localStorage.setItem('cyber_bullying_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('cyber_bullying_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handlePostComment = (postId: string) => {
    const text = inputTexts[postId] || '';
    if (!text.trim()) return;

    const result = detectBullying(text);
    
    if (result.isBullying) {
      speakWarning();
    }
    
    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      username: 'current_user',
      avatar: 'https://picsum.photos/seed/user/100/100',
      text: text,
      timestamp: Date.now(),
      isBullying: result.isBullying,
      score: result.score,
      confidence: result.confidence,
      label: result.label
    };

    setPosts(posts.map(post => {
      if (post.id === postId) {
        return { ...post, comments: [newComment, ...post.comments] };
      }
      return post;
    }));
    
    setInputTexts({ ...inputTexts, [postId]: '' });
  };

  const deleteComment = (commentId: string) => {
    setPosts(posts.map(post => ({
      ...post,
      comments: post.comments.filter(c => c.id !== commentId)
    })));
  };

  const allComments = useMemo(() => {
    return posts.flatMap(post => post.comments);
  }, [posts]);

  const stats = useMemo(() => {
    const total = allComments.length;
    const bullying = allComments.filter(c => c.isBullying).length;
    const safe = total - bullying;
    const bullyingPercent = total > 0 ? (bullying / total) * 100 : 0;
    const safePercent = total > 0 ? (safe / total) * 100 : 0;

    return { total, bullying, safe, bullyingPercent, safePercent };
  }, [allComments]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setActiveTab('admin');
      setPasswordInput('');
    } else {
      alert('Incorrect password!');
    }
  };

  const handleReport = (id: string) => {
    setPosts(posts.map(post => ({
      ...post,
      comments: post.comments.map(c => 
        c.id === id ? { ...c, isReported: true } : c
      )
    })));
    alert('Thank you for your report. Our moderation team will review this comment shortly.');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 border-b ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-zinc-200'} backdrop-blur-md`}>
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg instagram-gradient flex items-center justify-center text-white">
              <ShieldAlert size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Cyber Bullying Detection Project</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-full p-1 border border-zinc-200 dark:border-zinc-700">
              <a 
                href="https://bully-detector.netlify.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-indigo-500 transition-colors"
              >
                Model 1
              </a>
              <button 
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-zinc-700 text-indigo-500 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-600"
              >
                Model 2
              </button>
            </div>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <button 
              onClick={() => {
                if (isAdmin) {
                  setActiveTab(activeTab === 'admin' ? 'feed' : 'admin');
                } else {
                  setShowAdminLogin(true);
                }
              }}
              className={`p-2 rounded-full transition-colors ${isAdmin ? 'text-emerald-500' : ''} ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'feed' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Feed */}
            <div className="md:col-span-2 space-y-12">
              {posts.map(post => (
                <div key={post.id} className="space-y-6">
                  {/* Post Card */}
                  <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm`}>
                    {/* Post Header */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={post.avatar} className="w-8 h-8 rounded-full border border-zinc-200" alt={post.username} />
                        <span className="font-bold text-sm">{post.username}</span>
                      </div>
                      <MoreHorizontal size={20} className="text-zinc-500" />
                    </div>

                    {/* Post Image */}
                    <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                      <img 
                        src={post.imageUrl} 
                        className="w-full h-full object-cover" 
                        alt="Post Content"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Post Actions */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Heart size={24} className="hover:text-red-500 cursor-pointer transition-colors" />
                          <MessageCircle size={24} className="hover:text-indigo-500 cursor-pointer transition-colors" />
                          <Share2 size={24} className="hover:text-indigo-500 cursor-pointer transition-colors" />
                        </div>
                        <Bookmark size={24} className="hover:text-indigo-500 cursor-pointer transition-colors" />
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-bold">{post.likes.toLocaleString()} likes</p>
                        <p className="text-sm">
                          <span className="font-bold mr-2">{post.username}</span>
                          {post.caption}
                        </p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-2">
                          {new Date(post.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Post Input */}
                  <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm`}>
                    <div className="flex gap-3">
                      <img src="https://picsum.photos/seed/user/100/100" className="w-10 h-10 rounded-full border border-zinc-200" alt="Avatar" />
                      <div className="flex-1 space-y-3">
                        <div className="relative">
                          <textarea 
                            value={inputTexts[post.id] || ''}
                            onChange={(e) => setInputTexts({ ...inputTexts, [post.id]: e.target.value })}
                            placeholder="Add a comment..."
                            maxLength={200}
                            className={`w-full p-3 pr-10 rounded-xl border resize-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}
                            rows={2}
                          />
                          {(inputTexts[post.id]?.length || 0) > 0 && (
                            <button 
                              onClick={() => setInputTexts({ ...inputTexts, [post.id]: '' })}
                              className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                              title="Clear input"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col gap-1">
                            <div className="text-xs text-zinc-500">
                              {(inputTexts[post.id]?.length || 0) > 0 && (
                                <span className="flex items-center gap-1">
                                  <Info size={12} />
                                  Real-time analysis active
                                </span>
                              )}
                            </div>
                            <div className={`text-[10px] font-mono ${(inputTexts[post.id]?.length || 0) > 180 ? 'text-red-500' : 'text-zinc-400'}`}>
                              {inputTexts[post.id]?.length || 0}/200 characters
                            </div>
                          </div>
                          <button 
                            onClick={() => handlePostComment(post.id)}
                            disabled={!(inputTexts[post.id] || '').trim()}
                            className="px-6 py-2 rounded-full instagram-gradient text-white font-semibold flex items-center gap-2 disabled:opacity-50 hover:scale-105 active:scale-95 transition-transform"
                          >
                            Post <Send size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comments List for this post */}
                  <div className="space-y-4">
                    <AnimatePresence initial={false}>
                      {post.comments.map((comment) => (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm overflow-hidden relative`}
                        >
                          {/* Classification Indicator Bar */}
                          <div className={`absolute top-0 left-0 w-1 h-full ${comment.isBullying ? 'bg-red-500' : 'bg-emerald-500'}`} />
                          
                          <div className="flex gap-3">
                            <img src={comment.avatar} className="w-10 h-10 rounded-full border border-zinc-200" alt={comment.username} />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="font-bold text-sm">@{comment.username}</h3>
                                <span className="text-[10px] text-zinc-500">
                                  {new Date(comment.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className={`mt-1 text-sm ${comment.isBullying ? 'text-zinc-400 italic line-through opacity-50' : ''}`}>
                                {comment.text}
                              </p>
                              
                              {/* Classification Label & Actions */}
                              <div className="mt-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    comment.isBullying 
                                      ? 'bg-red-500/10 text-red-500' 
                                      : 'bg-emerald-500/10 text-emerald-500'
                                  }`}>
                                    {comment.isBullying ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                                    {comment.label}
                                  </div>
                                  <div className="text-[10px] font-mono text-zinc-500">
                                    Confidence: {comment.confidence}%
                                  </div>
                                </div>
                                
                                <button 
                                  onClick={() => handleReport(comment.id)}
                                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-red-500 transition-colors"
                                >
                                  <Flag size={12} />
                                  Report
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm`}>
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 size={20} className="text-indigo-500" />
                  <h2 className="font-bold">System Stats</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-500 uppercase tracking-widest font-semibold">Total Comments</span>
                      <span className="font-bold">{stats.total}</span>
                    </div>
                    <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-500 uppercase tracking-widest font-semibold">Bullying Rate</span>
                      <span className="font-bold text-red-500">{stats.bullyingPercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.bullyingPercent}%` }}
                        className="h-full bg-red-500" 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-500 uppercase tracking-widest font-semibold">Safe Content</span>
                      <span className="font-bold text-emerald-500">{stats.safePercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.safePercent}%` }}
                        className="h-full bg-emerald-500" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm`}>
                <div className="flex items-center gap-2 mb-4">
                  <Info size={18} className="text-zinc-400" />
                  <h2 className="font-bold text-sm">How it works</h2>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  This project uses a weighted lexical analysis algorithm. Each word is checked against a dataset of bullying terms. If the average weight exceeds 0.15, the content is flagged.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                  <Settings size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Admin Dashboard</h2>
                  <p className="text-sm text-zinc-500">Manage content and monitor system health</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('feed')}
                className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-sm font-semibold"
              >
                Back to Feed
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm`}>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-1">Total Flagged</p>
                <p className="text-3xl font-bold text-red-500">{stats.bullying}</p>
              </div>
              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm`}>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-1">User Reports</p>
                <p className="text-3xl font-bold text-orange-500">{allComments.filter(c => c.isReported).length}</p>
              </div>
              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm`}>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-1">Total Safe</p>
                <p className="text-3xl font-bold text-emerald-500">{stats.safe}</p>
              </div>
              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm`}>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-1">System Status</p>
                <p className="text-3xl font-bold text-indigo-500">Active</p>
              </div>
            </div>

            <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm`}>
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
                <h3 className="font-bold">Content Moderation Queue</h3>
                <span className="text-xs text-zinc-500">{allComments.length} items total</span>
              </div>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {allComments.map(comment => (
                  <div key={comment.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${comment.isBullying ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {comment.isBullying ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">@{comment.username}</span>
                          <span className="text-[10px] text-zinc-500">{comment.label} ({comment.confidence}%)</span>
                          {comment.isReported && (
                            <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 text-[8px] font-bold uppercase">Reported</span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 max-w-md truncate">{comment.text}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteComment(comment.id)}
                      className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdminLogin(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full max-w-md p-8 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Lock size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Admin Access</h2>
                  <p className="text-sm text-zinc-500">Enter password to access dashboard</p>
                </div>
                
                <form onSubmit={handleAdminLogin} className="w-full space-y-4">
                  <input 
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Password"
                    autoFocus
                    className={`w-full p-4 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}
                  />
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowAdminLogin(false)}
                      className="flex-1 p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 p-4 rounded-xl instagram-gradient text-white font-bold text-sm"
                    >
                      Unlock
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className={`py-12 border-t ${isDarkMode ? 'border-zinc-800 text-zinc-500' : 'border-zinc-200 text-zinc-400'}`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
            <ShieldAlert size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Cyber Bullying Detection Project v1.0</span>
          </div>
          <p className="text-[10px] uppercase tracking-tighter">
            Protecting digital spaces through intelligent lexical analysis
          </p>
        </div>
      </footer>
    </div>
  );
}
