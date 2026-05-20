import React from 'react';
import { useSettingsStore } from '../core/store/useSettingsStore';
import { ProviderType } from '../core/domain/types';
import { Settings, Save, CheckCircle, Cpu, Globe, Database } from 'lucide-react';
import { motion } from 'motion/react';

export default function AISettingsComponent() {
  const { providers, activeProviderType, updateProvider, setActiveProviderType } = useSettingsStore();

  const handleUpdate = (type: ProviderType, field: 'apiKey' | 'endpoint', value: string) => {
    const provider = providers.find(p => p.type === type);
    if (provider) {
      updateProvider({ ...provider, [field]: value });
    }
  };

  const icons: Record<string, any> = {
    gemini: Cpu,
    ollama: Globe,
    lmstudio: Database,
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-12 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <Settings className="w-6 h-6" />
             </div>
             <h2 className="text-3xl font-black tracking-tight text-on-surface">AI Laboratory</h2>
          </div>
          <p className="text-on-surface-variant font-medium max-w-lg leading-relaxed"> Configure the neural matrix and cross-provider intelligence protocols for your production environment.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {providers.map((provider, idx) => {
          const Icon = icons[provider.type] || Cpu;
          const isActive = activeProviderType === provider.type;
          
          return (
            <motion.div 
              key={provider.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`group p-8 rounded-[2.5rem] border transition-all duration-500 relative overflow-hidden backdrop-blur-md ${
                isActive 
                  ? 'bg-primary/5 border-primary/40 shadow-2xl shadow-primary/5' 
                  : 'bg-surface border-outline-variant/30 hover:border-outline-variant/60'
              }`}
            >
              {/* Decorative gradient overlay */}
              <div className={`absolute inset-0 opacity-[0.03] pointer-events-none transition-opacity duration-700 ${isActive ? 'opacity-[0.08]' : 'group-hover:opacity-[0.05]'}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-primary),transparent)]" />
              </div>

              <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-8">
                <div className="flex gap-6 items-start">
                  <div className={`p-5 rounded-3xl transition-all duration-500 ${isActive ? 'bg-primary text-on-primary scale-110 shadow-lg' : 'bg-surface-variant/40 text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary'}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="space-y-4 flex-1 min-w-[200px]">
                    <div className="space-y-1">
                      <h3 className="text-xl font-black capitalize text-on-surface flex items-center gap-3">
                        {provider.type}
                        {isActive && (
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                            Neural Primary
                          </span>
                        )}
                      </h3>
                      <p className="text-xs font-bold text-on-surface-variant opacity-60 uppercase tracking-widest">
                        {provider.type === 'gemini' ? 'Cloud-Based Generative Engine' : 'Local Inference Protocol'}
                      </p>
                    </div>

                    <div className="space-y-6 pt-2">
                       {provider.type === 'gemini' && (
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-[0.2em] ml-1">Authentication Credentials (API_KEY)</label>
                          <div className="relative group/input">
                            <input
                              type="password"
                              value={provider.apiKey || ''}
                              onChange={(e) => handleUpdate(provider.type, 'apiKey', e.target.value)}
                              className="w-full bg-surface-variant/10 border border-outline-variant/40 rounded-2xl px-6 py-4 text-sm font-bold text-on-surface focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-on-surface-variant/20"
                              placeholder="AIzaSy... (Global Link Required)"
                            />
                            <Save className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 opacity-0 group-hover/input:opacity-20 transition-opacity" />
                          </div>
                        </div>
                      )}
                      {(provider.type === 'ollama' || provider.type === 'lmstudio') && (
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-[0.2em] ml-1">System Point (ENDPOINT_URI)</label>
                          <div className="relative group/input">
                            <input
                              type="text"
                              value={provider.endpoint || ''}
                              onChange={(e) => handleUpdate(provider.type, 'endpoint', e.target.value)}
                              className="w-full bg-surface-variant/10 border border-outline-variant/40 rounded-2xl px-6 py-4 text-sm font-mono text-on-surface focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                              placeholder="http://localhost:11434"
                            />
                            <Database className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 opacity-0 group-hover/input:opacity-20 transition-opacity" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveProviderType(provider.type)}
                  disabled={isActive}
                  className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 whitespace-nowrap shadow-sm sm:w-auto w-full ${
                    isActive 
                      ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                      : 'bg-surface-variant/30 text-on-surface-variant hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  {isActive ? (
                    <div className="flex items-center gap-2 justify-center">
                      <CheckCircle className="w-4 h-4" />
                      <span>Operational</span>
                    </div>
                  ) : 'Initialize Protocol'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <footer className="pt-12 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-6 opacity-40">
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant">
           <Cpu className="w-4 h-4" />
           <span>CORE_INTELLIGENCE_ROUTING: VERIFIED</span>
        </div>
        <div className="text-[9px] font-mono font-bold text-on-surface-variant uppercase tracking-widest bg-surface-variant/20 px-4 py-2 rounded-full">
           System_Hash: {activeProviderType?.toUpperCase()}_INFRA_2024
        </div>
      </footer>
    </div>
  );
}
