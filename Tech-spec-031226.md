Technical Specification: SmartMed Review 2.0
Document Control
Document Version: 2.0.0
Date: March 12, 2026
Status: Final / Approved
Prepared For: SmartMed Regulatory Affairs & Development Team
System Name: SmartMed Review 2.0 (智慧醫材審查指引與清單生成系統)
1. Executive Summary
1.1 Product Vision
SmartMed Review 2.0 is a cutting-edge, AI-powered Single Page Application (SPA) designed to revolutionize the Medical Device Regulatory Affairs (RA) review process. By leveraging Google's advanced Gemini Large Language Models (LLMs), the system automates the generation of regulatory guidance, intelligent triage of submission checklists, and the drafting of comprehensive review reports. The primary objective is to reduce manual review time by 70%, minimize human error, and ensure strict compliance with international medical device regulations (e.g., TFDA, FDA, EU MDR).
1.2 Target Audience
Regulatory Affairs (RA) Specialists: Core users who analyze medical device submissions and draft review reports.
Medical Device Reviewers (Government/Notified Bodies): Officials who evaluate the safety and efficacy of medical devices based on submitted dossiers.
Quality Assurance (QA) Managers: Personnel ensuring that submission documents meet all regulatory standards before official submission.
1.3 Key Objectives
Automated Guidance Generation: Transform raw regulatory text into structured, actionable review guidelines.
Intelligent Submission Triage: Automatically categorize submission documents into Required, Not Required, and Optional items using AI-driven structured data parsing.
Comprehensive Report Drafting: Generate 3000-4000 word professional review reports based on submission summaries and regulatory guidance.
Real-time Telemetry & Control: Provide users with real-time visibility into the AI's thought process and the ability to interrupt generation instantly.
Creative Personas: Apply unique narrative styles (e.g., Da Vinci, Van Gogh) to regulatory documents to improve readability and engagement during internal training or review.
2. System Architecture
2.1 High-Level Architecture Overview
SmartMed Review 2.0 is built as a client-side Single Page Application (SPA) using React 18 and Vite. It operates entirely within the user's browser, communicating directly with the Google Gemini API via the @google/genai SDK. There is no dedicated backend database or server-side processing for the core application logic, ensuring maximum data privacy as regulatory texts remain on the client machine until sent to the LLM.
code
Mermaid
graph TD
    A[User Interface / React SPA] -->|User Input & Config| B(State Management / Context API)
    B --> C{Module Router}
    C -->|Tab 1| D[Guidance Generator]
    C -->|Tab 2| E[Submission Triage]
    C -->|Tab 3| F[Review Report]
    C -->|Tab 4| G[Settings]
    
    D --> H[Gemini Service Layer]
    E --> H
    F --> H
    
    H -->|REST/gRPC over HTTP| I((Google Gemini API))
    I -->|Streaming Text / JSON| H
    
    H -->|Updates| J[Telemetry Terminal]
    J --> A
2.2 Core Architectural Principles
Stateless Client: The application does not persist sensitive submission data across sessions. All data is held in React state (useState, useContext) and is cleared upon page refresh, adhering to strict data security protocols for unclassified medical device data.
Component-Driven Design: The UI is broken down into atomic, reusable components (e.g., TelemetryTerminal, Mermaid, SettingsContext) to promote maintainability.
Asynchronous Streaming: To handle large LLM responses (up to 4000 words), the system utilizes asynchronous generator functions (for await...of) to stream text chunks to the UI in real-time, preventing browser UI thread blocking and enhancing perceived performance.
Graceful Degradation & Interruption: The architecture includes an AbortController pattern deeply integrated into the service layer, allowing users to sever the HTTP connection to the LLM instantly.
3. Technology Stack & Dependencies
3.1 Frontend Framework
React 18: Utilized for its concurrent rendering capabilities and robust ecosystem. Functional components and Hooks (useState, useEffect, useRef, useContext) are used exclusively.
Vite: Chosen as the build tool and development server for its native ES modules support, resulting in near-instant Hot Module Replacement (HMR) and highly optimized production builds.
TypeScript: Enforces static typing across the application, defining strict interfaces for LLM responses (especially crucial for the JSON-structured Submission Triage feature) and component props.
3.2 Styling & UI Components
Tailwind CSS: A utility-first CSS framework used for all styling. It enables rapid UI development without context-switching between TSX and CSS files. The configuration includes custom color palettes (Zinc, Emerald) and dark mode support via the dark: variant.
Lucide React: A comprehensive library of clean, consistent SVG icons used throughout the application for visual cues (e.g., Wand2, Terminal, Square, CheckCircle2).
3.3 Markdown & Visualization
React Markdown (react-markdown): Safely renders the Markdown output generated by the Gemini API into HTML.
Remark GFM (remark-gfm): A plugin for react-markdown that adds support for GitHub Flavored Markdown, enabling the rendering of tables, strikethrough, and task lists (essential for the Traceability Heatmap).
Mermaid JS (mermaid): A JavaScript-based diagramming and charting tool that renders Markdown-inspired text definitions to create and modify diagrams dynamically. Used specifically for the "WOW 1: Visual Review Flowchart" feature.
3.4 AI & Machine Learning Integration
Google Gen AI SDK (@google/genai): The official SDK used to interface with Google's Gemini models. It handles authentication, payload formatting, streaming connections, and structured output parsing.
4. Detailed Module Specifications
4.1 Module 1: Guidance Generator (GuidanceGenerator.tsx)
4.1.1 Purpose
To ingest raw, often dense regulatory text (e.g., TFDA guidelines) and transform it into a highly structured, readable review guidance document.
4.1.2 State Variables
guidanceInput (string): The raw regulatory text input by the user.
persona (string): The selected creative persona ID (e.g., 'da-vinci').
model (string): The selected Gemini model ID.
generatedGuidance (string): The accumulated Markdown string returned by the LLM.
isGenerating (boolean): Tracks the active state of the LLM request.
logs (string[]): Array of timestamped log messages for the Telemetry Terminal.
abortControllerRef (MutableRefObject<AbortController | null>): Holds the reference to the active abort controller to allow request cancellation without triggering re-renders.
4.1.3 Prompt Engineering Strategy
The prompt is dynamically constructed using template literals. It explicitly demands six core sections, integrating four "WOW" features:
code
TypeScript
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
4.1.4 Execution Flow
User inputs text and clicks "Generate".
handleGenerate initializes an AbortController and clears previous logs.
The system fetches the system instruction associated with the selected persona from SettingsContext.
generateTextStream is called in geminiService.ts.
As chunks arrive via the async iterator, generatedGuidance is updated, triggering a re-render of the Markdown component.
If the user clicks "Stop", abortControllerRef.current.abort() is called, throwing an AbortError in the service, which is caught and logged gracefully.
4.2 Module 2: Submission Triage (SubmissionTriage.tsx)
4.2.1 Purpose
To automate the initial triage of a medical device submission package. It compares the submitted document list against the regulatory guidance and categorizes them.
4.2.2 Data Interfaces
code
TypeScript
interface TriageResult {
  required: { item: string; reference: string; reason: string }[];
  not_required: { item: string; reason: string }[];
  optional: { item: string; reference: string; reason: string }[];
}
4.2.3 Structured Output Implementation
Unlike the Guidance Generator which uses streaming text, the Submission Triage relies on Structured JSON Output. This is a critical technical distinction. The system forces the LLM to return a valid JSON object matching a specific schema.
In geminiService.ts, the generateTriage function utilizes the responseSchema configuration:
code
TypeScript
config: {
  responseMimeType: "application/json",
  responseSchema: {
    type: Type.OBJECT,
    properties: {
      submission_triage: {
        type: Type.OBJECT,
        properties: {
          required: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { item: { type: Type.STRING }, reference: { type: Type.STRING }, reason: { type: Type.STRING } } } },
          not_required: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { item: { type: Type.STRING }, reason: { type: Type.STRING } } } },
          optional: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { item: { type: Type.STRING }, reference: { type: Type.STRING }, reason: { type: Type.STRING } } } }
        },
        required: ["required", "not_required", "optional"]
      }
    },
    required: ["submission_triage"]
  }
}
Technical Note: Streaming is disabled for this module because partial JSON strings cannot be reliably parsed into the complex UI layout required for the triage dashboard. The system waits for the full response, parses it via JSON.parse(), and updates the state.
4.3 Module 3: Review Report Generator (ReviewReport.tsx)
4.3.1 Purpose
To draft a comprehensive, 3000-4000 word formal review report based on the submission summary, the regulatory guidance, and a predefined report template.
4.3.2 State Variables
submissionSummary (string): The user-provided summary of the manufacturer's submission.
guidance (string): The regulatory baseline.
template (string): The Markdown template dictating the structure of the final report.
viewMode ('edit' | 'preview'): Toggles between a raw textarea for manual Markdown editing and the rendered react-markdown view.
4.3.3 Prompt Engineering Strategy
The prompt is highly complex, acting as a strict instruction set for a professional persona.
code
TypeScript
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
4.3.4 Streaming and Editing Workflow
The LLM streams the massive report chunk by chunk.
The TelemetryTerminal provides real-time feedback, preventing the user from thinking the application has frozen during the long generation process (which can take 10-30 seconds for 4000 words).
Once complete, the user can toggle to edit mode. The textarea is bound to the generatedReport state, allowing manual refinement of the AI's draft.
The user can download the final report as a .md file using a dynamically generated Blob URL.
4.4 Module 4: Telemetry Terminal & Interrupt Mechanism (TelemetryTerminal.tsx)
4.4.1 Purpose
To provide deep observability into the system's background processes and offer a hard-stop mechanism for runaway or incorrect LLM generations.
4.4.2 Component Props
code
TypeScript
interface Props {
  isGenerating: boolean;
  onStop: () => void;
  language: 'zh' | 'en';
  logs: string[];
}
4.4.3 Technical Implementation
UI Design: Styled to look like a hacker/developer terminal using bg-zinc-950, font-mono, and specific color coding (Emerald for success/info, Red for errors).
Auto-scrolling: The container uses overflow-y-auto. (Future enhancement: implement a useRef to auto-scroll to the bottom as new logs arrive).
The Interrupt Pattern:
The parent component creates an AbortController.
The signal is passed down to the geminiService.
Inside the for await (const chunk of responseStream) loop, the code explicitly checks if (signal?.aborted) throw new Error('AbortError');.
When the user clicks the "Stop" button in the Terminal, onStop triggers controller.abort().
The loop breaks instantly, the network request is terminated by the browser, and the UI resets gracefully without crashing.
4.5 Module 5: Settings & Global State (SettingsContext.tsx)
4.5.1 Purpose
To manage application-wide configurations, including language preferences, dark mode toggles, and the management of custom AI Personas.
4.5.2 Context Definition
code
TypeScript
interface SettingsContextType {
  language: 'zh' | 'en';
  setLanguage: (lang: 'zh' | 'en') => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  personas: Persona[];
  addPersona: (persona: Persona) => void;
  updatePersona: (id: string, persona: Partial<Persona>) => void;
  deletePersona: (id: string) => void;
}
4.5.3 Implementation Details
Theme Management: The theme state toggles a dark class on the root <html> element. Tailwind's dark: variants respond to this class automatically.
Persona Management: Users can define custom system instructions (System Prompts). These are stored in the React state. When a user selects a persona in the Guidance Generator, the corresponding prompt string is passed as the systemInstruction configuration to the Gemini API, fundamentally altering the LLM's behavior and output style.
5. API Integration Layer (geminiService.ts)
5.1 Architecture
The service layer abstracts the @google/genai SDK, exposing clean, domain-specific asynchronous functions to the React components.
5.2 Supported Models
The system supports a tiered model approach, allowing users to balance speed, cost, and reasoning capability:
gemini-3.1-pro-preview: Used for complex reasoning, massive context windows (Review Reports).
gemini-3-flash-preview: Fast, efficient, good for standard guidance generation.
gemini-3.1-flash-preview: Next-generation speed and multimodal capabilities.
gemini-2.5-flash: Legacy fast model for fallback and basic tasks.
5.3 Streaming Implementation (generateTextStream)
code
TypeScript
export const generateTextStream = async function* (model: string, prompt: string, systemInstruction?: string, signal?: AbortSignal) {
  const client = getGeminiClient();
  const responseStream = await client.models.generateContentStream({
    model,
    contents: prompt,
    config: { systemInstruction }
  });

  for await (const chunk of responseStream) {
    if (signal?.aborted) throw new Error('AbortError');
    yield chunk.text;
  }
};
Technical Note: The use of async generators (async function*) allows the React component to consume the stream using a simple for await loop, cleanly separating the network logic from the UI state updates.
5.4 Structured Output Implementation (generateTriage)
This function enforces a strict JSON schema. If the LLM hallucinates or returns invalid JSON, the JSON.parse() will fail, which is caught by the UI's error boundary and displayed in the Telemetry Terminal.
6. Deep Dive: The "WOW" Features
6.1 WOW 1: Mermaid Visual Review Flowchart
Concept: Regulatory guidelines are often text-heavy and difficult to parse. This feature forces the LLM to synthesize the text into a decision tree or process flow.
Technical Execution: The prompt explicitly requests the output to be wrapped in mermaid ... code blocks. The custom <Mermaid /> React component intercepts these specific code blocks during Markdown rendering. It uses the mermaid.render() API to convert the text syntax into an inline SVG, providing a rich, interactive visual element directly within the document.
6.2 WOW 2: International Regulation Mapping
Concept: Medical devices are often submitted globally. Reviewers need to know how local regulations (e.g., TFDA) map to international standards.
Technical Execution: The LLM utilizes its vast pre-trained knowledge base to cross-reference the provided local regulatory text against FDA Product Codes (21 CFR) and EU MDR (Medical Device Regulation 2017/745) classifications, outputting a comparative analysis section automatically.
6.3 WOW 3: Risk Prediction (Simulated Rejection Assessment)
Concept: Proactive identification of common submission pitfalls.
Technical Execution: The LLM acts as a "Red Team" reviewer. Based on the specific guidance provided, it predicts the top 3-5 reasons a submission of this type might be rejected (e.g., missing Certificate of Free Sale, inadequate clinical evaluation reports), highlighting these risks prominently for the user.
6.4 WOW 4: Regulatory Traceability Heatmap
Concept: Ensuring every review requirement has a clear legal basis.
Technical Execution: The LLM generates a Markdown table mapping "Review Criteria" to "Specific Regulatory Clauses". This creates a "Heatmap" (visually represented as a dense data table) that allows auditors to trace every requirement back to the source text instantly.
6.5 WOW 5: Auto-Generated Clarification Q&A
Concept: Saving time during the "Request for Additional Information" (AI) phase.
Technical Execution: Appended to the end of the Review Report, the LLM analyzes the gaps it found in the submission summary and drafts ready-to-send, professionally toned questions directed at the manufacturer, asking for specific clarifications or missing documents.
6.6 WOW 6: Tone & Compliance Analyzer
Concept: Quality Assurance for the AI-generated report itself.
Technical Execution: A meta-cognitive step where the LLM evaluates the text it just generated. It appends a brief summary assessing whether the report maintains an objective, regulatory-appropriate tone and whether it strictly adhered to the provided template and guidance, acting as an automated peer-review step.
7. Security & Compliance Considerations
7.1 Client-Side Processing
Because SmartMed Review 2.0 is an SPA, all processing (except the API call to Google) happens in the browser. No proprietary medical device submission data is stored on a central database belonging to the application developers.
7.2 API Key Management
In the current AI Studio environment, the GEMINI_API_KEY is injected securely by the platform via process.env. In a production deployment, this architecture would require a lightweight backend proxy (e.g., Node.js/Express or Cloudflare Workers) to hold the API key securely and forward requests from the SPA to the Gemini API, preventing API key exposure in the client-side bundle.
7.3 Cross-Site Scripting (XSS) Prevention
Rendering Markdown generated by an AI introduces potential XSS vectors if the AI generates malicious HTML or JavaScript. The react-markdown library is configured to safely parse Markdown. By default, it escapes raw HTML, ensuring that only safe, standard Markdown elements (headers, lists, bold, italics, tables) are rendered into the DOM.
8. Performance Optimization Strategies
8.1 Streaming Rendering
By utilizing generateTextStream, the application achieves a Time to First Byte (TTFB) of milliseconds. The user begins reading the report immediately, rather than waiting 20 seconds for a 4000-word payload to resolve. This drastically improves perceived performance.
8.2 React State Batching
React 18 automatically batches state updates. When the streaming loop rapidly updates generatedGuidance and logs, React optimizes the DOM repaints, preventing UI stuttering during heavy text generation.
8.3 Conditional Rendering
Heavy components, such as the TelemetryTerminal or the Mermaid renderer, are only mounted when necessary (e.g., if (!isGenerating && logs.length === 0) return null;). This keeps the initial DOM tree lightweight.
9. Future Scalability & Extensibility
The current architecture is highly modular, allowing for rapid expansion.
Adding New Models: Simply updating the LLM_MODELS array in constants.ts instantly propagates the new model option across all UI dropdowns.
Adding New Tools: The geminiService.ts can be easily extended to include tools configurations, allowing the LLM to perform Google Searches (Grounding) or execute custom functions (e.g., querying an internal regulatory database) in future iterations.
10. 20 Comprehensive Follow-up Questions for Future Development
To further enhance and scale the SmartMed Review 2.0 system, please consider the following technical and product-oriented questions:
Architecture & Infrastructure
Backend Migration: Should we transition from a pure SPA to a Next.js SSR/API Route architecture to securely hide the Gemini API key and enable database integrations?
Database Integration: Which database solution (e.g., PostgreSQL, MongoDB, Firebase) is best suited for persisting user-generated reports, custom templates, and historical triage data?
Authentication (AuthN) & Authorization (AuthZ): How should we implement Single Sign-On (SSO) (e.g., OAuth 2.0, SAML) to integrate with existing enterprise identity providers (Active Directory)?
Role-Based Access Control (RBAC): Do we need to implement granular permissions where only "Senior Reviewers" can modify global report templates, while "Junior Reviewers" can only generate and read them?
AI & LLM Capabilities
Retrieval-Augmented Generation (RAG): Should we implement a vector database (e.g., Pinecone, Milvus) to allow the LLM to semantically search across thousands of past, approved review reports to ensure consistency in new reports?
Multimodal Inputs: Since Gemini 3.1 Flash supports multimodal inputs, should we allow users to upload images of medical devices or technical drawings for the AI to analyze alongside the text?
Agentic Workflows: Should we upgrade the system from a single-prompt generator to an Agentic workflow (using tools like LangChain or Google GenAI Function Calling) where the AI can autonomously query external regulatory databases (e.g., FDA 510(k) database) during report generation?
Fine-Tuning: Is there a business case for fine-tuning a dedicated Gemini model on the organization's specific historical review data to improve the tone and accuracy of the "WOW 6: Tone Analyzer"?
Confidence Scoring: Can we implement a mechanism in the Submission Triage module to output a "Confidence Score" (0-100%) for each categorization, flagging low-confidence items for mandatory human review?
User Experience (UX) & Interface (UI)
Collaborative Editing: Should we integrate a library like Yjs or Socket.io to allow multiple reviewers to co-edit the generated Markdown report in real-time, similar to Google Docs?
Advanced Document Parsing: Currently, the system relies on text input. Should we integrate PDF parsing libraries (e.g., PDF.js, Document AI) to allow users to drag-and-drop 500-page submission dossiers directly into the UI?
Interactive Mermaid Diagrams: Can we enhance the Mermaid component to allow users to click on nodes within the flowchart to expand detailed regulatory sub-clauses?
Diff Viewer: When a manufacturer submits a revised document, should we build a "Diff Viewer" UI that highlights exactly what changed between the V1 and V2 submissions, utilizing the LLM to summarize the impact of those changes?
Accessibility (a11y): Does the current Tailwind implementation meet WCAG 2.1 AA standards, particularly regarding color contrast in Dark Mode and screen reader support for the Telemetry Terminal?
Data Security & Compliance
Data Anonymization: Should we implement a pre-processing step (either via regex or a smaller, local NLP model) to scrub Personally Identifiable Information (PII) or Protected Health Information (PHI) from submission summaries before sending them to the Google Gemini API?
Audit Logging: For regulatory compliance (e.g., 21 CFR Part 11), do we need to implement immutable audit trails tracking exactly who generated which report, using which prompt, and at what timestamp?
Data Residency: Does the organization require the Gemini API calls to be routed through specific geographic regions (e.g., EU servers only) to comply with GDPR or local data sovereignty laws?
DevOps & Operations
CI/CD Pipeline: What is the preferred CI/CD tool (e.g., GitHub Actions, GitLab CI) to automate the linting, testing, and deployment of this Vite application to production environments?
Cost Monitoring: Since Gemini API usage is billed by token, how should we implement a telemetry dashboard to track token consumption per user/department to prevent budget overruns?
A/B Testing Prompts: Should we build an internal tool for prompt engineers to A/B test different versions of the "Review Report" system prompt and measure which version requires the least manual editing by the end-users?
