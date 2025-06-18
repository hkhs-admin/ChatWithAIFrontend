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
      <audio ref="audioPlayer" :src="audioUrl" controls autoplay @ended="onAudioEnded"></audio>
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
import axios from 'axios'; // 引入 axios 用於發送 HTTP 請求

export default {
  name: 'AIAssistant',
  data() {
    return {
      userPrompt: '',
      aiResponse: '',
      audioUrl: '',
      currentAnimationId: 'idle', // 初始動畫狀態
      isLoading: false, // 控制按鈕和輸入框的禁用狀態
      error: null, // 用於顯示錯誤信息
      backendUrl: 'http://localhost:3001/api/interact-with-gemini', // 你的後端 API URL
    };
  },
  methods: {
    async sendMessage() {
      if (!this.userPrompt.trim()) {
        alert('請輸入內容！');
        return;
      }

      this.isLoading = true; // 開始發送請求，設置加載狀態
      this.error = null; // 清除之前的錯誤
      this.aiResponse = ''; // 清除之前的 AI 回應
      this.audioUrl = ''; // 清除之前的音訊 URL

      // 向父組件發送一個事件，通知動畫ID更新為 'listening'
      this.$emit('update-animation', 'listening');

      try {
        const response = await axios.post(this.backendUrl, {
          prompt: this.userPrompt,
          language: 'zh-TW', // 你可以根據需要傳遞語言
        });

        const data = response.data;
        this.aiResponse = data.text;
        this.audioUrl = data.audioUrl;
        this.currentAnimationId = data.animationId;

        // 向父組件發送一個事件，通知動畫ID更新為模型回應後的動畫
        this.$emit('update-animation', data.animationId);

        // 清空輸入框
        this.userPrompt = '';

        // 等待音訊播放結束或處理其他邏輯
        this.$nextTick(() => {
          if (this.$refs.audioPlayer && this.audioUrl) {
            this.$refs.audioPlayer.play().catch(e => {
              console.error("音訊播放失敗:", e);
              // 如果自動播放失敗，通常是因為瀏覽器的限制，或音訊URL有誤
              // 你可以提示用戶手動點擊播放按鈕
            });
          }
        });

      } catch (error) {
        console.error('從後端獲取回應時出錯:', error);
        this.error = error.response ? error.response.data.error || error.response.data.details || JSON.stringify(error.response.data) : error.message;

        // 如果出錯，將動畫ID設置為 'error' 或 'idle'
        this.$emit('update-animation', 'error'); // 假設有一個 'error' 動畫
      } finally {
        this.isLoading = false; // 請求結束，取消加載狀態
      }
    },
    onAudioEnded() {
      console.log('音訊播放結束');
      // 音訊播放結束後，將動畫ID設置回 'idle'
      this.$emit('update-animation', 'idle');
    }
  },
  watch: {
    // 這裡AIAssistant是發送動畫ID給App.vue，所以此處不需要watch
    // 如果未來AIAssistant要接收App.vue的動畫控制，則需要這個watch
  }
};
</script>

<style scoped>
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
  gap: 10px; /* 增加間距 */
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
  min-height: 80px; /* 最小高度 */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.ai-text {
  color: #495057;
  font-size: 1.1em;
  line-height: 1.6;
  white-space: pre-wrap; /* 保持換行符 */
}

audio {
  width: 100%;
  margin-top: 15px;
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