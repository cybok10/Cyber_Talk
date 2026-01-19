import React, { useState } from 'react';

interface AuthProps {
  onJoin: (username: string, roomId: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onJoin }) => {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('Lobby');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onJoin(username, roomId);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-600 p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl mx-auto mb-4">
            <i className="fas fa-comments"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">SimpleChat</h1>
          <p className="text-slate-500 text-sm">Join a room and start chatting</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Username</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="e.g. Alex"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Room Name</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="e.g. Lobby"
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-100"
          >
            Enter Chat
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-400">
          Open this page in another tab to chat with yourself!
        </p>
      </div>
    </div>
  );
};

export default Auth;
//