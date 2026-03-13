export const DEFAULT_REVIEW_GUIDANCE = `《醫療器材許可證核發與登錄及年度申報準則》
第一等級醫材 (準則第 5 條)：附表一文件、資料、規費。得免核定成分、材料、結構、規格、標籤、說明書。
第二/三等級醫材 (準則第 6 條)：附表二及附表三資料。專供外銷者得免核定成分、材料、規格等事項。
優先審查 (準則第 9 條)：臨床試驗驗證資料、緊急醫療需求證明。
許可證展延 (準則第 17 條)：原許可證、QMS 證明文件。國內製造者免附 CFS、免附授權書。
登錄制度 (準則第 20 條)：登錄系統之基本資料、滅菌狀態、QMS 情形。經公告免取得製造許可之品項。
`;

export const DEFAULT_REPORT_TEMPLATE = `# 醫療器材審查報告 (Medical Device Review Report)

## 1. 申請案基本資料 (Application Basic Information)
- **申請廠商 (Applicant):** [請填寫]
- **產品名稱 (Product Name):** [請填寫]
- **申請類別 (Application Type):** [第一等級 / 第二等級 / 第三等級]
- **預期用途 (Intended Use):** [請填寫]

## 2. 送審文件清單審核 (Submission Document Review)
### 2.1 必要項目 (Required Items)
[列出必要項目並說明審核結果]

### 2.2 非必要/豁免項目 (Exempted Items)
[列出非必要項目並說明理由]

### 2.3 選用/建議項目 (Optional Items)
[列出選用項目並說明其附加價值]

## 3. 核心審查意見 (Core Review Comments)
### 3.1 安全性與功效性評估 (Safety and Efficacy Assessment)
[詳細評估內容]

### 3.2 品質管理系統 (QMS)
[QMS 審核結果]

## 4. 綜合評估與結論 (Conclusion)
- **審查結論 (Review Conclusion):** [准予核發 / 補件 / 駁回]
- **建議事項 (Recommendations):** [後續建議]
`;

export const PAINTER_PERSONAS = [
  { id: 'default', name: '預設審查員 (Default Reviewer)', prompt: '你是一位專業、嚴謹的醫療器材審查員。' },
  { id: 'davinci', name: '達文西 (Leonardo da Vinci)', prompt: '你是一位追求精密比例與人體解剖完美的審查員。在分析這份醫材指引時，請強調產品結構與生物力學的設計美學，並使用古典科學筆觸來描述審查標準。' },
  { id: 'vangogh', name: '梵谷 (Vincent van Gogh)', prompt: '你是一位充滿熱情與感性的審查員。請用強烈的情感與色彩豐富的詞彙來描述這份醫材對人類生命的影響與審查標準。' },
  { id: 'rembrandt', name: '林布蘭 (Rembrandt)', prompt: '你是一位擅長光影對比的審查員。請在審查報告中強調該醫材帶來的「光明」與潛在風險的「陰暗面」，並以戲劇性的語氣呈現。' },
  { id: 'picasso', name: '畢卡索 (Pablo Picasso)', prompt: '你是一位打破常規的審查員。請從多個不同視角與維度來解構這份醫材的設計與法規要求。' },
  { id: 'dali', name: '達利 (Salvador Dali)', prompt: '你是一位超現實主義的審查員。請用夢幻、奇異的比喻來解釋枯燥的法規條文。' }
];

export const LLM_MODELS = [
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Recommended for Complex Tasks)' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Fast & Efficient)' },
  { id: 'gemini-3.1-flash-preview', name: 'Gemini 3.1 Flash Preview (Next Gen Fast)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Legacy Fast)' }
];
