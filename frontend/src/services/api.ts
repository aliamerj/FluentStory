import axios from 'axios';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 
                 process.env.EXPO_PUBLIC_BACKEND_URL || 
                 'https://wordgroup-app.preview.emergentagent.com';

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds for AI generation
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Story APIs
export const storyApi = {
  generate: (userId: string, data: {
    language: string;
    level: string;
    topic: string;
    content_type: string;
    custom_topic?: string;
  }) => api.post(`/stories/generate?user_id=${userId}`, data),
  
  getAll: (userId: string, limit = 50) => 
    api.get(`/stories/${userId}?limit=${limit}`),
  
  getOne: (storyId: string) => 
    api.get(`/stories/single/${storyId}`),
  
  delete: (storyId: string) => 
    api.delete(`/stories/${storyId}`),
};

// Word APIs
export const wordApi = {
  translate: (word: string, sourceLanguage: string, targetLanguage: string) =>
    api.post('/words/translate', { word, source_language: sourceLanguage, target_language: targetLanguage }),
  
  save: (userId: string, data: {
    word: string;
    context_sentence: string;
    source_story_id?: string;
    source_language: string;
    native_language: string;
  }) => api.post(`/words/save?user_id=${userId}`, data),
  
  getAll: (userId: string, filterType = 'all') =>
    api.get(`/words/${userId}?filter_type=${filterType}`),
  
  delete: (wordId: string, userId: string) =>
    api.delete(`/words/${wordId}?user_id=${userId}`),
};

// Review APIs
export const reviewApi = {
  getDue: (userId: string) =>
    api.get(`/reviews/due/${userId}`),
  
  submit: (userId: string, wordId: string, correct: boolean) =>
    api.post(`/reviews/submit?user_id=${userId}`, { word_id: wordId, correct }),
};

// Stats API
export const statsApi = {
  get: (userId: string) => api.get(`/stats/${userId}`),
};

// TTS API - AI-powered natural speech
export const ttsApi = {
  generate: (text: string, voice: string = 'alloy', speed: number = 1.0) =>
    api.post('/tts/generate', { text, voice, speed }),
};

// Feedback API
export const feedbackApi = {
  submit: (userId: string, data: {
    rating?: number;
    message: string;
    category?: string;
    user_context?: any;
  }) => api.post(`/feedback/submit?user_id=${userId}`, data),
  
  getAll: (userId: string, limit = 50) =>
    api.get(`/feedback/${userId}?limit=${limit}`),
};
