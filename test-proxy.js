// 测试Vercel代理是否正常工作
const testProxy = async () => {
  const baseUrl = 'https://www.yuyuan.xz.cn';
  
  console.log('🧪 开始测试Vercel代理...');
  
  try {
    // 测试健康检查
    console.log('1. 测试健康检查...');
    const healthResponse = await fetch(`${baseUrl}/api/baidu/oauth/2.0/token?grant_type=client_credentials&client_id=test&client_secret=test`);
    console.log('健康检查状态:', healthResponse.status);
    console.log('健康检查头信息:', Object.fromEntries(healthResponse.headers.entries()));
    
    if (healthResponse.ok) {
      console.log('✅ 代理连接正常');
    } else {
      console.log('❌ 代理连接失败');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
};

// 如果直接运行此脚本
if (typeof window === 'undefined') {
  // Node.js环境
  const fetch = require('node-fetch');
  testProxy();
} else {
  // 浏览器环境
  testProxy();
}
