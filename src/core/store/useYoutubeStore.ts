import { create } from 'zustand';
import { YoutubeChannel, youtubeChannelService } from '../services/youtubeChannelService';

interface YoutubeState {
  channels: YoutubeChannel[];
  loading: boolean;
  error: string | null;
  fetchChannels: () => Promise<void>;
  addChannel: (channel: Partial<YoutubeChannel>) => Promise<void>;
  updateChannel: (id: string, channel: Partial<YoutubeChannel>) => Promise<void>;
  deleteChannel: (id: string) => Promise<void>;
}

export const useYoutubeStore = create<YoutubeState>((set, get) => ({
  channels: [],
  loading: false,
  error: null,

  fetchChannels: async () => {
    set({ loading: true, error: null });
    try {
      const channels = await youtubeChannelService.getChannels();
      set({ channels, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  addChannel: async (channel) => {
    set({ loading: true });
    try {
      await youtubeChannelService.addChannel(channel);
      await get().fetchChannels();
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  updateChannel: async (id, channel) => {
    set({ loading: true });
    try {
      await youtubeChannelService.updateChannel(id, channel);
      await get().fetchChannels();
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  deleteChannel: async (id) => {
    set({ loading: true });
    try {
      await youtubeChannelService.deleteChannel(id);
      await get().fetchChannels();
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));
