
import React, { useState } from 'react';
import { LoadingSpinner, SparklesIcon } from './icons';

interface StoryInputProps {
  onGenerate: (type: 'topic' | 'full', content: string) => void;
  isLoading: boolean;
}

const StoryInput: React.FC<StoryInputProps> = ({ onGenerate, isLoading }) => {
  const [inputType, setInputType] = useState<'topic' | 'full'>('topic');
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onGenerate(inputType, content);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-700">
      <h2 className="text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
        第一步：提供您的故事靈感
      </h2>
      
      <div className="flex justify-center mb-6">
        <div className="bg-gray-900 p-1 rounded-full flex space-x-1 border border-gray-700">
          <button
            onClick={() => setInputType('topic')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${inputType === 'topic' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700/50'}`}
          >
            故事主題
          </button>
          <button
            onClick={() => setInputType('full')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${inputType === 'full' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700/50'}`}
          >
            故事文字
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={inputType === 'topic' ? '例如：一個關於迷失在未來城市中的時間旅行者的故事' : '請在此輸入您的完整故事敘述...'}
          className="w-full h-40 p-4 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none placeholder-gray-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !content.trim()}
          className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          {isLoading ? <LoadingSpinner /> : <SparklesIcon />}
          <span className="ml-2">
            {inputType === 'topic' ? '生成故事大綱' : '直接進入分鏡腳本'}
          </span>
        </button>
      </form>
    </div>
  );
};

export default StoryInput;
