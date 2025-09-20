import React, 'react';
import type { Scene } from '../types';
import { LoadingSpinner, RefreshIcon, XCircleIcon, CheckIcon, PlayIcon } from './icons';

interface SceneCardProps {
  scene: Scene;
  onUpdateScene: (updatedScene: Scene) => void;
  onGenerateImage: (sceneId: number) => void;
  onGenerateVideo: (sceneId: number) => void;
  onGenerateAudio: (sceneId: number) => void;
}

const SceneCard: React.FC<SceneCardProps> = ({ scene, onUpdateScene, onGenerateImage, onGenerateVideo, onGenerateAudio }) => {

  const handleNarrationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateScene({ ...scene, narration: e.target.value });
  };
  
  const handleImagePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateScene({ ...scene, imagePrompt: e.target.value });
  };

  const handleAnimationPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateScene({ ...scene, animationPrompt: e.target.value });
  };

  const AssetButton: React.FC<{
    status: 'idle' | 'loading' | 'success' | 'error';
    error?: string;
    onGenerate: () => void;
    generateText: string;
    successText: string;
    disabled?: boolean;
    type: 'image' | 'video';
  }> = ({ status, error, onGenerate, generateText, successText, disabled, type }) => {
    const colorClasses = {
      image: 'border-cyan-500 hover:bg-cyan-500/10',
      video: 'border-purple-500 hover:bg-purple-500/10',
    };

    if (status === 'loading') {
      return <div className="flex items-center justify-center h-10 text-sm text-gray-400"><LoadingSpinner /> <span>生成中...</span></div>;
    }
    if (status === 'success') {
      return <div className="flex items-center justify-center h-10 text-sm text-green-400"><CheckIcon /> <span>{successText}</span></div>;
    }
    if (status === 'error') {
      return (
        <div className="flex flex-col items-center justify-center gap-2">
            <div className="text-sm text-red-400 text-center">{error}</div>
            <button
                onClick={onGenerate}
                className={`w-full text-sm font-semibold p-2 rounded-lg border-2 border-red-500 hover:bg-red-500/10 transition-colors duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={disabled}
            >
                <div className="flex items-center justify-center"><RefreshIcon className="w-4 h-4 mr-2"/> 重試</div>
            </button>
        </div>
      );
    }
    return (
      <button
        onClick={onGenerate}
        className={`w-full text-sm font-semibold p-2 rounded-lg border-2 ${colorClasses[type]} transition-colors duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={disabled}
      >
        {generateText}
      </button>
    );
  };
  
  const AudioControl: React.FC = () => {
    const handlePlayAudio = () => onGenerateAudio(scene.id);
    const buttonBaseClasses = "w-full text-sm font-semibold p-2 rounded-lg border-2 transition-colors duration-200 flex items-center justify-center gap-2";

    switch (scene.audioStatus) {
      case 'loading':
        return (
          <div className="flex items-center justify-center h-10 text-sm text-gray-400">
            <LoadingSpinner className="w-4 h-4 mr-2" /> <span>播放中...</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="text-sm text-red-400 text-center">{scene.audioError}</div>
            <button
              onClick={handlePlayAudio}
              className={`${buttonBaseClasses} border-red-500 hover:bg-red-500/10`}
            >
              <RefreshIcon className="w-4 h-4" /> 重試
            </button>
          </div>
        );
      case 'success':
        return (
          <button onClick={handlePlayAudio} className={`${buttonBaseClasses} border-green-500 hover:bg-green-500/10`}>
            <PlayIcon className="w-4 h-4" /> 重新播放
          </button>
        );
      case 'idle':
      default:
        return (
          <button onClick={handlePlayAudio} className={`${buttonBaseClasses} border-green-500 hover:bg-green-500/10`}>
            <PlayIcon className="w-4 h-4" /> 生成並播放旁白
          </button>
        );
    }
  };

  return (
    <div className="bg-gray-800/60 rounded-xl border border-gray-700 overflow-hidden shadow-lg animate-fade-in-up">
      <div className="p-4 bg-gray-900/50 flex justify-between items-center">
        <h3 className="font-bold text-lg text-indigo-400">場景 {scene.id}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Left Side: Media */}
        <div className="flex flex-col gap-4">
            <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden border border-gray-700">
                {scene.imageStatus === 'loading' && <LoadingSpinner className="w-10 h-10 text-cyan-400"/>}
                {scene.imageStatus === 'error' && <XCircleIcon className="w-10 h-10 text-red-500"/>}
                {scene.imageUrl && !scene.videoUrl && <img src={scene.imageUrl} alt={`場景 ${scene.id} 預覽`} className="w-full h-full object-cover" />}
                {scene.videoUrl && <video src={scene.videoUrl} controls className="w-full h-full object-cover"></video>}
                {scene.imageStatus === 'idle' && !scene.imageUrl && <span className="text-gray-500 text-sm">待生成圖片</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <AssetButton type="image" status={scene.imageStatus} error={scene.imageError} onGenerate={() => onGenerateImage(scene.id)} generateText="生成圖片" successText="圖片已生成" />
                <AssetButton type="video" status={scene.videoStatus} error={scene.videoError} onGenerate={() => onGenerateVideo(scene.id)} generateText="生成影片" successText="影片已生成" disabled={scene.imageStatus !== 'success'}/>
                <AudioControl />
            </div>
        </div>
        {/* Right Side: Text */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-400">旁白</label>
            <textarea
              value={scene.narration}
              onChange={handleNarrationChange}
              className="mt-1 w-full h-24 p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-400">圖片提示</label>
            <textarea
              value={scene.imagePrompt}
              onChange={handleImagePromptChange}
              className="mt-1 w-full h-24 p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              rows={3}
            />
          </div>
           <div>
            <label className="text-sm font-semibold text-gray-400">動畫提示</label>
            <textarea
              value={scene.animationPrompt}
              onChange={handleAnimationPromptChange}
              className="mt-1 w-full h-20 p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              rows={2}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SceneCard;