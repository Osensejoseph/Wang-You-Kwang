
import React from 'react';
import { LoadingSpinner, RefreshIcon, CheckIcon, SparklesIcon } from './icons';

interface SynopsisViewerProps {
  synopsis: string;
  onAccept: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
}

const SynopsisViewer: React.FC<SynopsisViewerProps> = ({ synopsis, onAccept, onRegenerate, isLoading }) => {
  return (
    <div className="w-full max-w-3xl mx-auto bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-700 animate-fade-in">
      <h2 className="text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
        第二步：確認故事大綱
      </h2>
      <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 min-h-[150px] whitespace-pre-wrap font-light text-gray-300">
        {isLoading && !synopsis ? <div className="flex justify-center items-center h-full"><LoadingSpinner className="w-8 h-8"/></div> : synopsis}
      </div>

      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={onRegenerate}
          disabled={isLoading}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <LoadingSpinner /> : <RefreshIcon />}
          <span className="ml-2">不滿意，重新生成</span>
        </button>
        <button
          onClick={onAccept}
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckIcon />
          <span className="ml-2">滿意，生成完整故事</span>
        </button>
      </div>
    </div>
  );
};

export default SynopsisViewer;
