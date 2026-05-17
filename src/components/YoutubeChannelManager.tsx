import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Youtube, Plus, Save, Trash2, Edit3, Image as ImageIcon, X, Loader2 } from 'lucide-react';
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
      setError("Erro ao conectar: " + err.message);
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
      setError("Erro ao salvar canal: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await deleteChannel(id);
      setEditingChannel(null);
      setShowDeleteConfirm(null);
    } catch (err: any) {
      setError("Erro ao remover canal: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="hardware-card w-full max-w-4xl h-[80vh] flex flex-col bg-[#0a0a0b]"
      >
        <div className="p-6 border-b border-[#2a2d35] flex items-center justify-between bg-[#1f2128]">
          <div className="flex items-center gap-3">
            <Youtube className="w-5 h-5 text-red-500" />
            <h3 className="font-bold uppercase tracking-widest">Canais do YouTube</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#2a2d35] rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between text-red-500 text-xs">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="flex-1 overflow-hidden flex">
          {/* List of Channels */}
          <div className="w-1/3 border-r border-[#2a2d35] flex flex-col bg-[#151619]">
            <div className="p-4 border-b border-[#2a2d35]">
              <button 
                onClick={() => setEditingChannel({ name: '', description: '', tags: [] })}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white rounded-lg py-2 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Canal</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {loading && !editingChannel && channels.length === 0 ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#8e9299]" /></div>
              ) : channels.length === 0 ? (
                <div className="text-center space-y-4 p-4 border border-dashed border-[#2a2d35] rounded-xl bg-[#1f2128]">
                  <Youtube className="w-12 h-12 text-[#4e515a] mx-auto opacity-20" />
                  <p className="text-xs text-[#8e9299]">Conecte sua conta Google para gerenciar seus canais.</p>
                  <button 
                    onClick={handleConnect}
                    className="w-full text-xs bg-[#1f2128] hover:bg-[#2a2d35] border border-[#2a2d35] py-2 rounded-lg font-bold transition-colors"
                  >
                    Conectar Google
                  </button>
                </div>
              ) : (
                channels.map(channel => (
                  <div 
                    key={channel.id}
                    onClick={() => setEditingChannel(channel)}
                    className={`p-4 rounded-xl cursor-pointer border transition-all ${editingChannel?.id === channel.id ? 'border-red-500 bg-[#2a2d35]' : 'border-[#2a2d35] hover:border-[#8e9299] bg-[#1f2128]'}`}
                  >
                    <div className="flex items-center gap-3">
                      {channel.profileImageUrl ? (
                        <img src={channel.profileImageUrl} alt={channel.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                          <Youtube className="w-5 h-5 text-red-500" />
                        </div>
                      )}
                      <div className="flex-1 truncate">
                        <p className="font-bold text-sm truncate">{channel.name}</p>
                        <p className="text-xs text-[#8e9299] truncate">{channel.tags?.join(', ') || 'Sem tags'}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 bg-[#0a0a0b] flex flex-col">
            {editingChannel ? (
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-lg font-bold">
                    {editingChannel.id ? 'Editar Canal' : 'Novo Canal'}
                  </h4>
                  {editingChannel.id && (
                    <div className="flex items-center gap-2">
                       {showDeleteConfirm === editingChannel.id ? (
                         <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                            <span className="text-[10px] font-bold uppercase text-red-400">Confirmar exclusão?</span>
                            <button 
                              onClick={() => handleDelete(editingChannel.id!)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] uppercase font-bold rounded"
                            >
                              Sim
                            </button>
                            <button 
                              onClick={() => setShowDeleteConfirm(null)}
                              className="px-3 py-1 bg-[#1f2128] hover:bg-[#2a2d35] text-white text-[10px] uppercase font-bold rounded"
                            >
                              Não
                            </button>
                         </div>
                       ) : (
                         <button 
                           onClick={() => setShowDeleteConfirm(editingChannel.id!)}
                           className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                         >
                           <Trash2 className="w-5 h-5" />
                         </button>
                       )}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Banner / Profile Pic Area */}
                  <div className="flex items-end gap-6 mb-8">
                    <div className="relative group w-24 h-24 rounded-full bg-[#1f2128] border-2 border-[#2a2d35] flex items-center justify-center overflow-hidden">
                      {editingChannel.profileImageUrl ? (
                        <img src={editingChannel.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-[#8e9299]" />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                        <Edit3 className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold uppercase text-[#8e9299] mb-2">URL da Foto de Perfil</label>
                      <input 
                        type="text" 
                        value={editingChannel.profileImageUrl || ''}
                        onChange={e => setEditingChannel({ ...editingChannel, profileImageUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-[#151619] border border-[#2a2d35] rounded-xl px-4 py-3 text-sm focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#8e9299] mb-2">Nome do Canal</label>
                    <input 
                      type="text" 
                      value={editingChannel.name || ''}
                      onChange={e => setEditingChannel({ ...editingChannel, name: e.target.value })}
                      placeholder="Ex: Tech Insights BR"
                      className="w-full bg-[#151619] border border-[#2a2d35] rounded-xl px-4 py-3 text-sm focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#8e9299] mb-2">Descrição / Sobre</label>
                    <textarea 
                      value={editingChannel.description || ''}
                      onChange={e => setEditingChannel({ ...editingChannel, description: e.target.value })}
                      placeholder="Descrição do canal que aparece na aba Sobre..."
                      rows={4}
                      className="w-full bg-[#151619] border border-[#2a2d35] rounded-xl px-4 py-3 text-sm focus:border-red-500 focus:outline-none custom-scrollbar resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#8e9299] mb-2">Tags Padrão</label>
                    <input 
                      type="text" 
                      value={editingChannel.tags?.join(', ') || ''}
                      onChange={e => {
                        const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                        setEditingChannel({ ...editingChannel, tags });
                      }}
                      placeholder="Ex: tecnologia, programação, IA (separado por vírgula)"
                      className="w-full bg-[#151619] border border-[#2a2d35] rounded-xl px-4 py-3 text-sm focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div className="mt-10 flex justify-end">
                  <button 
                    onClick={handleSave}
                    disabled={!editingChannel.name || loading}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl transition-all font-bold shadow-lg shadow-red-900/20"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    <span>Salvar Canal</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[#8e9299]">
                <Youtube className="w-16 h-16 opacity-20 mb-4" />
                <p>Selecione um canal ou adicione um novo</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
