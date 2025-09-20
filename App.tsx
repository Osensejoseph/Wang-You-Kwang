import React, { useState, useCallback } from 'react';
import StoryInput from './components/StoryInput';
import SynopsisViewer from './components/SynopsisViewer';
import StoryboardEditor from './components/StoryboardEditor';
import StatusBar from './components/StatusBar';
import { SparklesIcon } from './components/icons';
import { AppStep } from './types';
import type { Scene } from './types';
import {
  generateSynopsis,
  generateFullStory,
  generateStoryboard,
  generateImage,
  generateVideo,
  generateAudio,
} from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  const [storyTopic, setStoryTopic] = useState('');
  const [storySynopsis, setStorySynopsis] = useState('');
  const [storyContent, setStoryContent] = useState('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  
  const updateStatus = (message: string, loading: boolean) => {
    setStatusMessage(message);
    setIsLoading(loading);
  };

  const handleGenerateSynopsis = async (topic: string) => {
    setStoryTopic(topic);
    updateStatus('正在生成故事大綱...', true);
    try {
      const synopsis = await generateSynopsis(topic);
      setStorySynopsis(synopsis);
      setStep(AppStep.SYNOPSIS);
      updateStatus('故事大綱已生成！', false);
    } catch (error) {
      console.error(error);
      updateStatus(`生成大綱失敗: ${error instanceof Error ? error.message : '未知錯誤'}`, false);
    }
  };

  const handleGenerateFullStory = async () => {
    updateStatus('正在擴寫為完整故事...', true);
    try {
      const fullStory = await generateFullStory(storySynopsis);
      setStoryContent(fullStory);
      await handleGenerateStoryboard(fullStory);
    } catch (error) {
      console.error(error);
      updateStatus(`生成完整故事失敗: ${error instanceof Error ? error.message : '未知錯誤'}`, false);
    }
  };
  
  const handleGenerateStoryboard = async (story: string) => {
    setStoryContent(story);
    updateStatus('正在生成分鏡腳本...', true);
    try {
      const storyboardData = await generateStoryboard(story);
      const initialScenes: Scene[] = storyboardData.map((data, index) => ({
        ...data,
        id: index + 1,
        imageStatus: 'idle',
        videoStatus: 'idle',
        audioStatus: 'idle',
      }));
      setScenes(initialScenes);
      setStep(AppStep.STORYBOARD);
      updateStatus('分鏡腳本已生成！請編輯並生成素材。', false);
    } catch (error) {
      console.error(error);
      updateStatus(`生成分鏡腳本失敗: ${error instanceof Error ? error.message : '未知錯誤'}`, false);
    }
  };

  const handleStoryInput = (type: 'topic' | 'full', content: string) => {
    if (type === 'topic') {
      handleGenerateSynopsis(content);
    } else {
      handleGenerateStoryboard(content);
    }
  };

  const updateSceneState = (sceneId: number, updates: Partial<Scene>) => {
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, ...updates } : s));
  };
  
  const handleGenerateImage = useCallback(async (sceneId: number, style: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;
    
    updateStatus(`場景 ${sceneId} 圖片生成中...`, true);
    updateSceneState(sceneId, { imageStatus: 'loading', imageError: undefined });

    try {
      const imageUrl = await generateImage(scene.imagePrompt, style);
      updateSceneState(sceneId, { imageStatus: 'success', imageUrl });
      updateStatus(`場景 ${sceneId} 圖片生成成功！`, false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      updateSceneState(sceneId, { imageStatus: 'error', imageError: errorMessage });
      updateStatus(`場景 ${sceneId} 圖片生成失敗。`, false);
    }
  }, [scenes]);

  const handleGenerateVideo = useCallback(async (sceneId: number) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene || !scene.imageUrl) return;

    const onStatusUpdate = (message: string) => {
      updateStatus(`場景 ${sceneId}: ${message}`, true);
    };

    onStatusUpdate(`影片生成中... (可能需要幾分鐘)`);
    updateSceneState(sceneId, { videoStatus: 'loading', videoError: undefined });

    try {
      const { videoUrl, finalPrompt } = await generateVideo(scene.imageUrl, scene.animationPrompt, onStatusUpdate);
      updateSceneState(sceneId, { 
        videoStatus: 'success', 
        videoUrl,
        animationPrompt: finalPrompt 
      });
      updateStatus(`場景 ${sceneId} 影片生成成功！`, false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      updateSceneState(sceneId, { videoStatus: 'error', videoError: errorMessage });
      updateStatus(`場景 ${sceneId} 影片生成失敗。`, false);
    }
  }, [scenes]);

  const handleGenerateAudio = useCallback(async (sceneId: number) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;

    updateStatus(`場景 ${sceneId} 旁白播放中...`, true);
    updateSceneState(sceneId, { audioStatus: 'loading', audioError: undefined });

    try {
      await generateAudio(scene.narration);
      updateSceneState(sceneId, { audioStatus: 'success', audioUrl: undefined });
      updateStatus(`場景 ${sceneId} 旁白播放完畢。`, false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      updateSceneState(sceneId, { audioStatus: 'error', audioError: errorMessage });
      updateStatus(`場景 ${sceneId} 旁白生成失敗。`, false);
    }
  }, [scenes]);


  const renderStep = () => {
    switch (step) {
      case AppStep.INPUT:
        return <StoryInput onGenerate={handleStoryInput} isLoading={isLoading} />;
      case AppStep.SYNOPSIS:
        return (
          <SynopsisViewer
            synopsis={storySynopsis}
            onAccept={handleGenerateFullStory}
            onRegenerate={() => handleGenerateSynopsis(storyTopic)}
            isLoading={isLoading}
          />
        );
      case AppStep.STORYBOARD:
        return (
          <StoryboardEditor
            storyContent={storyContent}
            scenes={scenes}
            setScenes={setScenes}
            onGenerateImage={handleGenerateImage}
            onGenerateVideo={handleGenerateVideo}
            onGenerateAudio={handleGenerateAudio}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-purple-500/30">
        <div className="absolute inset-0 -z-10 h-full w-full bg-gray-900 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-600/30 opacity-20 blur-[100px]"></div>
        </div>

        <header className="py-6 text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold flex items-center justify-center gap-3 bg-clip-text text-transparent bg-gradient-to-br from-gray-200 to-gray-500">
                <SparklesIcon className="w-10 h-10 text-purple-400" />
                影片製作神器
            </h1>
            <p className="mt-2 text-gray-400">AI 驅動的全自動影片生成工具</p>
        </header>

        <main className="container mx-auto px-4 pb-24">
            <div className="flex justify-center items-start">
              {renderStep()}
            </div>
        </main>
        
        <StatusBar message={statusMessage} isLoading={isLoading} />
    </div>
  );
};

export default App;