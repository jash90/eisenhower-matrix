import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'eisenhower-matrix',
    },
  },
  db: {
    schema: 'public',
  },
});

// Helper function to create a robust realtime channel
export async function createRobustChannel(
  channelName: string,
  handlers: {
    onInsert?: (payload: any) => void;
    onUpdate?: (payload: any) => void;
    onDelete?: (payload: any) => void;
    onError?: (error: Error) => void;
  }
): Promise<RealtimeChannel> {
  // Remove any existing channels with the same name
  supabase.getChannels().forEach(channel => {
    if (channel.topic === channelName) {
      supabase.removeChannel(channel);
    }
  });

  const channel = supabase.channel(channelName);

  if (handlers.onInsert) {
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public'
    }, handlers.onInsert);
  }

  if (handlers.onUpdate) {
    channel.on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public'
    }, handlers.onUpdate);
  }

  if (handlers.onDelete) {
    channel.on('postgres_changes', {
      event: 'DELETE',
      schema: 'public'
    }, handlers.onDelete);
  }

  try {
    const status = await channel.subscribe();
    console.log('Channel subscription status:', status);
    return channel;
  } catch (error) {
    console.error('Failed to subscribe to channel:', error);
    if (handlers.onError) {
      handlers.onError(error instanceof Error ? error : new Error('Subscription failed'));
    }
    throw error;
  }
}