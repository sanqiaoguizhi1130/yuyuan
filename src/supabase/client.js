import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL;
const supabaseKey = process.env.VUE_APP_SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) {
    throw new Error(`
    找不到环境变量！
    请检查.env文件是否包含：
    VUE_APP_SUPABASE_URL=你的项目URL
    VUE_APP_SUPABASE_KEY=你的anon key
  `)
}
console.log('[安全调试] 环境参数:', {
    url: process.env.VUE_APP_SUPABASE_URL,
    key: process.env.VUE_APP_SUPABASE_KEY ?.slice(0, 6) + '...'
})

export const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'public', convertCamelCaseToSnakeCase: true },
    auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true
    }
})
// 添加存储初始化校验
supabase.storage.getBucket('photos')
  .then(res => {
    if (res.error) throw new Error(`存储桶连接失败: ${res.error.message}`);
    console.log('✔️ 存储桶连接成功');
  })
  .catch(err => {
    console.error('❌ 严重错误:', err);
    throw err; // 阻止应用继续运行
  });
  window.supabase = supabase;
