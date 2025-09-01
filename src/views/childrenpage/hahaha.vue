<template>
  <div class="face-recognition">
    <div class="container">
      <h2>人脸识别分析</h2>
      
      <!-- 环境提示 -->
      <div v-if="isProduction" class="env-notice">
        <p>🌐 当前运行在生产环境</p>
        <p v-if="!hasProxySupport" class="warning">
          ⚠️ 检测到可能的跨域问题，如果遇到错误，请联系管理员配置服务器代理
        </p>
      </div>
      
      <div class="upload-section">
        <div class="form">
          <input 
            type="file" 
            ref="fileInput"
            @change="handleFileChange" 
            accept="image/*"
            class="file-input"
          />
          <button 
            @click="uploadImage" 
            :disabled="!selectedFile || isUploading"
            class="upload-btn"
          >
            {{ isUploading ? '分析中...' : '开始分析' }}
          </button>
        </div>
      </div>

      <div v-if="analysisResult" class="result-section">
        <div class="image-preview">
          <img :src="imagePreview" alt="上传的图片" class="preview-img" />
        </div>
        
        <div class="analysis-details">
          <h3>分析结果</h3>
          <div class="detail-item">
            <span class="label">检测到的人脸数：</span>
            <span class="value">{{ analysisResult.face_num }}</span>
          </div>
          <div class="detail-item">
            <span class="label">年龄：</span>
            <span class="value">{{ analysisResult.age }}岁</span>
          </div>
          <div class="detail-item">
            <span class="label">颜值评分：</span>
            <span class="value">{{ analysisResult.beauty }}分</span>
          </div>
          <div class="detail-item">
            <span class="label">性别：</span>
            <span class="value">{{ getGenderText(analysisResult.gender) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">种族：</span>
            <span class="value">{{ getRaceText(analysisResult.race) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">表情：</span>
            <span class="value">{{ getExpressionText(analysisResult.expression) }}</span>
          </div>
        </div>
      </div>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FaceRecognition',
  data() {
    return {
      selectedFile: null,
      imagePreview: null,
      isUploading: false,
      analysisResult: null,
      errorMessage: '',
      // 环境检测
      isProduction: process.env.NODE_ENV === 'production',
      hasProxySupport: false,
      // 百度AI配置
      baiduConfig: {
        apiKey: 'NlagRTGdRIVRKWsRB3vs6xoj',
        secretKey: 'ibwD1PMUCOnMVQdbAcnqE1vjlEKu9eTA'
      }
    }
  },
  mounted() {
    // 检测代理支持
    this.checkProxySupport()
  },
  methods: {
    async checkProxySupport() {
      if (this.isProduction) {
        try {
          // 尝试访问代理路径
          const response = await fetch('/api/baidu/oauth/2.0/token?grant_type=client_credentials&client_id=test&client_secret=test')
          this.hasProxySupport = response.ok
        } catch (error) {
          this.hasProxySupport = false
        }
      }
    },
    handleFileChange(event) {
      const file = event.target.files[0]
      if (file) {
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
          this.errorMessage = '请选择图片文件'
          return
        }
        
        // 验证文件大小 (200KB)
        if (file.size > 204800) {
          this.errorMessage = '文件大小不能超过200KB'
          return
        }
        
        this.selectedFile = file
        this.errorMessage = ''
        
        // 预览图片
        const reader = new FileReader()
        reader.onload = (e) => {
          this.imagePreview = e.target.result
        }
        reader.readAsDataURL(file)
      }
    },
    
    async uploadImage() {
      if (!this.selectedFile) return
      
      this.isUploading = true
      this.errorMessage = ''
      
      try {
        // 获取访问令牌
        const token = await this.getBaiduToken()
        
        // 转换图片为base64
        const base64Image = await this.fileToBase64(this.selectedFile)
        
        // 调用百度AI人脸识别API
        const result = await this.analyzeFace(token, base64Image)
        
        if (result.error_msg === 'SUCCESS') {
          this.analysisResult = {
            face_num: result.result.face_num,
            age: result.result.face_list[0].age,
            beauty: result.result.face_list[0].beauty,
            gender: result.result.face_list[0].gender.type,
            race: result.result.face_list[0].race.type,
            expression: result.result.face_list[0].expression.type
          }
        } else {
          this.errorMessage = `识别失败: ${result.error_msg}`
        }
      } catch (error) {
        console.error('人脸识别完整错误:', error)
        
        // 提供更友好的错误信息
        if (error.message.includes('JSON')) {
          this.errorMessage = '服务器响应格式错误，可能是网络或服务器配置问题。请检查网络连接或联系管理员。'
        } else if (error.message.includes('CORS')) {
          this.errorMessage = '跨域请求被阻止，这是生产环境的常见问题。请联系管理员配置服务器。'
        } else if (error.message.includes('fetch')) {
          this.errorMessage = '网络请求失败，请检查网络连接。'
        } else {
          this.errorMessage = `请求失败: ${error.message}`
        }
      } finally {
        this.isUploading = false
      }
    },
    
    async getBaiduToken() {
      // 根据环境选择不同的URL
      const isDev = process.env.NODE_ENV === 'development'
      const baseUrl = isDev ? '/api/baidu' : 'https://aip.baidubce.com'
      const url = `${baseUrl}/oauth/2.0/token`
      
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.baiduConfig.apiKey,
        client_secret: this.baiduConfig.secretKey
      })
      
      try {
        console.log('正在请求百度AI token，URL:', url)
        const response = await fetch(`${url}?${params}`)
        
        console.log('响应状态:', response.status, response.statusText)
        console.log('响应头:', Object.fromEntries(response.headers.entries()))
        
        // 检查响应状态
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        // 检查响应类型
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('响应不是JSON格式:', contentType)
          // 尝试读取响应文本进行调试
          const text = await response.text()
          console.log('响应内容:', text.substring(0, 200) + '...')
          throw new Error('服务器返回的不是JSON格式数据')
        }
        
        const data = await response.json()
        console.log('获取到的token数据:', data)
        
        if (data.access_token) {
          return data.access_token
        } else {
          throw new Error('获取访问令牌失败')
        }
      } catch (error) {
        console.error('获取百度AI token失败:', error)
        throw new Error(`获取访问令牌失败: ${error.message}`)
      }
    },
    
    async analyzeFace(token, base64Image) {
      // 根据环境选择不同的URL
      const isDev = process.env.NODE_ENV === 'development'
      const baseUrl = isDev ? '/api/baidu' : 'https://aip.baidubce.com'
      const url = `${baseUrl}/rest/2.0/face/v3/detect?access_token=${token}`
      
      const body = {
        image: base64Image,
        image_type: 'BASE64',
        face_field: 'gender,age,beauty,gender,race,expression',
        face_type: 'LIVE'
      }
      
      try {
        console.log('正在请求人脸识别，URL:', url)
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        })
        
        console.log('响应状态:', response.status, response.statusText)
        console.log('响应头:', Object.fromEntries(response.headers.entries()))
        
        // 检查响应状态
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        // 检查响应类型
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('响应不是JSON格式:', contentType)
          // 尝试读取响应文本进行调试
          const text = await response.text()
          console.log('响应内容:', text.substring(0, 200) + '...')
          throw new Error('服务器返回的不是JSON格式数据')
        }
        
        const result = await response.json()
        console.log('人脸识别结果:', result)
        return result
      } catch (error) {
        console.error('人脸识别失败:', error)
        throw new Error(`人脸识别失败: ${error.message}`)
      }
    },
    
    fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result
          // 移除data:image/xxx;base64,前缀
          const base64Data = base64.split(',')[1]
          resolve(base64Data)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    },
    
    getGenderText(gender) {
      const genderMap = {
        male: '男性',
        female: '女性'
      }
      return genderMap[gender] || gender
    },
    
    getRaceText(race) {
      const raceMap = {
        yellow: '黄种人',
        white: '白种人',
        black: '黑种人',
        arabs: '阿拉伯人'
      }
      return raceMap[race] || race
    },
    
    getExpressionText(expression) {
      const expressionMap = {
        none: '不笑',
        smile: '微笑',
        laugh: '大笑'
      }
      return expressionMap[expression] || expression
    }
  }
}
</script>

<style scoped>
.face-recognition {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.container {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 28px;
}

.env-notice {
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  text-align: center;
}

.env-notice p {
  margin: 5px 0;
  color: #1976d2;
  font-size: 14px;
}

.env-notice .warning {
  color: #f57c00;
  font-weight: 600;
}

.upload-section {
  margin-bottom: 30px;
}

.form {
  display: flex;
  gap: 15px;
  align-items: center;
  justify-content: center;
}

.file-input {
  padding: 12px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  background: #f9f9f9;
  cursor: pointer;
}

.file-input:hover {
  border-color: #007bff;
  background: #f0f8ff;
}

.upload-btn {
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s;
}

.upload-btn:hover:not(:disabled) {
  background: #0056b3;
}

.upload-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result-section {
  margin-top: 30px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  align-items: start;
}

.image-preview {
  text-align: center;
}

.preview-img {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.analysis-details {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.analysis-details h3 {
  margin-bottom: 20px;
  color: #333;
  text-align: center;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.detail-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: 600;
  color: #555;
}

.value {
  color: #007bff;
  font-weight: 500;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .result-section {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .container {
    padding: 20px;
  }
}
</style>
 