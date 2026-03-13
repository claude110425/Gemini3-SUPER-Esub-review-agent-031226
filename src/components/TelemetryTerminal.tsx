import React from 'react';
import { Terminal, Square } from 'lucide-react';

interface Props {
  isGenerating: boolean;
  onStop: () => void;
  language: 'zh' | 'en';
  logs: string[];
}

export default function TelemetryTerminal({ isGenerating, onStop, language, logs }: Props) {
  if (!isGenerating && logs.length === 0) return null;

  return (
    <div className="bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 shadow-lg mt-4">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-zinc-400">
          <Terminal className="w-4 h-4" />
          <span className="text-xs font-mono uppercase tracking-wider">
            {language === 'zh' ? '即時遙測終端機' : 'Telemetry Terminal'}
          </span>
        </div>
        {isGenerating && (
          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md transition-colors text-xs font-medium border border-red-500/20"
          >
            <Square className="w-3 h-3 fill-current" />
            {language === 'zh' ? '🛑 停止生成 (Stop)' : '🛑 Stop Generation'}
          </button>
        )}
      </div>
      <div className="p-4 h-32 overflow-y-auto font-mono text-xs space-y-1">
        {logs.map((log, i) => (
          <div key={i} className={`${log.includes('[ERROR]') ? 'text-red-400' : log.includes('[SUCCESS]') ? 'text-emerald-400' : 'text-emerald-500/70'}`}>
            {log}
          </div>
        ))}
        {isGenerating && (
          <div className="flex items-center gap-2 text-emerald-500">
            <span className="w-2 h-4 bg-emerald-500 animate-pulse"></span>
          </div>
        )}
      </div>
    </div>
  );
}
