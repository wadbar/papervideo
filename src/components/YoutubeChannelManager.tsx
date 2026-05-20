import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Youtube, Plus, Save, Trash2, Edit3, Image as ImageIcon, X, Loader2, CheckCircle2, ChevronRight, Rocket, Signal } from 'lucide-react';
import { YoutubeChannel, youtubeChannelService } from '../core/services/youtubeChannelService';
import { useYoutubeStore } from '../core/store/useYoutubeStore';

export default function YoutubeChannelManager({ onClose, initialChannelId }: { onClose: () => void; initialChannelId?: string }) {
  const { channels, loading, fetchChannels, addChannel, updateChannel, deleteChannel } = useYoutubeStore();
  const [editingChannel, setEditingChannel] = useState<Partial<YoutubeChannel> | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleConnect = async () => {
    setError(null);
    try {
      await youtubeChannelService.login();
      await fetchChannels();
    } catch (err: any) {
      setError("Link failure: " + err.message);
    }
  };

  useEffect(() => {
    setShowDeleteConfirm(null);
    setError(null);
  }, [editingChannel]);

  useEffect(() => {
    if (initialChannelId && channels.length > 0) {
      const ch = channels.find(c => c.id === initialChannelId);
      if (ch) setEditingChannel(ch);
    }
  }, [initialChannelId, channels]);

  const handleSave = async () => {
    if (!editingChannel?.name) return;
    setError(null);
    try {
      if (editingChannel.id) {
        await updateChannel(editingChannel.id, editingChannel);
      } else {
        await addChannel(editingChannel);
      }
      setEditingChannel(null);
    } catch (err: any) {
      setError("Protocol save error: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await deleteChannel(id);
      setEditingChannel(null);
      setShowDeleteConfirm(null);
    } catch (err: any) {
      setError("Neural node removal error: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-surface w-full max-w-5xl h-[85vh] flex flex-col rounded-[2.5rem] overflow-hidden shadow-2xl border border-outline-variant/30"
      >
        <div className="px-8 py-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error border border-error/20 shadow-sm">
              <Youtube className="w-6 h-6 fill-current" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-xl font-black tracking-tight text-on-surface">Neural Broadcast Nodes</h3>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-60">YouTube Content Distribution Grid</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-surface-variant rounded-full transition-all active:scale-90">
            <X className="w-6 h-6 text-on-surface-variant" />
          </button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-8 pt-6"
            >
              <div className="p-4 bg-error/10 border border-error/20 rounded-2xl flex items-center justify-between text-error text-[11px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-3">
                  <Signal className="w-4 h-4" />
                  <span>{error}</span>
                </div>
                <button onClick={() => setError(null)} className="p-1 hover:bg-error/20 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-hidden flex">
          {/* List of Channels */}
          <div className="w-80 border-r border-outline-variant/30 flex flex-col bg-surface-variant/5">
            <div className="p-6 border-b border-outline-variant/30">
              <button 
                onClick={() => setEditingChannel({ name: '', description: '', tags: [] })}
                className="w-full m3-button-primary bg-error text-on-error hover:bg-error/90 flex items-center justify-center gap-3 py-4 active:scale-[0.98] transition-all shadow-lg shadow-error/10"
              >
                <Plus className="w-5 h-5 font-black" />
                <span className="font-black uppercase tracking-widest text-[11px]">Deploy New Node</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {loading && !editingChannel && channels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary opacity-40" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">Scanning Broadcast Grid...</span>
                </div>
              ) : channels.length === 0 ? (
                <div className="text-center space-y-6 py-12 px-6 border border-dashed border-outline-variant/40 rounded-[2rem] bg-surface">
                  <Rocket className="w-12 h-12 text-on-surface-variant/20 mx-auto" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-black text-on-surface uppercase tracking-tight">No Active Uplink</h4>
                    <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed">Initialize a secure Google handshake to synchronize your creative nodes with the global YouTube matrix.</p>
                  </div>
                  <button 
                    onClick={handleConnect}
                    className="w-full text-[10px] m3-button-tonal py-3 font-black uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Authorize Node
                  </button>
                </div>
              ) : (
                channels.map(channel => (
                  <motion.div 
                    layout
                    key={channel.id}
                    onClick={() => setEditingChannel(channel)}
                    className={`group p-5 rounded-[2rem] cursor-pointer border transition-all duration-300 relative overflow-hidden active:scale-[0.98] ${
                      editingChannel?.id === channel.id 
                        ? 'border-error bg-error/5 shadow-lg shadow-error/5 scale-[1.02] z-10' 
                        : 'border-outline-variant/30 hover:border-outline-variant hover:bg-surface bg-surface'
                    }`}
                  >
                    <div className="flex items-center gap-4 relative">
                      <div className="relative shrink-0">
                        {channel.profileImageUrl ? (
                          <img src={channel.profileImageUrl} alt={channel.name} className="w-12 h-12 rounded-full object-cover border-2 border-surface shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error">
                            <Youtube className="w-6 h-6" />
                          </div>
                        )}
                        {editingChannel?.id === channel.id && (
                          <div className="absolute -bottom-1 -right-1 bg-error text-on-error rounded-full p-1 shadow-sm">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 truncate">
                        <p className={`font-black text-sm truncate transition-colors ${editingChannel?.id === channel.id ? 'text-error' : 'text-on-surface group-hover:text-primary'}`}>{channel.name}</p>
                        <p className="text-[10px] font-bold text-on-surface-variant opacity-40 truncate uppercase tracking-wider">{channel.tags?.join(', ') || 'No Local Meta'}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-all duration-300 ${editingChannel?.id === channel.id ? 'text-error opacity-100 translate-x-0' : 'text-on-surface-variant opacity-0 -translate-x-2'}`} />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 bg-surface flex flex-col relative overflow-hidden">
             {/* Background decorative element */}
             <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none" />
             
            {editingChannel ? (
              <motion.div 
                key={editingChannel.id || 'new'}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 overflow-y-auto p-12 custom-scrollbar relative z-10"
              >
                <div className="flex items-center justify-between mb-12">
                  <div className="space-y-1">
                    <h4 className="text-2xl font-black tracking-tight text-on-surface">
                      {editingChannel.id ? 'Configure Node' : 'Initialize Node'}
                    </h4>
                    <p className="text-[10px] font-black uppercase text-on-surface-variant opacity-40 tracking-widest">Target_ID: {editingChannel.id || 'UNASSIGNED_NODE'}</p>
                  </div>
                  {editingChannel.id && (
                    <div className="flex items-center">
                       {showDeleteConfirm === editingChannel.id ? (
                         <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 p-2 bg-error/5 border border-error/20 rounded-2xl px-4 py-2">
                            <span className="text-[10px] font-black uppercase text-error tracking-widest">Terminate Node?</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleDelete(editingChannel.id!)}
                                className="px-4 py-1.5 bg-error text-on-error text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-error/20 hover:scale-105 transition-transform"
                              >
                                EXEC_DELETE
                              </button>
                              <button 
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-4 py-1.5 bg-surface text-on-surface-variant text-[10px] font-black uppercase tracking-widest rounded-full border border-outline-variant/30 hover:bg-surface-variant/10 transition-colors"
                              >
                                ABORT
                              </button>
                            </div>
                         </div>
                       ) : (
                         <button 
                           onClick={() => setShowDeleteConfirm(editingChannel.id!)}
                           className="w-12 h-12 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-all active:scale-90"
                         >
                           <Trash2 className="w-6 h-6" />
                         </button>
                       )}
                    </div>
                  )}
                </div>

                <div className="space-y-10">
                  {/* Banner / Profile Pic Area */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-end gap-10">
                    <div className="relative group w-32 h-32 rounded-[2.5rem] bg-surface-variant/10 border-2 border-outline-variant/30 flex items-center justify-center overflow-hidden shadow-inner">
                      {editingChannel.profileImageUrl ? (
                        <img src={editingChannel.profileImageUrl} alt="Profile" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <ImageIcon className="w-10 h-10 text-on-surface-variant/20" />
                      )}
                      <div className="absolute inset-0 bg-scrim/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-500 backdrop-blur-sm cursor-pointer">
                        <Edit3 className="w-6 h-6 text-white mb-2" />
                        <span className="text-[8px] font-black uppercase text-white tracking-widest">Edit Static</span>
                      </div>
                    </div>
                    <div className="flex-1 w-full space-y-3">
                      <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1">Asset Source URI (Avatar)</label>
                      <input 
                        type="text" 
                        value={editingChannel.profileImageUrl || ''}
                        onChange={e => setEditingChannel({ ...editingChannel, profileImageUrl: e.target.value })}
                        placeholder="https://cdn.matrix.com/avatar.jpg"
                        className="w-full bg-surface-variant/5 border border-outline-variant/30 rounded-2xl px-6 py-4 text-sm font-bold text-on-surface focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:opacity-20"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1">Neural Node Label</label>
                    <input 
                      type="text" 
                      value={editingChannel.name || ''}
                      onChange={e => setEditingChannel({ ...editingChannel, name: e.target.value })}
                      placeholder="Transmission Identity..."
                      className="w-full bg-surface-variant/5 border border-outline-variant/30 rounded-2xl px-6 py-4 text-sm font-black text-on-surface focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1">Transceiver Narrative (Bio)</label>
                    <textarea 
                      value={editingChannel.description || ''}
                      onChange={e => setEditingChannel({ ...editingChannel, description: e.target.value })}
                      placeholder="Neural signal description detected in the global about matrix..."
                      rows={4}
                      className="w-full bg-surface-variant/5 border border-outline-variant/30 rounded-[2.5rem] px-6 py-6 text-sm font-medium leading-relaxed text-on-surface focus:ring-4 focus:ring-primary/5 outline-none transition-all custom-scrollbar resize-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1">Default Meta Injectors (Tags)</label>
                    <input 
                      type="text" 
                      value={editingChannel.tags?.join(', ') || ''}
                      onChange={e => {
                        const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                        setEditingChannel({ ...editingChannel, tags });
                      }}
                      placeholder="technique, neural_matrix, v_2024 (comma separated)"
                      className="w-full bg-surface-variant/5 border border-outline-variant/30 rounded-2xl px-6 py-4 text-sm font-mono text-on-surface focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div className="mt-16 flex justify-end">
                  <button 
                    onClick={handleSave}
                    disabled={!editingChannel.name || loading}
                    className="flex items-center gap-4 m3-button-primary bg-error text-on-error hover:bg-error/90 disabled:opacity-30 disabled:grayscale py-4 px-10 shadow-2xl shadow-error/20 font-black uppercase tracking-widest group active:scale-95 transition-all text-xs"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 transition-transform group-hover:scale-110" />}
                    <span>Synchronize Protocol</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant/10 p-12 text-center max-w-md mx-auto">
                <Youtube className="w-32 h-32 mb-10 opacity-5" />
                <div className="space-y-4">
                   <h4 className="text-xl font-black uppercase tracking-widest text-on-surface opacity-20">Idle Terminal</h4>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed opacity-30 italic">SELECT_A_NODE_TO_BEGIN_MODIFICATION_SEQUENCE_OR_INITIALIZE_A_NEW_UPLINK</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
