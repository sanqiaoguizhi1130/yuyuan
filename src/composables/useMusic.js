// src/composables/useMusic.js
import { ref } from "vue";
import { supabase } from '../supabase/client.js';

export const useMusic = () => {
  const songs = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const currentSong = ref(null);
  const isPlaying = ref(false);

  const fetchMusic = async () => {
    try {
      loading.value = true;
      const { data, error: sbError } = await supabase
        .from("music")
        .select("*")
        .order("created_at", { descending: true });

      if (sbError) throw sbError;

      songs.value = data || [];
    } catch (e) {
      error.value = `音乐加载失败: ${e.message}`;
      console.error("[DB ERROR]", e);
    } finally {
      loading.value = false;
    }
  };

  const updateMusic = async (id, updates) => {
    try {
      loading.value = true
      const { data, error: sbError } = await supabase
        .from('music')
        .update(updates)
        .eq('id', id)
        .select() // 返回更新后的数据
        
      if (sbError) throw sbError
      
      // 更新本地数据
      const index = songs.value.findIndex(song => song.id === id)
      if (index !== -1) {
        songs.value.splice(index, 1, data[0])
      }
      
      return data[0] // 返回更新后的歌曲
    } catch (err) {
      error.value = `更新失败: ${err.message}`
      throw err // 重新抛出错误以便组件捕获
    } finally {
      loading.value = false
    }
  }

  const saveMusic = async (music) => {
    try {
      loading.value = true;
      const { data, error: sbError } = await supabase
        .from("music")
        .insert([
          {
            ...music,
            updated_at: new Date().toISOString(),
          },
        ])
        .select();

      if (sbError) throw sbError;
      return data?.[0] || null;
    } catch (e) {
      error.value = `保存失败: ${e.message}`;
      return null;
    } finally {
      loading.value = false;
    }
  };

  const deleteMusic = async (id) => {
    try {
      loading.value = true;
      const { data, error: fetchError } = await supabase
        .from("music")
        .select("path")
        .eq("id", id)
        .single();
  
      if (fetchError) throw fetchError;
      if (!data) throw new Error("歌曲不存在");
  
      const { error: storageError } = await supabase.storage
        .from("music")
        .remove([data.path]);
  
      if (storageError) throw storageError;
  
      const { error: deleteError } = await supabase
        .from("music")
        .delete()
        .eq("id", id);
  
      if (deleteError) throw deleteError;
  
      return true;
    } catch (e) {
      error.value = `删除失败: ${e.message}`;
      return false;
    } finally {
      loading.value = false;
    }
  };

  const uploadMusic = async (file) => {
    try {
      // 获取音乐元数据
      const metadata = await getAudioMetadata(file);
      
      const fileName = `tracks/${Date.now()}_${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`;
      
      // 允许的音乐MIME类型
      const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac'];
      const finalContentType = allowedTypes.includes(file.type) 
        ? file.type 
        : 'application/octet-stream';
  
      const { data, error } = await supabase.storage
        .from('music')
        .upload(fileName, file, {
          contentType: finalContentType,
          upsert: false
        });
  
      if (error) throw new Error(`存储服务拒绝上传：${error.message}`);
  
      const { data: urlData } = await supabase.storage
        .from('music')
        .getPublicUrl(data.path);
  
      return { 
        url: urlData.publicUrl,
        path: data.path,
        duration: metadata.duration,
        title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
        artist: metadata.artist || "未知艺术家"
      };
    } catch (error) {
      console.error('[音乐上传错误]', error);
      throw new Error('音乐上传失败，请检查格式和大小');
    }
  };

  const getAudioMetadata = (file) => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.preload = "metadata";
      
      audio.onloadedmetadata = () => {
        resolve({
          duration: Math.round(audio.duration),
          title: "",
          artist: ""
        });
      };
      
      audio.onerror = () => {
        resolve({ duration: 0, title: "", artist: "" });
      };
      
      audio.src = URL.createObjectURL(file);
    });
  };

  const initRealtime = () => {
    return supabase
      .channel("public-music")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "music",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            songs.value.unshift(payload.new);
          } else if (payload.eventType === "DELETE") {
            songs.value = songs.value.filter((s) => s.id !== payload.old.id);
          }
        }
      )
      .subscribe();
  };

  return {
    songs,
    loading,
    error,
    currentSong,
    isPlaying,
    fetchMusic,
    updateMusic,
    saveMusic,
    deleteMusic,
    uploadMusic,
    initRealtime,
  };
};
