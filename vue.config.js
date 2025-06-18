const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8080, // 在這裡指定你想要的埠號，或下命令 npm run serve -- --port 8080
    // host: '0.0.0.0', // 如果你希望其他裝置也能透過 IP 訪問，可以取消註解這行
  }
})
