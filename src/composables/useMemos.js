// src/composables/useMemos.js
import { ref } from 'vue'

export const useMemos = () => {
  const memos = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchMemos = async () => {
    try {
      loading.value = true
      const { data, error: sbError } = await window._supabase
        .from('memos')
        .select('*')
        .order('event_date', { ascending: true })

      if (sbError) throw sbError
      
      // 数据规范化处理
      memos.value = data.map(item => ({
        ...item,
        event_date: item.event_date || null,
        is_important: item.is_important || false
      }))
    } catch (e) {
      error.value = `数据加载失败: ${e.message}`
      console.error('[DB ERROR]', e)
    } finally {
      loading.value = false
    }
  }

  const saveMemo = async (memo) => {
    try {
      loading.value = true
      // 添加ESLint忽略规则
      // eslint-disable-next-line no-unused-vars
      const { data, error: sbError } = await window._supabase
        .from('memos')
        .upsert({
          ...memo,
          updated_at: new Date().toISOString()
        })
        .select() 
      if (sbError) throw sbError
      await fetchMemos()
      return true
    } catch (e) {
      error.value = `保存失败: ${e.message}`
      return false
    } finally {
      loading.value = false
    }
  }

  const deleteMemo = async (id) => {
    try {
      loading.value = true
      const { error: sbError } = await window._supabase
        .from('memos')
        .delete()
        .eq('id', id)

      if (sbError) throw sbError
      memos.value = memos.value.filter(m => m.id !== id)
      return true
    } catch (e) {
      error.value = `删除失败: ${e.message}`
      return false
    } finally {
      loading.value = false
    }
  }

  const toggleStar = async (id, currentState) => {
    try {
      const { error: sbError } = await window._supabase
        .from('memos')
        .update({ is_important: !currentState })
        .eq('id', id)

      if (sbError) throw sbError
      // 本地实时更新
      const index = memos.value.findIndex(m => m.id === id)
      if (index !== -1) {
        memos.value[index].is_important = !currentState
      }
    } catch (e) {
      error.value = `标记失败: ${e.message}`
    }
  }

  const initRealtime = () => {
    return window._supabase
      .channel('memos-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'memos'
      }, () => {
        // 添加防抖防止频繁刷新
        clearTimeout(window._refreshTimer)
        window._refreshTimer = setTimeout(fetchMemos, 800)
      })
      .subscribe()
  }

  return {
    memos,
    loading,
    error,
    fetchMemos,
    saveMemo,
    deleteMemo,
    toggleStar,
    initRealtime
  }
}
