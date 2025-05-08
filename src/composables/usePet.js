// src/composables/useAlbums.js
import { ref } from "vue";
import { supabase } from '../supabase/client.js'; // 或你的存放路径


export const usepetAlbums = () => {
  const photos = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchPhotos = async () => {
    try {
      loading.value = true;
      const { data, error: sbError } = await supabase
        .from("pet")
        .select("*")
        .order("created_at", { descending: true });

      if (sbError) throw sbError;

      photos.value = data || [];
    } catch (e) {
      error.value = `照片加载失败: ${e.message}`;
      console.error("[DB ERROR]", e);
    } finally {
      loading.value = false;
    }
  };

  const savePhoto = async (photo) => {
    try {
      loading.value = true;
      const { data, error: sbError } = await supabase
        .from("pet")
        .insert([
          {
            ...photo,
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

  const deletePhoto = async (id) => {
    try {
      loading.value = true;
      const { data, error: fetchError } = await supabase
        .from("pet")
        .select("path")
        .eq("id", id)
        .single();
  
      if (fetchError) throw fetchError;
      if (!data) throw new Error("图片不存在");
  
      // ✅ 关键修正：直接使用存储的 path
      const { error: storageError } = await supabase.storage
        .from("pet")
        .remove([data.path]); // 直接使用数据库中的完整路径
  
      if (storageError) throw storageError;
  
      const { error: deleteError } = await supabase
        .from("pet")
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

  const uploadImage = async (file) => {
    try {
      const fileName = `public/${Date.now()}_${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`;
      
      // 显式防御性编码：强制设置图片MIME类型白名单
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const finalContentType = allowedTypes.includes(file.type) 
        ? file.type 
        : 'application/octet-stream';
  
      const { data, error } = await supabase.storage
        .from('pet')
        .upload(fileName, file, {
          contentType: finalContentType, // 重要：覆盖不可靠的浏览器检测
          validateMimeType: true
        });
  
      if (error) {
        throw new Error(`存储服务拒绝上传：${error.message}`);
      }
  
      // ✅ 安全获取路径：优先使用存储返回的 name 字段
      const { data: urlData } = await supabase.storage
        .from('pet')
        .getPublicUrl(data.path); 
  
      return { 
        url: urlData.publicUrl,
        path: data.path
      };
    } catch (error) {
      console.error('[存储错误详情]', error);
      throw new Error('上传失败，请检查网络和文件格式');
    }
  };
  


  const initRealtime = () => {
    return supabase
      .channel("public-photos")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pet",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            photos.value.unshift(payload.new);
          } else if (payload.eventType === "DELETE") {
            photos.value = photos.value.filter((p) => p.id !== payload.old.id);
          }
        }
      )
      .subscribe();
  };

  return {
    photos,
    loading,
    error,
    fetchPhotos,
    savePhoto,
    deletePhoto,
    uploadImage,
    initRealtime,
  };
};
