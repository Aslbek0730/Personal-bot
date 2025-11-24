import React, { useState, useEffect } from 'react';
import { Calendar, Users, MessageSquare, TrendingUp, Plus, Send, History, Settings } from 'lucide-react';

// Mock API URLs - o'z backend manzilingizni qo'yasiz
const API_URL = 'http://localhost:8000';
const BOT_TOKEN = 'YOUR_BOT_TOKEN'; // O'z bot tokeningiz

const TelegramAIAgent = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [channels, setChannels] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedPost, setGeneratedPost] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(null);

  // Telegram WebApp initialization
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      // User ma'lumotlarini olish
      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        setUser({
          id: tgUser.id,
          username: tgUser.username,
          firstName: tgUser.first_name,
          role: 'user' // Default, backenddan keyin o'zgaradi
        });
      }
    }
  }, []);

  // Kanallarni yuklash
  const loadChannels = async () => {
    try {
      const response = await fetch(`${API_URL}/channels/${user?.id}`);
      const data = await response.json();
      setChannels(data.channels || []);
    } catch (error) {
      console.error('Kanallarni yuklashda xatolik:', error);
    }
  };

  // AI post generatsiya qilish
  const generatePost = async (topic) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          topic: topic || 'Umumiy post'
        })
      });
      const data = await response.json();
      setGeneratedPost(data.content);
    } catch (error) {
      console.error('Post yaratishda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  // Postni kanalga yuborish
  const publishPost = async () => {
    if (!selectedChannel || !generatedPost) return;
    
    setLoading(true);
    try {
      await fetch(`${API_URL}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          channel_id: selectedChannel,
          content: generatedPost
        })
      });
      alert('Post muvaffaqiyatli yuborildi!');
      setGeneratedPost('');
      setSelectedChannel(null);
    } catch (error) {
      console.error('Post yuborishda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dashboard ko'rinishi
  const DashboardView = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={<Users />} title="Kanallar" value={channels.length} />
        <StatCard icon={<MessageSquare />} title="Postlar" value={posts.length} />
        <StatCard icon={<TrendingUp />} title="Ko'rildi" value="0" />
        <StatCard icon={<Calendar />} title="Bugun" value="0" />
      </div>
    </div>
  );

  // Kanallar ro'yxati
  const ChannelsView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Mening Kanallarim</h2>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={20} />
          Kanal qo'shish
        </button>
      </div>
      <div className="space-y-3">
        {channels.map(channel => (
          <div key={channel.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-800">{channel.name}</h3>
            <p className="text-sm text-gray-500">ID: {channel.channel_id}</p>
          </div>
        ))}
        {channels.length === 0 && (
          <p className="text-gray-500 text-center py-8">Hozircha kanallar yo'q</p>
        )}
      </div>
    </div>
  );

  // AI Generator
  const GeneratorView = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">AI Post Generator</h2>
      
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mavzu kiriting
        </label>
        <input
          type="text"
          placeholder="Masalan: Texnologiya yangiliklari"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onKeyPress={(e) => {
            if (e.key === 'Enter') generatePost(e.target.value);
          }}
        />
        <button
          onClick={() => {
            const input = document.querySelector('input[type="text"]');
            generatePost(input.value);
          }}
          disabled={loading}
          className="mt-3 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Yaratilmoqda...' : 'AI bilan yaratish'}
        </button>
      </div>

      {generatedPost && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-2">Yaratilgan post:</h3>
          <p className="text-gray-700 whitespace-pre-wrap mb-4">{generatedPost}</p>
          
          <select
            value={selectedChannel || ''}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
          >
            <option value="">Kanal tanlang</option>
            {channels.map(ch => (
              <option key={ch.id} value={ch.channel_id}>{ch.name}</option>
            ))}
          </select>

          <button
            onClick={publishPost}
            disabled={!selectedChannel || loading}
            className="w-full bg-green-500 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send size={20} />
            Kanalga yuborish
          </button>
        </div>
      )}
    </div>
  );

  // Tarix
  const HistoryView = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Tarix</h2>
      <div className="space-y-3">
        {posts.map(post => (
          <div key={post.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-700 text-sm mb-2">{post.content.substring(0, 100)}...</p>
            <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString('uz-UZ')}</p>
          </div>
        ))}
        {posts.length === 0 && (
          <p className="text-gray-500 text-center py-8">Hozircha tarix bo'sh</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">AI Telegram Agent</h1>
              <p className="text-sm text-gray-500">
                {user ? `@${user.username || user.firstName}` : 'Yuklanmoqda...'}
              </p>
            </div>
            <Settings className="text-gray-400 cursor-pointer" />
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-md p-2 mb-4 flex gap-2 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'channels', label: 'Kanallar', icon: Users },
            { id: 'generator', label: 'Generator', icon: MessageSquare },
            { id: 'history', label: 'Tarix', icon: History }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-4">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'channels' && <ChannelsView />}
          {activeTab === 'generator' && <GeneratorView />}
          {activeTab === 'history' && <HistoryView />}
        </div>
      </div>
    </div>
  );
};

// Statistika kartasi
const StatCard = ({ icon, title, value }) => (
  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-4 text-white">
    <div className="flex items-center gap-3">
      <div className="bg-white/20 p-2 rounded-lg">
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div>
        <p className="text-sm opacity-90">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </div>
);

export default TelegramAIAgent;