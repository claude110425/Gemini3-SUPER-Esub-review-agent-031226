import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, CheckCircle2 } from 'lucide-react';
import { PAINTER_PERSONAS, LLM_MODELS } from '../constants';

interface Props {
  language: 'zh' | 'en';
}

export default function Settings({ language }: Props) {
  const [personas, setPersonas] = useState(PAINTER_PERSONAS);
  const [saved, setSaved] = useState(false);

  const handlePersonaChange = (index: number, field: 'name' | 'prompt', value: string) => {
    const newPersonas = [...personas];
    newPersonas[index] = { ...newPersonas[index], [field]: value };
    setPersonas(newPersonas);
    setSaved(false);
  };

  const handleSave = () => {
    // In a real app, this would save to localStorage or backend
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-emerald-500" />
          {language === 'zh' ? '系統設定' : 'System Settings'}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          {language === 'zh' ? '自訂畫家風格 Prompt 與預設模型。' : 'Customize painter persona prompts and default models.'}
        </p>
      </header>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            {language === 'zh' ? '動態 Prompt 編輯器 (Dynamic Prompt Editor)' : 'Dynamic Prompt Editor'}
          </h3>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
          >
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? (language === 'zh' ? '已儲存' : 'Saved') : (language === 'zh' ? '儲存變更' : 'Save Changes')}
          </button>
        </div>

        <div className="space-y-6">
          {personas.map((persona, index) => (
            <div key={persona.id} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {language === 'zh' ? '風格名稱' : 'Persona Name'}
                </label>
                <input
                  type="text"
                  value={persona.name}
                  onChange={(e) => handlePersonaChange(index, 'name', e.target.value)}
                  className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {language === 'zh' ? 'System Prompt' : 'System Prompt'}
                </label>
                <textarea
                  value={persona.prompt}
                  onChange={(e) => handlePersonaChange(index, 'prompt', e.target.value)}
                  className="w-full h-24 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 resize-none font-mono text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
