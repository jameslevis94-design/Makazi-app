import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      <span className="text-xs font-mono text-slate-400 tracking-wider">Synchronizing secure layer...</span>
    </div>
  );
}
