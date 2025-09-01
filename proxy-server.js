const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3001;

// 启用CORS
app.use(cors({
  origin: ['https://www.yuyuan.xz.cn', 'http://localhost:8080'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 代理百度AI获取token的请求
app.get('/api/baidu/oauth/2.0/token', async (req, res) => {
  try {
    const { client_id, client_secret } = req.query;
    
    console.log('正在获取百度AI token...');
    
    const response = await axios.get('https://aip.baidubce.com/oauth/2.0/token', {
      params: {
        grant_type: 'client_credentials',
        client_id,
        client_secret
      },
      timeout: 10000
    });
    
    console.log('百度AI token获取成功');
    res.json(response.data);
  } catch (error) {
    console.error('获取百度AI token失败:', error.message);
    res.status(500).json({ 
      error: '获取token失败', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 代理百度AI人脸识别的请求
app.post('/api/baidu/rest/2.0/face/v3/detect', async (req, res) => {
  try {
    const { access_token, image, image_type, face_field, face_type } = req.body;
    
    console.log('正在调用人脸识别API...');
    
    const response = await axios.post(`https://aip.baidubce.com/rest/2.0/face/v3/detect?access_token=${access_token}`, {
      image,
      image_type,
      face_field,
      face_type
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log('人脸识别API调用成功');
    res.json(response.data);
  } catch (error) {
    console.error('人脸识别失败:', error.message);
    res.status(500).json({ 
      error: '人脸识别失败', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 代理服务器运行在端口 ${PORT}`);
  console.log(`📡 支持域名: https://www.yuyuan.xz.cn, http://localhost:8080`);
  console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
});
