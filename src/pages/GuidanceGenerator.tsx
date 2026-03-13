import React, { useState, useRef } from 'react';
import { Upload, FileText, Wand2, Loader2, Download } from 'lucide-react';
import { generateTextStream } from '../services/geminiService';
import { PAINTER_PERSONAS, LLM_MODELS } from '../constants';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Mermaid from '../components/Mermaid';
import TelemetryTerminal from '../components/TelemetryTerminal';

interface Props {
  language: 'zh' | 'en';
}

export default function GuidanceGenerator({ language }: Props) {
  const [guidanceInput, setGuidanceInput] = useState('');
  const [persona, setPersona] = useState(PAINTER_PERSONAS[0].id);
  const [model, setModel] = useState(LLM_MODELS[0].id);
  const [generatedGuidance, setGeneratedGuidance] = useState('');
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
    if (!guidanceInput) {
      setError(language === 'zh' ? '請輸入或上傳法規依據' : 'Please input or upload guidance');
      return;
    }
    setError('');
    setIsGenerating(true);
    setGeneratedGuidance('');
    setLogs([]);
    addLog('[SYSTEM] Initializing Guidance Generator...');
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const selectedPersona = PAINTER_PERSONAS.find(p => p.id === persona);
      const systemInstruction = selectedPersona?.prompt;
      const prompt = `請根據以下法規內容，生成一份結構化的醫療器材審查指引 (Review Guidance)。
      內容需包含：
      1. 適用範圍
      2. 審查重點
      3. WOW 3 模擬退件風險評估：常見缺失與風險預測 (例如：未附出產國許可製售證明 CFS 等)
      4. WOW 2 國際法規智能對照：將 TFDA 規範對照至美國 FDA Product Code 或歐盟 MDR 分類
      5. WOW 1 Mermaid 視覺化審查流程圖：請使用 \`\`\`mermaid 語法包裝，標示出 Class I/II/III 的審查路徑
      6. WOW 4 法規溯源熱區圖 (Regulatory Traceability Heatmap)：以表格呈現各項要求對應的法規條文。
      
      法規內容：
      ${guidanceInput}`;

      addLog(`[LLM] Connecting to ${model}...`);
      addLog(`[LLM] Applying persona: ${selectedPersona?.name}`);
      
      const stream = await generateTextStream(model, prompt, systemInstruction, controller.signal);
      
      addLog('[LLM] Receiving data stream...');
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        setGeneratedGuidance(fullText);
      }
      addLog('[SUCCESS] Guidance generated successfully.');
    } catch (err: any) {
      if (err.message === 'AbortError') {
        addLog('[ERROR] Generation aborted by user.');
      } else {
        setError(err.message || 'Generation failed');
        addLog(`[ERROR] ${err.message}`);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setGuidanceInput(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {language === 'zh' ? '智慧指引生成' : 'Guidance Generator'}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          {language === 'zh' ? '上傳法規文件，結合畫家風格與 WOW 功能生成動態審查指引。' : 'Upload regulations to generate dynamic review guidance with painter personas and WOW features.'}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" />
              {language === 'zh' ? '法規依據輸入' : 'Guidance Input'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                {language === 'zh' ? '上傳文件 (.txt, .md)' : 'Upload File (.txt, .md)'}
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-300 border-dashed rounded-xl cursor-pointer bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-zinc-400" />
                    <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
                      <span className="font-semibold">{language === 'zh' ? '點擊上傳' : 'Click to upload'}</span> {language === 'zh' ? '或拖曳檔案至此' : 'or drag and drop'}
                    </p>
                  </div>
                  <input type="file" className="hidden" accept=".txt,.md,.csv" onChange={handleFileUpload} />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                {language === 'zh' ? '直接貼上文本' : 'Paste Text Directly'}
              </label>
              <textarea
                value={guidanceInput}
                onChange={(e) => setGuidanceInput(e.target.value)}
                className="w-full h-64 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none font-mono text-sm"
                placeholder={language === 'zh' ? '請輸入法規條文...' : 'Enter regulation text...'}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                {language === 'zh' ? '畫家風格 (Persona)' : 'Painter Persona'}
              </label>
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
              >
                {PAINTER_PERSONAS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                {language === 'zh' ? 'AI 模型' : 'AI Model'}
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
              >
                {LLM_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              {language === 'zh' ? '生成智慧指引' : 'Generate Guidance'}
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
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col h-full min-h-[600px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-emerald-500" />
              {language === 'zh' ? '生成結果' : 'Generated Output'}
            </h3>
            {generatedGuidance && (
              <button
                onClick={() => {
                  const blob = new Blob([generatedGuidance], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'guidance.md';
                  a.click();
                }}
                className="p-2 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                title="Download Markdown"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            {isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <p>{language === 'zh' ? 'AI 正在分析法規並生成指引...' : 'AI is analyzing regulations and generating guidance...'}</p>
              </div>
            ) : generatedGuidance ? (
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
                  {generatedGuidance}
                </Markdown>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-400">
                <p>{language === 'zh' ? '尚未生成內容' : 'No content generated yet'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
