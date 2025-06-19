<template>
  <div class="ai-assistant">
    <h1>英語學習 AI 助理</h1>
    <div class="input-section">
      <input
        v-model="userPrompt"
        @keyup.enter="sendMessage"
        placeholder="輸入你的問題或練習內容..."
        class="prompt-input"
        :disabled="isLoading"
      />
      <button @click="sendMessage" :disabled="isLoading" class="send-button">
        {{ isLoading ? '發送中...' : '發送' }}
      </button>
    </div>

    <div v-if="aiResponse" class="response-section">
      <p class="ai-text">{{ aiResponse }}</p>
      <button @click="speakResponse" :disabled="!aiResponse || isSpeaking" class="speak-button">
        {{ isSpeaking ? '播放中...' : '再次播放語音' }}
      </button>
    </div>

    <div v-if="error" class="error-message">
      <p>錯誤: {{ error }}</p>
      <p>請檢查後端伺服器是否運行，API Key 或模型配置是否正確。</p>
    </div>

    <div v-if="currentAnimationId" class="debug-info">
      當前動畫ID: {{ currentAnimationId }}
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AIAssistant',
  data() {
    return {
      userPrompt: '',
      aiResponse: '',
      // audioUrl: '', // 不再需要這個
      currentAnimationId: 'idle',
      isLoading: false,
      error: null,
      backendUrl: 'http://localhost:3001/api/interact-with-gemini',
      isSpeaking: false, // 新增：控制語音播放狀態
      synth: null, // Web Speech API 的 SpeechSynthesisUterrance 實例
      voice: null, // 選定的語音
    };
  },
  mounted() {
    // 在組件掛載時初始化 Web Speech API
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      // 在語音列表載入後選擇一個語音
      this.synth.onvoiceschanged = () => {
        this.loadVoices();
      };
    } else {
      console.warn('您的瀏覽器不支持 Web Speech API。');
    }
  },
  methods: {
    loadVoices() {
      const voices = this.synth.getVoices();
      // 嘗試找到一個中文（台灣）的語音
      // 你可以根據需要調整語言代碼和語音名稱
      this.voice = voices.find(
        voice => voice.lang === 'zh-TW' && voice.name.includes('Google') || voice.lang === 'zh-TW'
      ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0]; // 退而求其次找英文或第一個
      
      if (!this.voice) {
        console.warn('未找到合適的語音，可能語音列表尚未完全載入或瀏覽器無支持語音。');
      }
    },
    async sendMessage() {
      if (!this.userPrompt.trim()) {
        alert('請輸入內容！');
        return;
      }

      this.isLoading = true;
      this.error = null;
      this.aiResponse = '';
      this.stopSpeaking(); // 發送新訊息前停止當前語音

      this.$emit('update-animation', 'listening');

      try {
        const response = await axios.post(this.backendUrl, {
          prompt: this.userPrompt,
        });

        const data = response.data;
        this.aiResponse = data.text;
        this.currentAnimationId = data.animationId;

        this.$emit('update-animation', data.animationId);

        this.userPrompt = '';

        // 收到 AI 回應後，立即播放語音
        this.speakResponse();

      } catch (error) {
        console.error('從後端獲取回應時出錯:', error);
        this.error = error.response ? error.response.data.error || error.response.data.details || JSON.stringify(error.response.data) : error.message;

        this.$emit('update-animation', 'error');
      } finally {
        this.isLoading = false;
      }
    },
    speakResponse() {
      if (!this.aiResponse || !this.synth) {
        console.warn('沒有文本或語音合成器不可用。');
        return;
      }

      this.stopSpeaking(); // 確保每次只播放一個語音

      const utterance = new SpeechSynthesisUtterance(this.aiResponse);

      if (this.voice) {
        utterance.voice = this.voice;
      } else {
        // 如果沒有找到特定語音，可以使用預設語音
        utterance.lang = 'en-US'; // 預設英文
        console.warn('使用預設語音 (en-US)。');
      }
      
      utterance.pitch = 1; // 音高 (0 to 2)
      utterance.rate = 1;  // 語速 (0.1 to 10)
      utterance.volume = 1; // 音量 (0 to 1)

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.$emit('update-animation', 'speaking'); // 語音播放時觸發 'speaking' 動畫
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.$emit('update-animation', 'idle'); // 語音播放結束時觸發 'idle' 動畫
      };

      utterance.onerror = (event) => {
        console.error('語音播放錯誤:', event.error);
        this.isSpeaking = false;
        this.$emit('update-animation', 'error');
      };

      this.synth.speak(utterance);
    },
    stopSpeaking() {
      if (this.synth && this.synth.speaking) {
        this.synth.cancel(); // 停止當前正在播放的語音
        this.isSpeaking = false;
        this.$emit('update-animation', 'idle');
      }
    },
    // onAudioEnded() 方法不再需要
  },
  beforeUnmount() {
    // 組件銷毀前停止任何正在播放的語音
    this.stopSpeaking();
  }
};
</script>

<style scoped>
/* 樣式基本保持不變，新增 .speak-button 樣式 */
.ai-assistant {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f0f2f5;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 700px;
  margin: 20px auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  color: #333;
  margin-bottom: 25px;
  font-size: 2em;
}

.input-section {
  display: flex;
  width: 100%;
  margin-bottom: 20px;
  gap: 10px;
}

.prompt-input {
  flex-grow: 1;
  padding: 12px 15px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1em;
  transition: border-color 0.3s ease;
}

.prompt-input:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
}

.send-button {
  padding: 12px 25px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.1s ease;
}

.send-button:hover:not(:disabled) {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.send-button:active:not(:disabled) {
  transform: translateY(0);
}

.send-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.response-section {
  width: 100%;
  background-color: #e9ecef;
  padding: 15px;
  border-radius: 8px;
  text-align: left;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px; /* 新增間距 */
}

.ai-text {
  color: #495057;
  font-size: 1.1em;
  line-height: 1.6;
  white-space: pre-wrap;
}

/* 移除 audio 標籤的樣式，因為不再使用 */
/* audio {
  width: 100%;
  margin-top: 15px;
} */

.speak-button {
  padding: 8px 15px;
  background-color: #28a745; /* 綠色按鈕 */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.3s ease;
}

.speak-button:hover:not(:disabled) {
  background-color: #218838;
}

.speak-button:disabled {
  background-color: #90ee90; /* 淺綠色禁用狀態 */
  cursor: not-allowed;
}


.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 10px 15px;
  margin-top: 20px;
  border-radius: 5px;
  width: 100%;
  text-align: left;
}

.debug-info {
  margin-top: 15px;
  font-size: 0.9em;
  color: #6c757d;
  background-color: #f8f9fa;
  padding: 8px 12px;
  border-radius: 4px;
}
</style>