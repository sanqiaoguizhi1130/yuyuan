// src/composables/useRecipes.js
import { ref } from "vue";
import { supabase } from '../supabase/client.js';

export const useRecipes = () => {
  const recipes = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchRecipes = async () => {
    try {
      loading.value = true;
      const { data, error: sbError } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { descending: true });

      if (sbError) throw sbError;

      recipes.value = data || [];
    } catch (e) {
      error.value = `菜谱加载失败: ${e.message}`;
      console.error("[DB ERROR]", e);
    } finally {
      loading.value = false;
    }
  };

  const saveRecipe = async (recipe) => {
    try {
      loading.value = true;
      const { data, error: sbError } = await supabase
        .from("recipes")
        .insert([
          {
            ...recipe,
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

  const updateRecipe = async (id, updates) => {
    try {
      loading.value = true;
      const { data, error: sbError } = await supabase
        .from("recipes")
        .update(updates)
        .eq("id", id)
        .select();

      if (sbError) throw sbError;
      
      // 更新本地数据
      const index = recipes.value.findIndex(recipe => recipe.id === id);
      if (index !== -1) {
        recipes.value.splice(index, 1, data[0]);
      }
      
      return data[0];
    } catch (e) {
      error.value = `更新失败: ${e.message}`;
      return null;
    } finally {
      loading.value = false;
    }
  };

  const deleteRecipe = async (id) => {
    try {
      loading.value = true;
      const { error: sbError } = await supabase
        .from("recipes")
        .delete()
        .eq("id", id);

      if (sbError) throw sbError;

      // 从本地数据中移除
      recipes.value = recipes.value.filter(recipe => recipe.id !== id);
      return true;
    } catch (e) {
      error.value = `删除失败: ${e.message}`;
      return false;
    } finally {
      loading.value = false;
    }
  };

  const initRealtime = () => {
    return supabase
      .channel("public-recipes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recipes",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            recipes.value.unshift(payload.new);
          } else if (payload.eventType === "UPDATE") {
            const index = recipes.value.findIndex(r => r.id === payload.new.id);
            if (index !== -1) {
              recipes.value.splice(index, 1, payload.new);
            }
          } else if (payload.eventType === "DELETE") {
            recipes.value = recipes.value.filter((r) => r.id !== payload.old.id);
          }
        }
      )
      .subscribe();
  };

  return {
    recipes,
    loading,
    error,
    fetchRecipes,
    saveRecipe,
    updateRecipe,
    deleteRecipe,
    initRealtime,
  };
}; 