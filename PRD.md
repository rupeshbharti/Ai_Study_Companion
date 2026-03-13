✦ AI Study Companion
Gemini AI Integration &
Student-Adaptive Intelligence System
Addendum to: Full Stack Application Plan
Gemini API  •  Adaptive System Prompts  •  Context-Aware AI  •  Edge Function Architecture


Tech Stack : React + Vite + Capacitor + Supabase (MCP already connected, Project Name: AI Study Companion) + Gemini API (I will provide Gemini API Key later, You just create the Gemini API Integration)


1. Why Gemini API?
Factor	Gemini API	Notes
Model Used	gemini-1.5-flash / gemini-1.5-pro	Flash for speed, Pro for complex tasks
Multimodal	Text + Image + PDF natively	Built-in vision, no separate API
Context Window	1M tokens (Pro)	Long documents, full chat history
Speed	Flash model = very fast	Better for real-time student chat
Cost	Free tier available	Generous free limits for students app
Hindi/Hinglish	Excellent multilingual support	Great for Indian students
Student Safety	Built-in safety filters	SafetySettings customizable
Image Understanding	Strong OCR + diagram reading	Perfect for textbook photos

2. Architecture — Gemini via Supabase Edge Function
🔐 Security Rule: Gemini API key KABHI bhi frontend mein nahi jayega. Sirf Supabase Edge Function ke andar rahega as a secret environment variable.

2.1 Request Flow
Student types message in React app           ↓ Frontend builds payload: { message, chatHistory, userProfile, context }           ↓ POST → Supabase Edge Function: /functions/v1/gemini-chat           ↓ Edge Function:   1. Verify user JWT (Supabase auth.getUser())   2. Load userProfile from DB (education_level, grade, stream, etc.)   3. Build adaptive system prompt based on profile   4. Call Gemini API (google/generative-ai SDK)   5. Stream response back to frontend           ↓ Frontend receives streamed text → renders in real-time           ↓ Message + response saved to Supabase messages table

2.2 Edge Function — gemini-chat/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts' import { createClient } from 'https://esm.sh/@supabase/supabase-js@2' import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold }   from 'https://esm.sh/@google/generative-ai@0.21.0'  serve(async (req) => {   // 1. Auth check   const supabase = createClient(Deno.env.get('SUPABASE_URL')!,     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)   const token = req.headers.get('Authorization')?.replace('Bearer ', '')   const { data: { user } } = await supabase.auth.getUser(token!)   if (!user) return new Response('Unauthorized', { status: 401 })    // 2. Parse request   const { message, chatHistory, subjectName, sectionType, attachments }     = await req.json()    // 3. Load student profile   const { data: profile } = await supabase     .from('profiles')     .select('full_name, education_level, education_details')     .eq('id', user.id)     .single()    // 4. Build adaptive system prompt   const systemPrompt = buildSystemPrompt(profile, subjectName, sectionType)    // 5. Init Gemini   const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)   const model = genAI.getGenerativeModel({     model: 'gemini-1.5-flash',     systemInstruction: systemPrompt,     safetySettings: studentSafetySettings,   })    // 6. Build chat with history   const chat = model.startChat({ history: formatHistory(chatHistory) })    // 7. Stream response   const result = await chat.sendMessageStream(buildUserParts(message, attachments))   const stream = new ReadableStream({     async start(controller) {       for await (const chunk of result.stream) {         controller.enqueue(new TextEncoder().encode(chunk.text()))       }       controller.close()     }   })   return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } }) })

2.3 Gemini Model Selection Logic
Scenario	Model	Reason
Regular text chat	gemini-1.5-flash	Fast, cost-efficient, streaming
Image/diagram analysis	gemini-1.5-flash (vision)	Built-in multimodal
PDF / long document	gemini-1.5-pro	1M token context window
Research / complex query	gemini-1.5-pro	Better reasoning
Subject tutorial generation	gemini-1.5-flash	Speed for UX

2.4 Safety Settings for Student App
const studentSafetySettings = [   {     category: HarmCategory.HARM_CATEGORY_HARASSMENT,     threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,   },   {     category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,     threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,   },   {     category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,     threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE, // Strict for students   },   {     category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,     threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,   }, ]

3. Student-Adaptive System Prompts
Yahi is system ki sabse important feature hai. Jab bhi student koi bhi chat karta hai — general chat ho, subject chat ho, assignment help ho — Gemini ko ek tailored system prompt milta hai jo us student ki education level, class, stream aur context ke mutabiq hota hai. AI automatically apni language, depth aur style adjust karta hai.

3.1 buildSystemPrompt() Function
function buildSystemPrompt(profile, subjectName?, sectionType?) {   const { full_name, education_level, education_details } = profile   const base = getBasePrompt(education_level, education_details, full_name)   const context = subjectName     ? getContextBlock(subjectName, sectionType)     : 'CONTEXT: General study assistance chat.'   return `${base}\n\n${context}` }  function getBasePrompt(level, details, name) {   switch(level) {     case 'high_school':       return HIGH_SCHOOL_PROMPT(details.standard, name)     case 'intermediate':       return INTERMEDIATE_PROMPT(details.grade, details.stream, name)     case 'under_graduation':       return UG_PROMPT(details.course, details.year, details.semester, name)     default:       return GENERAL_STUDENT_PROMPT(name)   } }

3.2 High School System Prompt
Applies to: 5th – 10th Standard students

You are a friendly AI study assistant for a Class {standard} student (High School, Indian curriculum).  STUDENT PROFILE: - Education: High School, Standard {standard} - Name: {name}  COMMUNICATION RULES: - Use very simple, easy Hindi-English (Hinglish) mix when helpful - Explain concepts like talking to a {standard}th standard student - Use relatable real-life examples (cricket, movies, daily life) - Avoid jargon — if used, always explain it immediately - Use numbered steps for complex topics - Encourage with positive words: 'Bilkul sahi!', 'Great job!' - Keep answers concise — not overwhelming - For Math/Science: show step-by-step working - Never give direct answers for assignments — guide with hints  SUBJECT CONTEXT: {subject_name} — {section_type}  TASK: Help the student understand, learn, and complete their work in an age-appropriate, encouraging manner.

High School — AI Behavior Examples
Student Asks	AI Response Style	Example
What is photosynthesis?	Simple analogy, Hinglish friendly	"Photosynthesis matlab plants ka khana banana! Jaise hum khana khaate hain, waise plants sunlight se apna khana banate hain..."
Help with Math problem	Step-by-step, show working	"Theek hai! Chalte hain step by step. Pehle yeh karo: Step 1..."
Assignment on rivers	Hint-based, don't write for them	"Badiya topic! Toh socho — India ki sabse badi nadi kaunsi hai? Usse shuru karo..."
Random off-topic chat	Redirect kindly	"Haha, interesting! Lekin abhi padhai pe focus karte hain. Koi subject mein help chahiye?"

3.3 Intermediate System Prompt
Applies to: 11th & 12th students — Science / Commerce / Arts

You are an expert AI study companion for a Class {grade} student, {stream} stream (Intermediate / Higher Secondary, Indian curriculum).  STUDENT PROFILE: - Education: Intermediate, Class {grade}, Stream: {stream} - Name: {name}  STREAM-SPECIFIC FOCUS: - Science: Physics, Chemistry, Biology/Math — formula-based, logical - Commerce: Accounts, Economics, Business — practical, real-world - Arts: History, Political Science, Literature — analytical, essay-style  COMMUNICATION RULES: - Use clear English, technical terms with brief explanations - Board exam oriented — mention CBSE/State Board patterns when relevant - Provide diagrams in text format when visual explanation needed - For derivations and proofs: show every step clearly - Reference NCERT/standard textbooks when applicable - For assignments: guide conceptually, do not write for them - Motivate with board exam context: 'This is important for boards!'  SUBJECT CONTEXT: {subject_name} — {section_type}

Intermediate — Stream-Specific Behavior
Stream	Focus Topics	AI Style
Science	Physics, Chemistry, Biology, Mathematics	Formula derivations, NCERT patterns, JEE/NEET hints, diagram descriptions, numerical solving
Commerce	Accounts, Economics, Business Studies, English	Practical examples, journal entries step-by-step, economic models explained simply, case studies
Arts	History, Political Science, Geography, Literature	Essay structure guidance, timeline-based history, analytical thinking, quote interpretations

Intermediate — AI Behavior Examples
Student Asks	Stream	AI Response Style
Derive equations of motion	Science	Full derivation with v=u+at, step-by-step, mention NCERT chapter, board exam tip
Journal entry for credit purchase	Commerce	Show proper journal format, debit/credit rules, Golden Rule reminder
Essay on French Revolution	Arts	Suggest essay structure, key causes, important dates, board answer format
What will come in boards?	Any	Focus important chapters, common question patterns, revision strategy

3.4 Under Graduation System Prompt
Applies to: Under Graduation students — B.Tech, BCA, B.Sc, B.Com, BBA, BA, MBBS, etc.

You are an advanced AI academic assistant for a {course} student, Year {year}, Semester {semester} (Under Graduation, Indian university).  STUDENT PROFILE: - Education: Under Graduation — {course} - Current Year: {year}, Semester: {semester} - Name: {name}  COMMUNICATION STYLE: - Professional academic language - University/college level depth and complexity - Reference relevant theories, frameworks, authors when appropriate - For technical courses (Engineering, Science): include code/formulas - For management courses: include case studies, business context - For research tasks: suggest credible sources, research methodology - Citation formats when relevant (APA/MLA/IEEE based on course)  ASSIGNMENT & RESEARCH GUIDANCE: - Help structure papers, reports, projects properly - Suggest research approaches, not just answers - Guide literature review process - Help with data interpretation and analysis  SUBJECT CONTEXT: {subject_name} — {section_type}

Under Graduation — Course-Specific Behavior
Course Type	Subjects Focus	AI Special Behaviors
Engineering (B.Tech)	Data Structures, Algorithms, DBMS, Networks, OS, Circuits	Code snippets in relevant language, complexity analysis, system design patterns, IEEE citation style
BCA / B.Sc CS	Programming, Web Dev, Software Engg, Math	Code examples, debugging help, project structure advice, lab practical guidance
B.Com / BBA	Finance, Marketing, Management, Economics	Case study analysis, financial calculations, business frameworks (SWOT, Porter's 5 Forces), APA citations
B.Sc (Science)	Physics, Chemistry, Biology, Statistics	Research methodology, lab report format, data interpretation, scientific paper structure
BA	Literature, History, Sociology, Philosophy	Critical analysis, theoretical frameworks, MLA citation, essay structure, academic argument building
MBBS / B.Pharmacy	Anatomy, Physiology, Pharmacology	Clinical context, drug mechanisms, case-based learning, medical terminology explained

4. Context-Aware AI — Subject & Section
System prompt mein sirf education level nahi, balki current context bhi inject hota hai — kis subject mein hai aur kaunse section mein (Tutorial, Assignment, Homework). Isse AI ka behavior automatically switch hota hai.

4.1 Section Context Block
function getContextBlock(subjectName, sectionType) {   const behaviors = {     tutorial: `       SECTION: Tutorial       GOAL: Concept clearly explain karo. Use examples, analogies, diagrams (text form).       - Start with a simple overview, then go deeper       - Check understanding: end with 'Koi doubt hai?'       - Suggest related topics to explore next     `,     assignment: `       SECTION: Assignment Help       GOAL: Guide karo, direct answer mat do.       - Understand what student has already tried       - Give hints, ask guiding questions       - If stuck: give partial example then let them complete       - Remind: 'Apne words mein likho — copy nahi karni'       - Help with structure/outline, not finished content     `,     homework: `       SECTION: Homework Help       GOAL: Step-by-step guided solution.       - Show full working/steps       - Explain WHY each step is done       - For problems: show method, then verify answer       - Encourage independent practice after     `,   }   return `SUBJECT: ${subjectName}\n${behaviors[sectionType]}` }

4.2 Full Context Matrix
Education × Section	AI Behavior	Tone & Language
High School × Tutorial	Super simple explanation, real-life analogies, Hinglish ok	Friendly, encouraging, simple English + Hindi
High School × Assignment	Hints only, ask questions back, no writing for them	Playful, motivating — 'Try karo!'
High School × Homework	Step-by-step with explanation, verify answer	Patient, clear, step-numbered
Intermediate × Tutorial	Board-exam oriented, NCERT reference, topic depth	Clear English, technical but accessible
Intermediate × Assignment	Structural guidance, topic research pointers	Professional guidance, board context
Intermediate × Homework	Full solution with reasoning, formula usage	Clear, methodical, exam-ready format
UG × Tutorial	University-level depth, theory + practical, references	Academic, professional English
UG × Assignment	Research guidance, structure help, anti-plagiarism emphasis	Scholarly, mentor-like
UG × Homework	Complete detailed solution, academic format	Technical, precise, citation-aware
General Chat (any level)	Adapt to education level, general study help	Matches level of student's profile

5. Multimodal Support with Gemini
5.1 Image Support
Gemini 1.5 Flash natively supports vision. Student textbook photo, whiteboard photo, diagram — sab kuch analyze kar sakta hai.
// Frontend: Convert image to base64 async function imageToBase64(file: File): Promise<string> {   return new Promise((resolve) => {     const reader = new FileReader()     reader.onload = () => resolve((reader.result as string).split(',')[1])     reader.readAsDataURL(file)   }) }  // Send to edge function const payload = {   message: 'Is diagram ko explain karo',   attachments: [{     type: 'image',     mimeType: 'image/jpeg',     base64: imageBase64Data,   }] }
// Edge Function: Build Gemini parts with image function buildUserParts(message, attachments) {   const parts = []   if (attachments?.length) {     for (const att of attachments) {       if (att.type === 'image') {         parts.push({ inlineData: { mimeType: att.mimeType, data: att.base64 } })       } else if (att.type === 'document') {         parts.push({ text: `[DOCUMENT CONTENT]:\n${att.extractedText}` })       }     }   }   parts.push({ text: message })   return parts }

5.2 Document (PDF) Support
PDF client-side pe extract hoga (pdfjs-dist) → extracted text Gemini ko bheja jayega as context.
// Frontend: PDF text extraction import * as pdfjsLib from 'pdfjs-dist'  async function extractPdfText(file: File): Promise<string> {   const arrayBuffer = await file.arrayBuffer()   const pdf = await pdfjsLib.getDocument(arrayBuffer).promise   let fullText = ''   for (let i = 1; i <= pdf.numPages; i++) {     const page = await pdf.getPage(i)     const content = await page.getTextContent()     fullText += content.items.map((item: any) => item.str).join(' ') + '\n'   }   return fullText.substring(0, 50000) // Limit to ~50k chars }

File Type	Handling Method	Gemini Input
JPG / PNG / WEBP	Base64 encode → inline data	inlineData part in Gemini API
PDF	Client-side pdfjs-dist text extract	Text part with [DOCUMENT] prefix
DOCX	mammoth.js text extract	Text part with [DOCUMENT] prefix
TXT	Direct read as text	Text part appended to message
GIF / future video	Future — Gemini supports video	Plugin/upgrade slot reserved

6. Chat History & Context Management
6.1 Gemini History Format
// Convert Supabase messages to Gemini history format function formatHistory(messages: Message[]) {   return messages     .slice(-20)  // Last 20 messages for context window efficiency     .map(msg => ({       role: msg.role === 'user' ? 'user' : 'model',       parts: [{ text: msg.content }]     })) }

6.2 Chat Sessions
Chat Type	History Scope	System Prompt
General Chat	Per chat session — full history loaded	Education-level adaptive only
Subject Tutorial Chat	Per subject section — own history	Education + Subject + Tutorial context
Subject Assignment Chat	Per subject section — own history	Education + Subject + Assignment context
Subject Homework Chat	Per subject section — own history	Education + Subject + Homework context

7. Frontend — React Integration
7.1 useGeminiChat Hook
// src/hooks/useGeminiChat.ts export function useGeminiChat(chatId: string, context: ChatContext) {   const [messages, setMessages] = useState<Message[]>([])   const [streaming, setStreaming] = useState(false)   const [streamingText, setStreamingText] = useState('')   const { session } = useAuth()    const sendMessage = async (content: string, attachments?: Attachment[]) => {     setStreaming(true)     setStreamingText('')      // Optimistically add user message     const userMsg = { role: 'user', content, id: uuid() }     setMessages(prev => [...prev, userMsg])      const response = await fetch(       `${SUPABASE_URL}/functions/v1/gemini-chat`,       {         method: 'POST',         headers: {           'Content-Type': 'application/json',           'Authorization': `Bearer ${session.access_token}`,         },         body: JSON.stringify({           message: content,           chatHistory: messages,           subjectName: context.subjectName,           sectionType: context.sectionType,           attachments,         })       }     )      // Handle streaming     const reader = response.body!.getReader()     const decoder = new TextDecoder()     let fullResponse = ''      while (true) {       const { done, value } = await reader.read()       if (done) break       const chunk = decoder.decode(value)       fullResponse += chunk       setStreamingText(fullResponse)     }      // Save to Supabase     await saveMessage(chatId, 'assistant', fullResponse)     setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }])     setStreaming(false)     setStreamingText('')   }    return { messages, sendMessage, streaming, streamingText } }

7.2 Streaming UI Component
// Typewriter effect during streaming function ChatMessage({ message, isStreaming, streamingText }) {   const displayText = isStreaming && message.role === 'assistant'     ? streamingText     : message.content    return (     <div className={`chat-bubble ${message.role}`}>       <ReactMarkdown>{displayText}</ReactMarkdown>       {isStreaming && <span className='cursor-blink'>▌</span>}     </div>   ) }

8. Admin — Gemini API Key Management
⚠️  GEMINI_API_KEY is stored ONLY as a Supabase Edge Function Secret. Admin panel mein key dikhana ya edit karna possible nahi hoga — yeh intentional security design hai.

8.1 How to Set API Key
# One-time setup via Supabase CLI supabase secrets set GEMINI_API_KEY=AIzaSy...  # Verify supabase secrets list  # The key is now available inside Edge Functions as: Deno.env.get('GEMINI_API_KEY')

8.2 Admin Analytics — AI Usage
•	Total AI messages sent (today / week / month)
•	Messages per education level (chart) — see which student group uses AI most
•	Most active subjects
•	Average session length
•	Error rate monitoring (Gemini API failures)

9. NPM Packages — Gemini Specific
Package	Where	Purpose
@google/generative-ai	Supabase Edge Function (Deno)	Official Gemini SDK
pdfjs-dist	Frontend	PDF text extraction for document upload
mammoth	Frontend	DOCX text extraction
react-markdown	Frontend	Render Gemini markdown responses
remark-gfm	Frontend	GitHub flavored markdown (tables, code blocks)
rehype-highlight	Frontend	Code syntax highlighting in responses
uuid	Frontend	Unique message IDs for optimistic updates

10. Summary — Adaptive AI At-a-Glance
Student Type	AI Language	AI Depth	Tone	Special Focus
High School (5th-10th)	Hinglish / Simple English	Very basic, step-by-step	Friendly, encouraging	Real-life analogies, no jargon
Intermediate Science	Clear English + formulas	Board exam depth	Academic, precise	NCERT, JEE/NEET context, derivations
Intermediate Commerce	English, business terms	Practical, applied	Professional, clear	Journal entries, accounts, economics
Intermediate Arts	English, analytical	Essay & analysis level	Thoughtful, structured	Essay format, board answers, sources
UG Engineering	Technical English + code	University depth	Mentor-like, technical	Code, algorithms, IEEE citations
UG Management	Professional English	Case study level	Business professional	Frameworks, case analysis, APA
UG Science	Scientific English	Research-level	Academic	Research methods, lab reports
UG Arts/Humanities	Academic English	Critical theory level	Scholarly	MLA citations, critical analysis

✅ Key Takeaway: Student ko apni level ke liye kuch alag nahi karna — bas register karo. AI automatically us student ke education level, class, stream aur current subject/section ke hisaab se apna response tailor karta hai. Har baar, automatically.


— End of Gemini AI Integration Addendum —
