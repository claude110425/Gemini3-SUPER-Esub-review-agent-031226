import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, ListChecks, Settings, FileSignature, Moon, Sun, Globe } from 'lucide-react';
import GuidanceGenerator from './pages/GuidanceGenerator';
import SubmissionTriage from './pages/SubmissionTriage';
import ReviewReport from './pages/ReviewReport';
import SettingsPage from './pages/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState('guidance');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  const tabs = [
    { id: 'guidance', label: language === 'zh' ? '智慧指引生成' : 'Guidance Generator', icon: FileText },
    { id: 'triage', label: language === 'zh' ? '送審清單智慧分類' : 'Submission Triage', icon: ListChecks },
    { id: 'report', label: language === 'zh' ? '審查報告生成' : 'Review Report', icon: FileSignature },
    { id: 'settings', label: language === 'zh' ? '設定' : 'Settings', icon: Settings },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'dark bg-zinc-950 text-zinc-50' : 'bg-zinc-50 text-zinc-900'}`}>
      {/* Sidebar / Navigation */}
      <nav className="fixed top-0 left-0 h-full w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col z-10 shadow-sm">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold">
            SM
          </div>
          <h1 className="font-semibold text-lg tracking-tight">SmartMed 2.0</h1>
        </div>

        <div className="flex-1 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {isDarkMode ? (language === 'zh' ? '淺色模式' : 'Light Mode') : (language === 'zh' ? '深色模式' : 'Dark Mode')}
          </button>
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <Globe className="w-5 h-5" />
            {language === 'zh' ? 'English' : '繁體中文'}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="ml-64 p-8 min-h-screen">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          {activeTab === 'guidance' && <GuidanceGenerator language={language} />}
          {activeTab === 'triage' && <SubmissionTriage language={language} />}
          {activeTab === 'report' && <ReviewReport language={language} />}
          {activeTab === 'settings' && <SettingsPage language={language} />}
        </motion.div>
      </main>
    </div>
  );
}
