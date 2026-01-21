import React, { useEffect, useState } from 'react';

interface NetworkVisualizerProps {
  activity: 'idle' | 'sending' | 'receiving';
}

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  icon: string;
  color: 'cyan' | 'purple' | 'yellow';
}

interface Link {
  from: string;
  to: string;
  type: 'bluetooth' | 'tor';
}

const NetworkVisualizer: React.FC<NetworkVisualizerProps> = ({ activity }) => {
  const [packets, setPackets] = useState<{ id: number; path: string; color: string; delay: number }[]>([]);

  const nodes: Node[] = [
    { id: 'you', x: 50, y: 50, label: 'You', icon: 'fa-user', color: 'cyan' },
    { id: 'peerA', x: 20, y: 20, label: 'Peer A', icon: 'fa-bluetooth-b', color: 'cyan' },
    { id: 'peerB', x: 80, y: 15, label: 'Peer B', icon: 'fa-bluetooth-b', color: 'cyan' },
    { id: 'peerC', x: 25, y: 80, label: 'Peer C', icon: 'fa-bluetooth-b', color: 'cyan' },
    { id: 'gateway', x: 75, y: 55, label: 'Gateway', icon: 'fa-wifi', color: 'yellow' },
    { id: 'relay', x: 90, y: 35, label: 'Tor Relay', icon: 'fa-globe', color: 'purple' },
    { id: 'exit', x: 90, y: 75, label: 'Tor Exit', icon: 'fa-globe', color: 'purple' },
  ];

  const links: Link[] = [
    { from: 'you', to: 'peerA', type: 'bluetooth' },
    { from: 'you', to: 'peerB', type: 'bluetooth' },
    { from: 'peerA', to: 'peerB', type: 'bluetooth' }, // Mesh link
    { from: 'you', to: 'peerC', type: 'bluetooth' },
    { from: 'you', to: 'gateway', type: 'bluetooth' },
    { from: 'gateway', to: 'relay', type: 'tor' },
    { from: 'relay', to: 'exit', type: 'tor' },
  ];

  useEffect(() => {
    if (activity === 'sending') {
      const newPackets = [
        { id: Date.now() + 1, path: 'you-peerA', color: '#22d3ee', delay: 0 },
        { id: Date.now() + 2, path: 'you-peerB', color: '#22d3ee', delay: 0.1 },
        { id: Date.now() + 3, path: 'you-peerC', color: '#22d3ee', delay: 0.2 },
        { id: Date.now() + 4, path: 'you-gateway', color: '#facc15', delay: 0 },
        { id: Date.now() + 5, path: 'gateway-relay', color: '#a855f7', delay: 0.5 },
        { id: Date.now() + 6, path: 'relay-exit', color: '#a855f7', delay: 1.0 },
      ];
      setPackets(prev => [...prev, ...newPackets]);

      // Cleanup packets
      setTimeout(() => {
        setPackets(prev => prev.filter(p => p.id < Date.now()));
      }, 2000);
    }
  }, [activity]);

  const getNode = (id: string) => nodes.find(n => n.id === id)!;

  const getColor = (c: string) => {
    switch (c) {
      case 'cyan': return '#22d3ee';
      case 'purple': return '#a855f7';
      case 'yellow': return '#facc15';
      default: return '#ffffff';
    }
  };

  const getPathD = (fromId: string, toId: string) => {
    const start = getNode(fromId);
    const end = getNode(toId);
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  };

  return (
    <div className="hidden xl:flex flex-col w-80 bg-slate-900 border-l border-slate-800 shadow-2xl z-30 relative overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur z-10">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          Mesh Topology
        </h3>
      </div>

      {/* Visualization Area */}
      <div className="flex-1 relative">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        <svg className="w-full h-full absolute inset-0 pointer-events-none">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Links */}
          {links.map((link, i) => {
            const start = getNode(link.from);
            const end = getNode(link.to);
            const isTor = link.type === 'tor';
            const strokeColor = isTor ? '#a855f7' : '#22d3ee';
            
            return (
              <g key={i}>
                <line 
                  x1={`${start.x}%`} y1={`${start.y}%`} 
                  x2={`${end.x}%`} y2={`${end.y}%`}
                  stroke={strokeColor} 
                  strokeWidth="1.5" 
                  strokeDasharray="4 4"
                  opacity="0.3"
                />
              </g>
            );
          })}

          {/* Animated Packets */}
          {packets.map((pkt) => {
             const [from, to] = pkt.path.split('-');
             const pathD = getPathD(from, to).replace(/(\d+) /g, "$1% "); // Hacky way to keep percentages for d attribute if supported or convert logic.
             // SVG paths in 'd' usually need absolute units or viewbox relative. 
             // Let's use coordinate interpolation for simpler React animation or just SVG animateMotion with path references.
             
             // Simpler approach: Calculate numeric coords for animateMotion
             // Assuming 320px width (w-80) and rough height 600px. 
             // But simpler is to use percentage based coordinates in line and circle.
             
             // Correct approach for SVG AnimateMotion with percentages is tricky. 
             // We will draw invisible paths for animation.
             
             const startNode = getNode(from);
             const endNode = getNode(to);
             
             return (
               <circle key={pkt.id} r="3" fill={pkt.color} filter="url(#glow)">
                 <animate 
                    attributeName="opacity"
                    values="0;1;1;0"
                    dur="1.5s"
                    begin={`${pkt.delay}s`}
                    fill="freeze"
                 />
                 <animateMotion 
                    dur="1.5s" 
                    begin={`${pkt.delay}s`}
                    fill="freeze"
                    path={`M ${startNode.x*3.2} ${startNode.y*6} L ${endNode.x*3.2} ${endNode.y*6}`} // Rough conversion for ViewBox matching if we set ViewBox
                 />
                 {/* Fallback to simple CSS transition logic if SVG path math is annoying, but let's try ViewBox */}
               </circle>
             )
          })}
        </svg>

        {/* Nodes (HTML for easier styling/icons) */}
        {nodes.map(node => (
          <div 
            key={node.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 group cursor-default"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div className={`w-10 h-10 rounded-full bg-slate-900 border-2 flex items-center justify-center transition-all duration-500 shadow-[0_0_15px_rgba(0,0,0,0.5)]
              ${node.color === 'cyan' ? 'border-cyan-500/50 shadow-cyan-500/20' : ''}
              ${node.color === 'purple' ? 'border-purple-500/50 shadow-purple-500/20' : ''}
              ${node.color === 'yellow' ? 'border-yellow-500/50 shadow-yellow-500/20' : ''}
              ${node.id === 'you' && activity === 'sending' ? 'scale-110 border-white shadow-cyan-500/50' : ''}
            `}>
              <i className={`fas ${node.icon} text-lg
                ${node.color === 'cyan' ? 'text-cyan-400' : ''}
                ${node.color === 'purple' ? 'text-purple-400' : ''}
                ${node.color === 'yellow' ? 'text-yellow-400' : ''}
              `}></i>
            </div>
            
            <div className={`px-2 py-1 rounded bg-slate-900/80 border border-slate-700 backdrop-blur text-[10px] font-mono font-bold whitespace-nowrap opacity-70 group-hover:opacity-100 transition-opacity
              ${node.color === 'cyan' ? 'text-cyan-200' : ''}
              ${node.color === 'purple' ? 'text-purple-200' : ''}
              ${node.color === 'yellow' ? 'text-yellow-200' : ''}
            `}>
              {node.label}
            </div>
          </div>
        ))}
        
        {/* SVG Overlay for Packets with correct ViewBox scaling */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
           {packets.map((pkt) => {
             const [from, to] = pkt.path.split('-');
             const start = getNode(from);
             const end = getNode(to);
             return (
               <circle key={pkt.id} r="1.5" fill={pkt.color}>
                 <animateMotion 
                   dur="1s" 
                   begin={`${pkt.delay}s`}
                   repeatCount="1"
                   path={`M ${start.x} ${start.y} L ${end.x} ${end.y}`} 
                 />
                 <animate attributeName="opacity" values="1;0" dur="1s" begin={`${pkt.delay}s`} fill="freeze" />
               </circle>
             );
           })}
        </svg>

      </div>

      {/* Stats Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
            <div className="text-[9px] text-slate-500 uppercase font-bold">Latency</div>
            <div className="text-cyan-400 font-mono text-sm">~24ms</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
            <div className="text-[9px] text-slate-500 uppercase font-bold">Peers</div>
            <div className="text-purple-400 font-mono text-sm">4 Active</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkVisualizer;