import React, { useState, useRef } from 'react';
import { Upload, FileSignature, Wand2, Loader2, Download, Edit3, Eye, ListChecks } from 'lucide-react';
import { generateTextStream } from '../services/geminiService';
import { DEFAULT_REVIEW_GUIDANCE, DEFAULT_REPORT_TEMPLATE, LLM_MODELS } from '../constants';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Mermaid from '../components/Mermaid';
import TelemetryTerminal from '../components/TelemetryTerminal';

interface Props {
  language: 'zh' | 'en';
}

export default function ReviewReport({ language }: Props) {
  const [submissionSummary, setSubmissionSummary] = useState('');
  const [guidance, setGuidance] = useState(DEFAULT_REVIEW_GUIDANCE);
  const [template, setTemplate] = useState(DEFAULT_REPORT_TEMPLATE);
  const [model, setModel] = useState(LLM_MODELS[0].id);
  const [generatedReport, setGeneratedReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('preview');
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
    if (!submissionSummary) {
      setError(language === 'zh' ? '請輸入送審摘要' : 'Please input submission summary');
      return;
    }
    setError('');
    setIsGenerating(true);
    setGeneratedReport('');
    setLogs([]);
    addLog('[SYSTEM] Initializing Report Generator...');
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const prompt = `
      你是一位專業的醫療器材審查員。請根據以下提供的「廠商送審摘要」與「審查指引/法規依據」，
      並嚴格遵循「審查報告模板」的結構，撰寫一份繁體中文的醫療器材審查報告。
      報告字數請控制在 3000 到 4000 字之間，內容需詳實、專業且具備法規邏輯。

      【審查指引/法規依據】：
      ${guidance}

      【廠商送審摘要】：
      ${submissionSummary}

      【審查報告模板】：
      ${template}
      
      請在報告最後加上：
      WOW 5 自動生成補件問答集 (Auto-Generated Clarification Q&A)：針對缺失或非必要項目，列出 3~5 個給廠商的具體提問。
      WOW 6 審查報告語氣與合規性分析 (Tone & Compliance Analyzer)：在報告末尾附上一段簡短的 AI 語氣分析，確認報告是否客觀、專業且具備法規效力。
      `;

      addLog(`[LLM] Connecting to ${model}...`);
      const stream = await generateTextStream(model, prompt, undefined, controller.signal);
      
      addLog('[LLM] Receiving data stream...');
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        setGeneratedReport(fullText);
      }
      addLog('[SUCCESS] Report generated successfully.');
      setViewMode('preview');
    } catch (err: any) {
      if (err.message === 'AbortError') {
        addLog('[ERROR] Generation aborted by user.');
      } else {
        setError(err.message || 'Report generation failed');
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

  const downloadMarkdown = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {language === 'zh' ? '審查報告生成' : 'Review Report Generation'}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          {language === 'zh' ? '整合送審摘要、法規指引與自訂模板，自動生成 3000~4000 字專業審查報告。' : 'Integrate submission summary, guidance, and custom templates to generate a professional review report.'}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Inputs */}
        <div className="space-y-6">
          {/* Submission Summary */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-emerald-500" />
              {language === 'zh' ? '廠商送審摘要 (Submission Summary)' : 'Submission Summary'}
            </h3>
            <div className="mb-4">
              <input type="file" className="text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400" accept=".txt,.md" onChange={(e) => handleFileUpload(e, setSubmissionSummary)} />
            </div>
            <textarea
              value={submissionSummary}
              onChange={(e) => setSubmissionSummary(e.target.value)}
              className="w-full h-32 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none font-mono text-sm"
              placeholder={language === 'zh' ? '貼上送審摘要...' : 'Paste submission summary...'}
            />
          </div>

          {/* Review Guidance */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-emerald-500" />
              {language === 'zh' ? '審查指引 (Review Guidance)' : 'Review Guidance'}
            </h3>
            <div className="mb-4">
              <input type="file" className="text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400" accept=".txt,.md" onChange={(e) => handleFileUpload(e, setGuidance)} />
            </div>
            <textarea
              value={guidance}
              onChange={(e) => setGuidance(e.target.value)}
              className="w-full h-32 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none font-mono text-sm"
              placeholder={language === 'zh' ? '貼上法規依據...' : 'Paste review guidance...'}
            />
          </div>

          {/* Report Template */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-emerald-500" />
                {language === 'zh' ? '報告模板 (Report Template)' : 'Report Template'}
              </h3>
              <button
                onClick={() => downloadMarkdown(template, 'template.md')}
                className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                {language === 'zh' ? '下載模板' : 'Download'}
              </button>
            </div>
            <div className="mb-4">
              <input type="file" className="text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400" accept=".txt,.md" onChange={(e) => handleFileUpload(e, setTemplate)} />
            </div>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full h-48 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none font-mono text-sm"
              placeholder={language === 'zh' ? '編輯 Markdown 模板...' : 'Edit Markdown template...'}
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
              {language === 'zh' ? '生成審查報告' : 'Generate Report'}
            </button>

            <TelemetryTerminal 
              isGenerating={isGenerating} 
              onStop={handleStop} 
              language={language} 
              logs={logs} 
            />
          </div>
        </div>

        {/* Right Column: Output */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col h-full min-h-[800px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-emerald-500" />
              {language === 'zh' ? '報告結果' : 'Report Output'}
            </h3>
            {generatedReport && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors"
                >
                  {viewMode === 'edit' ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  {viewMode === 'edit' ? (language === 'zh' ? '預覽' : 'Preview') : (language === 'zh' ? '編輯' : 'Edit')}
                </button>
                <button
                  onClick={() => downloadMarkdown(generatedReport, 'review_report.md')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 text-emerald-700 dark:text-emerald-400 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {language === 'zh' ? '下載 MD' : 'Download MD'}
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            {isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <p>{language === 'zh' ? 'AI 正在撰寫審查報告...' : 'AI is writing the review report...'}</p>
              </div>
            ) : generatedReport ? (
              viewMode === 'edit' ? (
                <textarea
                  value={generatedReport}
                  onChange={(e) => setGeneratedReport(e.target.value)}
                  className="w-full h-full min-h-[600px] p-4 bg-transparent border-none focus:ring-0 resize-none font-mono text-sm text-zinc-900 dark:text-zinc-100"
                />
              ) : (
                <div className="prose prose-zinc dark:prose-invert max-w-none prose-sm">
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        if (!inline && match && match[1] === 'mermaid') {
                          return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                        }
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {generatedReport}
                  </Markdown>
                </div>
              )
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-400">
                <p>{language === 'zh' ? '尚未生成報告' : 'No report generated yet'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
