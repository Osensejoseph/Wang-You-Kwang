
import React, { useState } from 'react';
import type { Scene } from '../types';
import { IMAGE_STYLES } from '../constants';
import SceneCard from './SceneCard';
import { DownloadIcon, LoadingSpinner } from './icons';

interface StoryboardEditorProps {
  storyContent: string;
  scenes: Scene[];
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
  onGenerateImage: (sceneId: number, style: string) => void;
  onGenerateVideo: (sceneId: number) => void;
  onGenerateAudio: (sceneId: number) => void;
}

const StoryboardEditor: React.FC<StoryboardEditorProps> = ({ storyContent, scenes, setScenes, onGenerateImage, onGenerateVideo, onGenerateAudio }) => {
  const [selectedStyle, setSelectedStyle] = useState(IMAGE_STYLES[0].value);
  const [isCombining, setIsCombining] = useState(false);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);

  const handleUpdateScene = (updatedScene: Scene) => {
    setScenes(prevScenes => prevScenes.map(s => s.id === updatedScene.id ? updatedScene : s));
  };
  
  const handleGenerateAllImages = () => {
    scenes.forEach(scene => {
        if (scene.imageStatus !== 'success' && scene.imageStatus !== 'loading') {
            onGenerateImage(scene.id, selectedStyle);
        }
    });
  };

  const areAllAssetsReady = scenes.every(s => s.videoStatus === 'success' && s.audioStatus === 'success');

  const handleCombineVideo = () => {
    setIsCombining(true);
    // Simulate combination process
    setTimeout(() => {
        // In a real app, this would be a server-side call to combine videos.
        // Here, we just use the first video as the final product.
        setFinalVideoUrl(scenes[0]?.videoUrl || null);
        setIsCombining(false);
    }, 3000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
      <h2 className="text-3xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
        第三步：編輯與生成場景
      </h2>
      <div className="bg-gray-800/50 p-4 rounded-lg mb-6 border border-gray-700">
        <h3 className="font-semibold mb-2 text-gray-300">完整故事內容：</h3>
        <p className="text-sm text-gray-400 max-h-32 overflow-y-auto pr-2">{storyContent}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <div className="flex items-center gap-3">
          <label htmlFor="style-select" className="font-semibold text-white">圖片風格:</label>
          <select
            id="style-select"
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500"
          >
            {IMAGE_STYLES.map(style => (
              <option key={style.value} value={style.value}>{style.label}</option>
            ))}
          </select>
        </div>
        <button
            onClick={handleGenerateAllImages}
            className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
            生成所有圖片
        </button>
      </div>

      <div className="space-y-6">
        {scenes.map(scene => (
          <SceneCard
            key={scene.id}
            scene={scene}
            onUpdateScene={handleUpdateScene}
            onGenerateImage={(id) => onGenerateImage(id, selectedStyle)}
            onGenerateVideo={onGenerateVideo}
            onGenerateAudio={onGenerateAudio}
          />
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-900/50 rounded-lg border border-gray-700 flex flex-col items-center">
        {finalVideoUrl ? (
             <a
                href={finalVideoUrl}
                download={`video-story.mp4`}
                className="w-full max-w-sm bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105"
            >
                <DownloadIcon />
                <span className="ml-2">下載最終影片</span>
            </a>
        ) : (
            <button
            onClick={handleCombineVideo}
            disabled={!areAllAssetsReady || isCombining}
            className="w-full max-w-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
            {isCombining ? <LoadingSpinner /> : <DownloadIcon />}
            <span className="ml-2">全部組合成一個影片</span>
            </button>
        )}
        {!areAllAssetsReady && <p className="text-xs text-gray-400 mt-2">請先為所有場景成功生成影片和旁白</p>}
        {finalVideoUrl && <p className="text-xs text-gray-400 mt-2">注意：此為預覽版本，僅提供第一個場景的影片下載。</p>}
      </div>
    </div>
  );
};

export default StoryboardEditor;
