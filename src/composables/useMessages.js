// useMessages.js
import { ref, onUnmounted } from 'vue';
import { supabase } from '../supabase/client';

export const useMessages = () => {
  const messages = ref([]);
  const loading = ref(false);
  const error = ref(null);
  let realtimeSubscription = null;

  // 规范化消息格式
  const normalizeMessage = (msg) => ({
    id: msg.id,
    content: msg.content || '',
    gender: msg.gender || 'unknown',
    created_at: msg.created_at ? new Date(msg.created_at).toISOString() : new Date().toISOString()
  });

  // 获取初始数据
  const fetchMessages = async () => {
    try {
      loading.value = true;
      const { data, error: sbError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (sbError) throw sbError;
      messages.value = (data || []).map(normalizeMessage);
    } catch (e) {
      error.value = `留言加载失败: ${e.message}`;
    } finally {
      loading.value = false;
    }
  };

  // 提交新留言
  const sendMessage = async ({ content, gender }) => {
    try {
      loading.value = true;
      const { data, error: sbError } = await supabase
        .from('messages')
        .insert([{ content, gender }])
        .select()
        .single();

      if (sbError) throw sbError;
      
      // 本地即时更新
      if (data) {
        messages.value = [normalizeMessage(data), ...messages.value];
      }
      
      return data;
    } catch (e) {
      error.value = `提交失败: ${e.message}`;
      return null;
    } finally {
      loading.value = false;
    }
  };

  // 处理实时更新
  const handleRealtimeUpdate = (payload) => {
    console.log('实时事件:', payload.eventType);
    
    const actions = {
      INSERT: () => {
        messages.value = [normalizeMessage(payload.new), ...messages.value];
      },
      UPDATE: () => {
        const index = messages.value.findIndex(m => m.id === payload.new.id);
        if (index > -1) {
          messages.value.splice(index, 1, normalizeMessage(payload.new));
        }
      },
      DELETE: () => {
        messages.value = messages.value.filter(m => m.id !== payload.old.id);
      }
    };

    actions[payload.eventType]?.();
  };
   // 新增编辑消息方法
   const editMessage = async (messageId, newContent) => {
    try {
      loading.value = true;
      const { data, error: sbError } = await supabase
        .from('messages')
        .update({ content: newContent })
        .eq('id', messageId)
        .select()
        .single();
      if (sbError) throw sbError;
      
      messages.value = messages.value.map(msg => 
        msg.id === data.id ? normalizeMessage(data) : msg
      );
      return data;
    } catch (e) {
      error.value = `编辑失败: ${e.message}`;
      return null;
    } finally {
      loading.value = false;
    }
  };
  // 新增删除消息方法
  const deleteMessage = async (messageId) => {
    try {
      loading.value = true;
      const { error: sbError } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
      if (sbError) throw sbError;
      
      messages.value = messages.value.filter(m => m.id !== messageId);
    } catch (e) {
      error.value = `删除失败: ${e.message}`;
    } finally {
      loading.value = false;
    }
  };

  // 初始化实时订阅
  const initRealtime = () => {
    if (realtimeSubscription) return;

    realtimeSubscription = supabase
      .channel('message-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        handleRealtimeUpdate
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('实时连接成功');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('连接失败:', err);
          setTimeout(initRealtime, 2000);
        }
      });
  };

  // 清理资源
  const cleanup = () => {
    if (realtimeSubscription) {
      supabase.removeChannel(realtimeSubscription);
      realtimeSubscription = null;
    }
  };

  // 组件卸载时自动清理
  onUnmounted(cleanup);

  return {
    messages,
    loading,
    error,
    fetchMessages,
    sendMessage,
    initRealtime,
    editMessage, // 新增导出
    deleteMessage // 新增导出
  };
};
