import React, { useState } from 'react';
import { User } from '../types.ts';

interface SidebarProps {
  user: User | null;
  activeRoom: string | null;
  peer: User | null;
  isBotEnabled: boolean;
  setIsBotEnabled: (v: boolean) => void;
  sessionStats: any;
  connectionStatus?: { status: string; label: string };
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeRoom, peer, isBotEnabled, setIsBotEnabled, sessionStats, connectionStatus }) => {
  const [showAudit, setShowAudit] = useState(false);

  // Determine status color
  let statusColor = 'bg-slate-400';
  let statusText = 'text-slate-500';
  let pulse = false;

  if (connectionStatus?.status === 'host') {
    statusColor = 'bg-emerald-500';
    statusText = 'text-emerald-500';
    pulse = true;
  } else if (connectionStatus?.status === 'client') {
    statusColor = 'bg-blue-500';
    statusText = 'text-blue-500';
    pulse = true;
  } else if (connectionStatus?.status === 'connecting') {
    statusColor = 'bg-amber-400';
    statusText = 'text-amber-500';
    pulse = true;
  }

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm z-20 relative glass-sidebar">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-200">
              <i className="fas fa-shield-halved"></i>
           </div>
           <div>
              <h2 className="font-bold text-slate-800 tracking-tight leading-none mb-1">CipherTalk</h2>
              <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Protocol v2.4-E2EE</p>
           </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl shadow-slate-200">
           <p className="text-[9px] text-slate-500 font-bold uppercase mb-2 tracking-widest">Network Status</p>
           <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-200">
                 {connectionStatus?.label || 'Initializing...'}
              </span>
              <div className="flex items-center gap-1.5">
                 <div className={`w-1.5 h-1.5 rounded-full ${statusColor} ${pulse ? 'animate-pulse' : ''} shadow-[0_0_8px_rgba(255,255,255,0.2)]`}></div>
                 <span className={`text-[9px] font-bold ${statusText} tracking-tighter uppercase`}>
                    {connectionStatus?.status === 'host' ? 'HOST' : connectionStatus?.status === 'client' ? 'SECURE' : 'WAIT'}
                 </span>
              </div>
           </div>
           {activeRoom && (
              <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center">
                 <span className="text-[9px] text-slate-500 uppercase">Tunnel ID</span>
                 <span className="text-[10px] font-mono text-indigo-400">#{activeRoom}</span>
              </div>
           )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">Verified Nodes</h3>
          <div className="space-y-2">
            <div className="group relative flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all cursor-default">
              <img src={user?.avatar} className="w-10 h-10 rounded-full bg-slate-100" alt="User avatar" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{user?.username} <span className="text-[10px] text-indigo-400 font-normal ml-1">Local</span></p>
                <p className="text-[9px] text-slate-400 font-mono truncate">{user?.publicKey?.substring(0, 24)}...</p>
              </div>
            </div>

            {peer ? (
              <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-slide-in-left">
                <div className="relative">
                  <img src={peer.avatar} className="w-10 h-10 rounded-full bg-indigo-100" alt="Peer avatar" />
                  <div className="absolute -top-1 -right-1 bg-emerald-500 w-3 h-3 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-800 truncate">{peer.username}</p>
                    <i className="fas fa-check-circle text-[10px] text-emerald-500"></i>
                  </div>
                  <p className="text-[9px] text-indigo-400 font-mono truncate">{peer.publicKey.substring(0, 24)}...</p>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                 <div className="mb-2 text-slate-200"><i className="fas fa-satellite-dish animate-pulse text-2xl"></i></div>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Scanning frequency...</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">Session Configuration</h3>
          <label className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl cursor-pointer transition-all group">
             <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                  <i className="fas fa-robot text-sm"></i>
                </div>
                <span className="text-xs font-semibold">Security Consultant Bot</span>
             </div>
             <div className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isBotEnabled} 
                  onChange={e => setIsBotEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
             </div>
          </label>

          <button 
            onClick={() => setShowAudit(!showAudit)}
            className="w-full mt-2 flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-all group"
          >
             <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                <i className="fas fa-magnifying-glass-chart text-sm"></i>
             </div>
             <span className="text-xs font-semibold text-slate-600">Security Audit Logs</span>
          </button>
        </div>
      </div>

      {showAudit && (
        <div className="absolute inset-0 bg-white z-30 animate-slide-in-bottom flex flex-col">
           <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Security Audit</h3>
              <button onClick={() => setShowAudit(false)} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times"></i></button>
           </div>
           <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Algorithm Stack</p>
                 <div className="p-3 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-600 space-y-1 border border-slate-100">
                    <div className="flex justify-between"><span>Symmetric:</span><span className="text-indigo-600 font-bold">AES-GCM-256</span></div>
                    <div className="flex justify-between"><span>Asymmetric:</span><span className="text-indigo-600 font-bold">RSA-OAEP-2048</span></div>
                    <div className="flex justify-between"><span>Hashing:</span><span className="text-indigo-600 font-bold">SHA-256</span></div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="p-6 bg-slate-50 border-t border-slate-200">
         <div className="flex items-center justify-between text-slate-400 text-sm">
            <button className="hover:text-indigo-600 transition-colors"><i className="fas fa-shield-heart"></i></button>
            <button className="hover:text-indigo-600 transition-colors"><i className="fas fa-key"></i></button>
            <button className="hover:text-indigo-600 transition-colors"><i className="fas fa-power-off"></i></button>
         </div>
      </div>
    </div>
  );
};

export default Sidebar;