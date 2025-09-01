# Vercel部署说明 - 人脸识别功能

## 配置文件

### vercel.json
这是Vercel的配置文件，包含：
- 代理规则：将 `/api/baidu/*` 请求转发到百度AI API
- CORS头设置：解决跨域问题

## 部署步骤

### 1. 确保文件结构
```
your-project/
├── vercel.json          # Vercel配置
├── src/                 # Vue源码
├── public/              # 静态资源
└── package.json         # 项目依赖
```

### 2. 部署到Vercel
```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 部署项目
vercel

# 或者直接部署到生产环境
vercel --prod
```

### 3. 验证配置
部署完成后，访问：
- `https://your-domain.vercel.app/api/baidu/oauth/2.0/token?grant_type=client_credentials&client_id=test&client_secret=test`

应该返回百度AI的响应（可能是错误信息，但不会再有CORS问题）。

## 配置说明

### 代理规则
```json
{
  "rewrites": [
    {
      "source": "/api/baidu/(.*)",
      "destination": "https://aip.baidubce.com/$1"
    }
  ]
}
```

### CORS头设置
```json
{
  "headers": [
    {
      "source": "/api/baidu/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://www.yuyuan.xz.cn"
        }
      ]
    }
  ]
}
```

## 故障排除

### 1. 配置文件冲突
如果遇到配置冲突错误：
- 确保只存在 `vercel.json` 文件
- 删除 `now.json` 文件（如果存在）
- 删除 `.vercel` 目录（如果存在）

### 2. 代理不工作
- 检查 `vercel.json` 语法是否正确
- 确认部署后配置已生效
- 查看Vercel部署日志

### 3. CORS问题仍然存在
- 确认域名配置正确
- 检查Vercel部署状态
- 清除浏览器缓存

## 测试

部署完成后，在浏览器控制台运行：
```javascript
fetch('https://your-domain.vercel.app/api/baidu/oauth/2.0/token?grant_type=client_credentials&client_id=test&client_secret=test')
  .then(response => console.log('状态:', response.status))
  .catch(error => console.error('错误:', error));
```

应该不再有CORS错误。
