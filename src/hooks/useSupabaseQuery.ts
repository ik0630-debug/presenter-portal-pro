import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseSupabaseQueryOptions<T> {
  table: string;
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  single?: boolean;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export const useSupabaseQuery = <T = any>(options: UseSupabaseQueryOptions<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    table,
    select = '*',
    filters = {},
    orderBy,
    single = false,
    enabled = true,
    onSuccess,
    onError,
  } = options;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        let query = supabase.from(table as any).select(select);

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });

        // Apply ordering
        if (orderBy) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
        }

        // Execute query
        const { data: result, error: queryError } = single
          ? await query.maybeSingle()
          : await query;

        if (queryError && queryError.code !== 'PGRST116') {
          throw queryError;
        }

        setData(result as T);
        if (onSuccess && result) {
          onSuccess(result as T);
        }
      } catch (err) {
        const error = err as Error;
        console.error('Query error:', error);
        setError(error);
        if (onError) {
          onError(error);
        } else {
          toast.error('데이터를 불러오는데 실패했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [table, JSON.stringify(filters), JSON.stringify(orderBy), single, enabled]);

  const refetch = async () => {
    setLoading(true);
    try {
      let query = supabase.from(table as any).select(select);

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      const { data: result, error: queryError } = single
        ? await query.maybeSingle()
        : await query;

      if (queryError && queryError.code !== 'PGRST116') {
        throw queryError;
      }

      setData(result as T);
      return result as T;
    } catch (err) {
      const error = err as Error;
      console.error('Refetch error:', error);
      setError(error);
      toast.error('데이터를 다시 불러오는데 실패했습니다.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refetch,
  };
};
