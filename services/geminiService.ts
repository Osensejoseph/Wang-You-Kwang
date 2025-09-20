import { GoogleGenAI, Type } from "@google/genai";
import type { Scene } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY 環境變數未設定");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const textModel = 'gemini-2.5-flash';
const imageModel = 'imagen-4.0-generate-001';
const videoModel = 'veo-2.0-generate-001';

// 內部輔助函數，用於修正可能包含敏感內容的提示詞
const revisePromptForSafety = async (prompt: string): Promise<string> => {
  const revisionPrompt = `請將以下用於AI影片生成的動畫提示詞，改寫成一個更中性、通用、安全、適合所有觀眾的版本。移除任何可能被視為敏感、暴力、具攻擊性或不當的詞語，並專注於視覺畫面的客觀描述。請直接回傳改寫後的新提示詞，不要包含任何額外的解釋或前言。

原始提示詞：「${prompt}」`;
  
  try {
    const response = await ai.models.generateContent({
      model: textModel,
      contents: revisionPrompt,
    });
    const revisedText = response.text.trim();
    console.log(`原始提示詞: "${prompt}" -> 修正後提示詞: "${revisedText}"`);
    return revisedText;
  } catch (e) {
    console.error("修正提示詞失敗:", e);
    // 如果修正失敗，返回原始提示詞以繼續流程
    return prompt; 
  }
};


export const generateSynopsis = async (topic: string): Promise<string> => {
  const prompt = `請根據這個主題：「${topic}」，構思一個大約100字的繁體中文故事大綱。`;
  const response = await ai.models.generateContent({
    model: textModel,
    contents: prompt,
  });
  return response.text;
};

export const generateFullStory = async (synopsis: string): Promise<string> => {
  const prompt = `請根據以下的故事大綱，將其擴寫成一篇大約500字的繁體中文完整故事。\n\n大綱：\n${synopsis}`;
  const response = await ai.models.generateContent({
    model: textModel,
    contents: prompt,
  });
  return response.text;
};

export const generateStoryboard = async (storyContent: string): Promise<Omit<Scene, 'id' | 'imageStatus' | 'videoStatus' | 'audioStatus'>[]> => {
  const prompt = `你是一位專業的影片分鏡腳本創作者。請根據以下故事內容，將其分解成一系列獨立的場景。每個場景必須包含：
1. 'narration': 一段60到80字的繁體中文旁白。
2. 'imagePrompt': 一段詳細的視覺描述，用於AI圖像生成器，風格應為史詩級、電影感。
3. 'animationPrompt': 一段簡短的動畫效果描述，例如 '鏡頭緩慢拉近', '鏡頭由左至右平移', '水面有微光閃爍'。

故事內容：
---
${storyContent}
---

請以合法的JSON格式輸出，作為一個場景物件的陣列。`;
  
  const response = await ai.models.generateContent({
    model: textModel,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            narration: { type: Type.STRING, description: '場景的旁白文字' },
            imagePrompt: { type: Type.STRING, description: '用於生成圖片的提示' },
            animationPrompt: { type: Type.STRING, description: '用於生成影片的動畫提示' },
          },
          required: ["narration", "imagePrompt", "animationPrompt"],
        },
      },
    }
  });

  try {
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("解析分鏡腳本JSON失敗:", e);
    throw new Error("無法解析AI回傳的分鏡腳本，請重試。");
  }
};

export const generateImage = async (prompt: string, style: string): Promise<string> => {
  const fullPrompt = `${prompt}, ${style}, 8k, high detail`;
  const response = await ai.models.generateImages({
    model: imageModel,
    prompt: fullPrompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: '16:9',
    },
  });
  const base64ImageBytes = response.generatedImages[0].image.imageBytes;
  return `data:image/jpeg;base64,${base64ImageBytes}`;
};


export const generateVideo = async (
    imageBase64: string,
    initialAnimationPrompt: string,
    onStatusUpdate: (message: string) => void
): Promise<{ videoUrl: string; finalPrompt: string; }> => {
    const maxRetries = 3;
    let currentPrompt = initialAnimationPrompt;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const base64Data = imageBase64.split(',')[1];

            let operation = await ai.models.generateVideos({
                model: videoModel,
                prompt: currentPrompt,
                image: {
                    imageBytes: base64Data,
                    mimeType: 'image/jpeg',
                },
                config: {
                    numberOfVideos: 1,
                },
            });

            const startTime = Date.now();
            const timeout = 5 * 60 * 1000; // 5 minutes

            while (!operation.done) {
                if (Date.now() - startTime > timeout) {
                    throw new Error("影片生成操作超時，請稍後再試。");
                }
                await new Promise(resolve => setTimeout(resolve, 15000)); // Poll every 15 seconds
                operation = await ai.operations.getVideosOperation({ operation: operation });
            }

            if (operation.error) {
                // FIX: Explicitly cast to string to handle cases where operation.error.message might not be a string.
                const errorMessage = String(operation.error.message || '未知API錯誤');
                // 觸發重試的特定錯誤條件
                if (attempt < maxRetries && /SAFETY|SENSITIVE|POLICY|REVIEW/i.test(errorMessage)) {
                     throw new Error(`SAFETY_RETRY_TRIGGER: ${errorMessage}`);
                }
                throw new Error(`API回報錯誤: ${errorMessage}`);
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (!downloadLink) {
                throw new Error("無法獲取影片連結。這可能是因為內容審核、提示詞問題或暫時的服務中斷。");
            }
            
            const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            if (!videoResponse.ok) {
                throw new Error(`影片下載失敗，伺服器回應狀態碼: ${videoResponse.status}`);
            }
            
            const videoBlob = await videoResponse.blob();
            return { videoUrl: URL.createObjectURL(videoBlob), finalPrompt: currentPrompt };

        } catch (error) {
             if (error instanceof Error) {
                const isSafetyError = /SAFETY|SENSITIVE|POLICY|REVIEW|審核|敏感/i.test(error.message) || error.message.includes('SAFETY_RETRY_TRIGGER');
                
                if (isSafetyError && attempt < maxRetries) {
                    onStatusUpdate(`提示詞可能包含敏感內容，正在嘗試自動修正... (第 ${attempt}/${maxRetries} 次)`);
                    currentPrompt = await revisePromptForSafety(currentPrompt);
                    onStatusUpdate(`已生成新提示詞，正在重試...`);
                    continue;
                } else {
                    console.error(`影片生成過程中發生錯誤 (嘗試 ${attempt}/${maxRetries}):`, error);
                    throw new Error(`影片生成失敗: ${error.message}`);
                }
            }
            throw new Error("發生未知的影片生成錯誤。");
        }
    }
    throw new Error("影片生成失敗：自動修正提示詞後仍然無法生成。");
};

export const generateAudio = async (text: string): Promise<void> => {
  // 注意：此功能使用瀏覽器內建的語音合成API，而非Gemini API。
  // 因此，最終合成的影片將不包含旁白音訊。
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      return reject(new Error("您的瀏覽器不支援語音合成。"));
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(new Error(`語音合成失敗: ${event.error}`));

    const speak = () => {
      const voices = window.speechSynthesis.getVoices();
      const chineseVoice = voices.find(voice => voice.lang === 'zh-TW');
      if (chineseVoice) {
        utterance.voice = chineseVoice;
      } else {
        console.warn("找不到繁體中文語音，將使用預設語音。");
      }
      utterance.lang = 'zh-TW';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speak;
    } else {
      speak();
    }
  });
};