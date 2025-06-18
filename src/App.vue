<template>
  <div id="app">
    <div class="model-placeholder">
      <p>3D 模型顯示區</p>
      <p>當前模型動畫狀態: <strong>{{ sharedAnimationId }}</strong></p>
      </div>
    <AIAssistant @update-animation="handleAnimationUpdate" />
  </div>
</template>

<script>
import AIAssistant from './components/AIAssistant.vue';

export default {
  name: 'App',
  components: {
    AIAssistant,
  },
  data() {
    return {
      sharedAnimationId: 'idle', // 管理共享的動畫ID
    };
  },
  methods: {
    handleAnimationUpdate(newAnimationId) {
      console.log('App.vue 收到動畫更新:', newAnimationId);
      this.sharedAnimationId = newAnimationId;
      // 在這裡，你可以將這個 newAnimationId 傳遞給你實際的 3D 模型組件
      // 例如：this.$refs.your3DModel.setAnimation(newAnimationId);
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.model-placeholder {
  width: 100%;
  max-width: 600px;
  height: 250px;
  background-color: #e0e0e0;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
  border: 2px dashed #9e9e9e;
  color: #616161;
}

.model-placeholder p {
  margin: 5px 0;
  font-size: 1.1em;
}
</style>