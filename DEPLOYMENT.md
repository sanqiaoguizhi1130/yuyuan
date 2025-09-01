# 人脸识别功能部署说明

## 问题描述
生产环境遇到CORS跨域问题，无法直接调用百度AI API。

## 解决方案：代理服务器

### 1. 部署代理服务器

#### 选项A：使用现有服务器
如果你有服务器控制权，可以在现有服务器上配置代理。

#### 选项B：部署独立代理服务器
1. 上传 `proxy-server.js` 和 `package-proxy.json` 到服务器
2. 安装依赖：
   ```bash
   npm install
   ```
3. 启动服务：
   ```bash
   npm start
   ```

### 2. 配置域名和SSL
1. 为代理服务器配置域名（如：`api.yuyuan.xz.cn`）
2. 配置SSL证书
3. 更新Vue组件中的代理服务器URL

### 3. 使用PM2管理进程（推荐）
```bash
npm install -g pm2
pm2 start proxy-server.js --name "baidu-proxy"
pm2 save
pm2 startup
```

## 配置说明

### 代理服务器配置
- 端口：3001（可通过环境变量PORT修改）
- 支持域名：`https://www.yuyuan.xz.cn`, `http://localhost:8080`
- 健康检查：`/health`

### Vue组件配置
需要将 `https://your-proxy-server.com` 替换为实际的代理服务器域名。

## 测试
1. 访问健康检查接口：`https://your-domain.com/health`
2. 测试人脸识别功能
3. 检查控制台日志

## 故障排除
- 检查代理服务器是否正常运行
- 验证域名和SSL配置
- 查看服务器日志
- 确认防火墙设置

## 安全注意事项
- 代理服务器应该只允许特定域名访问
- 考虑添加API密钥验证
- 监控API调用频率
- 定期更新依赖包
