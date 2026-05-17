import React, { useState } from 'react';
import { useSettingsStore } from '../core/store/useSettingsStore';
import { ProviderType } from '../core/domain/types';
import { Settings, Save, CheckCircle } from 'lucide-react';

export default function AISettingsComponent() {
  const { providers, activeProviderType, updateProvider, setActiveProviderType } = useSettingsStore();

  const handleUpdate = (type: ProviderType, field: 'apiKey' | 'endpoint', value: string) => {
    const provider = providers.find(p => p.type === type);
    if (provider) {
      updateProvider({ ...provider, [field]: value });
    }
  };

  return (
    <div className="p-6 bg-[#0f1012] text-white rounded-xl shadow-lg border border-[#2a2d35] max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Settings className="w-5 h-5 text-blue-500" />
        AI Configuration
      </h2>

      <div className="space-y-6">
        {providers.map((provider) => (
          <div key={provider.type} className="p-4 bg-[#151619] rounded-lg border border-[#2a2d35]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold capitalize flex items-center gap-3 text-lg">
                {provider.type}
                {activeProviderType === provider.type && (
                  <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Active
                  </span>
                )}
              </h3>
              <button 
                onClick={() => setActiveProviderType(provider.type)}
                className={`px-3 py-1 rounded text-xs transition-colors ${activeProviderType === provider.type ? 'bg-blue-600 text-white' : 'bg-[#2a2d35] text-gray-400 hover:text-white'}`}
              >
                {activeProviderType === provider.type ? 'Active' : 'Set Active'}
              </button>
            </div>

            <div className="space-y-3">
              {provider.type === 'gemini' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#4e515a] uppercase tracking-widest">API Key</label>
                  <input
                    type="password"
                    value={provider.apiKey || ''}
                    onChange={(e) => handleUpdate(provider.type, 'apiKey', e.target.value)}
                    className="bg-[#0a0a0b] border border-[#2a2d35] rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="AIza..."
                  />
                </div>
              )}
              {(provider.type === 'ollama' || provider.type === 'lmstudio') && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#4e515a] uppercase tracking-widest">Endpoint</label>
                  <input
                    type="text"
                    value={provider.endpoint || ''}
                    onChange={(e) => handleUpdate(provider.type, 'endpoint', e.target.value)}
                    className="bg-[#0a0a0b] border border-[#2a2d35] rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="http://localhost:..."
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
