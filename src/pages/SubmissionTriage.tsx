import React, { useState, useRef } from 'react';
import { Upload, ListChecks, Wand2, Loader2, Download, CheckCircle2, XCircle, HelpCircle, FileText } from 'lucide-react';
import { generateTriage } from '../services/geminiService';
import { DEFAULT_REVIEW_GUIDANCE, LLM_MODELS } from '../constants';
import TelemetryTerminal from '../components/TelemetryTerminal';

interface Props {
  language: 'zh' | 'en';
}

interface TriageResult {
  required: { item: string; reference: string; reason: string }[];
  not_required: { item: string; reason: string }[];
  optional: { item: string; reference: string; reason: string }[];
}

export default function SubmissionTriage({ language }: Props) {
  const [submissionList, setSubmissionList] = useState('');
  const [guidance, setGuidance] = useState(DEFAULT_REVIEW_GUIDANCE);
  const [model, setModel] = useState(LLM_MODELS[0].id);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      addLog('[WARNING] User interrupted generation.');
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!submissionList) {
      setError(language === 'zh' ? '請輸入或上傳送審清單' : 'Please input or upload submission list');
      return;
    }
    setError('');
    setIsGenerating(true);
    setTriageResult(null);
    setLogs([]);
    addLog('[SYSTEM] Initializing Submission Triage...');
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      addLog(`[LLM] Connecting to ${model}...`);
      addLog('[LLM] Analyzing submission list against guidance...');
      const result = await generateTriage(model, submissionList, guidance, controller.signal);
      addLog('[SUCCESS] Triage completed successfully.');
      setTriageResult(result.submission_triage);
    } catch (err: any) {
      if (err.message === 'AbortError') {
        addLog('[ERROR] Generation aborted by user.');
      } else {
        setError(err.message || 'Triage failed');
        addLog(`[ERROR] ${err.message}`);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setter(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const exportJSON = () => {
    if (!triageResult) return;
    const blob = new Blob([JSON.stringify({ submission_triage: triageResult }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'triage_result.json';
    a.click();
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {language === 'zh' ? '送審清單智慧分類' : 'Submission Triage'}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          {language === 'zh' ? '自動比對法規，將廠商送審文件分類為必要、非必要與選用項目。' : 'Automatically compare regulations to classify submission documents into required, not required, and optional items.'}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-emerald-500" />
              {language === 'zh' ? '廠商送審清單' : 'Submission List'}
            </h3>
            
            <div className="mb-4">
              <label className="flex items-center justify-center w-full h-24 border-2 border-zinc-300 border-dashed rounded-xl cursor-pointer bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-6 h-6 mb-2 text-zinc-400" />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {language === 'zh' ? '上傳清單 (.txt, .csv, .md)' : 'Upload List (.txt, .csv, .md)'}
                  </p>
                </div>
                <input type="file" className="hidden" accept=".txt,.md,.csv,.json" onChange={(e) => handleFileUpload(e, setSubmissionList)} />
              </label>
            </div>

            <textarea
              value={submissionList}
              onChange={(e) => setSubmissionList(e.target.value)}
              className="w-full h-48 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none font-mono text-sm"
              placeholder={language === 'zh' ? '貼上廠商送審目錄...' : 'Paste submission directory...'}
            />
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" />
              {language === 'zh' ? '審查指引/法規依據' : 'Review Guidance'}
            </h3>
            <textarea
              value={guidance}
              onChange={(e) => setGuidance(e.target.value)}
              className="w-full h-48 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none font-mono text-sm"
              placeholder={language === 'zh' ? '貼上法規依據...' : 'Paste review guidance...'}
            />
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
             <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                {language === 'zh' ? 'AI 模型' : 'AI Model'}
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-2.5 mb-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
              >
                {LLM_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              {language === 'zh' ? '執行智慧分類' : 'Run Triage'}
            </button>

            <TelemetryTerminal 
              isGenerating={isGenerating} 
              onStop={handleStop} 
              language={language} 
              logs={logs} 
            />
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col h-full min-h-[800px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-emerald-500" />
              {language === 'zh' ? '分類結果' : 'Triage Results'}
            </h3>
            {triageResult && (
              <button
                onClick={exportJSON}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                {language === 'zh' ? '匯出 JSON' : 'Export JSON'}
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <p>{language === 'zh' ? 'AI 正在進行語義分析與分類...' : 'AI is analyzing and classifying...'}</p>
              </div>
            ) : triageResult ? (
              <>
                {/* Required Items */}
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-semibold text-red-600 dark:text-red-400 border-b border-red-100 dark:border-red-900/30 pb-2">
                    <CheckCircle2 className="w-5 h-5" />
                    {language === 'zh' ? '必要項目 (Required)' : 'Required Items'}
                    <span className="ml-auto bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 py-0.5 px-2 rounded-full text-xs">
                      {triageResult.required.length}
                    </span>
                  </h4>
                  {triageResult.required.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{item.item}</div>
                      <div className="text-sm text-red-600 dark:text-red-400 mt-1 font-mono">{item.reference}</div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{item.reason}</div>
                    </div>
                  ))}
                </div>

                {/* Not Required Items */}
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-semibold text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <XCircle className="w-5 h-5" />
                    {language === 'zh' ? '非必要項目 (Not Required)' : 'Not Required Items'}
                    <span className="ml-auto bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 py-0.5 px-2 rounded-full text-xs">
                      {triageResult.not_required.length}
                    </span>
                  </h4>
                  {triageResult.not_required.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{item.item}</div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{item.reason}</div>
                    </div>
                  ))}
                </div>

                {/* Optional Items */}
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-400 border-b border-blue-100 dark:border-blue-900/30 pb-2">
                    <HelpCircle className="w-5 h-5" />
                    {language === 'zh' ? '選用/建議項目 (Optional)' : 'Optional Items'}
                    <span className="ml-auto bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 py-0.5 px-2 rounded-full text-xs">
                      {triageResult.optional.length}
                    </span>
                  </h4>
                  {triageResult.optional.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{item.item}</div>
                      <div className="text-sm text-blue-600 dark:text-blue-400 mt-1 font-mono">{item.reference}</div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{item.reason}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-400">
                <p>{language === 'zh' ? '尚未生成分類結果' : 'No triage results yet'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
