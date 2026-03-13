import { useState, useRef } from 'react'
import { Send, Paperclip, X, Image, FileText, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

async function imageToBase64(file) {
    return new Promise(resolve => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.readAsDataURL(file)
    })
}

async function extractPdfText(file) {
    try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        let fullText = ''
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const content = await page.getTextContent()
            fullText += content.items.map(item => item.str).join(' ') + '\n'
        }
        return fullText.substring(0, 50000)
    } catch {
        return '[PDF text extraction failed]'
    }
}

export default function ChatInput({ onSend, disabled, sessionId }) {
    const [text, setText] = useState('')
    const [attachments, setAttachments] = useState([])
    const [processing, setProcessing] = useState(false)
    const fileRef = useRef()
    const { user } = useAuth()

    async function handleFile(e) {
        const file = e.target.files[0]
        if (!file) return
        setProcessing(true)

        try {
            let att = { name: file.name, type: 'other' }

            if (file.type.startsWith('image/')) {
                att.type = 'image'
                att.mimeType = file.type
                att.base64 = await imageToBase64(file)
            } else if (file.type === 'application/pdf') {
                att.type = 'document'
                att.extractedText = await extractPdfText(file)
            } else if (file.name.endsWith('.docx')) {
                const mammoth = await import('mammoth')
                const buf = await file.arrayBuffer()
                const result = await mammoth.extractRawText({ arrayBuffer: buf })
                att.type = 'document'
                att.extractedText = result.value.substring(0, 50000)
            } else if (file.type === 'text/plain') {
                att.type = 'document'
                att.extractedText = await file.text()
            }

            // Upload to Supabase storage
            if (user && sessionId) {
                const path = `${user.id}/${sessionId}/${Date.now()}_${file.name}`
                await supabase.storage.from('study-materials').upload(path, file)
            }

            setAttachments(prev => [...prev, att])
        } catch (err) {
            console.error('File processing error:', err)
        } finally {
            setProcessing(false)
            e.target.value = ''
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if ((!text.trim() && attachments.length === 0) || disabled) return
        const content = text.trim()
        const atts = [...attachments]
        setText('')
        setAttachments([])
        await onSend(content || '(Attachment sent)', atts)
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    const fileIcon = att => att.type === 'image' ? <Image size={12} /> : <FileText size={12} />

    return (
        <div className="chat-input-wrap">
            {attachments.length > 0 && (
                <div className="chat-input-attachments">
                    {attachments.map((att, i) => (
                        <div key={i} className="chat-input-att-tag">
                            {fileIcon(att)} {att.name}
                            <button onClick={() => setAttachments(a => a.filter((_, j) => j !== i))}>
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit} className="chat-input-form">
                <input ref={fileRef} type="file" hidden accept="image/*,.pdf,.docx,.txt" onChange={handleFile} />

                <button
                    type="button"
                    className="chat-input-action"
                    onClick={() => fileRef.current.click()}
                    disabled={processing || disabled}
                    title="Attach file"
                >
                    {processing ? <Loader2 size={18} className="spin-icon" /> : <Paperclip size={18} />}
                </button>

                <textarea
                    className="chat-input-field"
                    placeholder="Ask anything... (Shift+Enter for new line)"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    disabled={disabled}
                />

                <button
                    type="submit"
                    className={`chat-input-send ${(text.trim() || attachments.length) && !disabled ? 'active' : ''}`}
                    disabled={(!text.trim() && !attachments.length) || disabled}
                >
                    {disabled ? <Loader2 size={18} className="spin-icon" /> : <Send size={18} />}
                </button>
            </form>

            <style>{`
        .chat-input-wrap {
          border-top: 1px solid var(--glass-border);
          background: var(--bg-2);
          padding: 12px 16px;
          flex-shrink: 0;
        }
        .chat-input-attachments {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 8px;
        }
        .chat-input-att-tag {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 6px;
          font-size: 11px;
          color: var(--text-2);
        }
        .chat-input-att-tag button {
          color: var(--text-3);
          display: flex; align-items: center;
          cursor: pointer;
          margin-left: 2px;
        }
        .chat-input-att-tag button:hover { color: var(--error); }
        .chat-input-form {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          background: var(--glass);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 8px 10px;
          transition: border-color 0.2s;
        }
        .chat-input-form:focus-within { border-color: var(--brand-from); }
        .chat-input-action, .chat-input-send {
          width: 34px; height: 34px;
          flex-shrink: 0;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-3);
          transition: all 0.2s;
          cursor: pointer;
          background: none;
          border: none;
        }
        .chat-input-action:hover:not(:disabled) {
          background: var(--glass-hover);
          color: var(--text-1);
        }
        .chat-input-send { cursor: not-allowed; }
        .chat-input-send.active {
          background: linear-gradient(135deg, var(--brand-from), var(--brand-to));
          color: #fff;
          cursor: pointer;
          box-shadow: 0 2px 10px var(--brand-glow);
        }
        .chat-input-send.active:hover { transform: scale(1.05); }
        .chat-input-field {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: var(--text-1);
          font-size: 14px;
          line-height: 1.5;
          resize: none;
          max-height: 120px;
          overflow-y: auto;
          padding: 4px 0;
          font-family: var(--font-sans);
        }
        .chat-input-field::placeholder { color: var(--text-3); }
        .spin-icon { animation: spin 0.7s linear infinite; }
      `}</style>
        </div>
    )
}
