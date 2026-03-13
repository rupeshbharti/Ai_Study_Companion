import { useEffect, useRef, useState } from 'react'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import { Bot, Sparkles, Maximize2, Minimize2 } from 'lucide-react'

export default function ChatWindow({ hook, context, title, subtitle }) {
    const { messages, sendMessage, streaming, streamingText, loadMessages } = hook
    const bottomRef = useRef()
    const [maximized, setMaximized] = useState(false)

    useEffect(() => {
        loadMessages()
    }, [loadMessages])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, streamingText])

    // Escape key handler for maximized mode
    useEffect(() => {
        if (!maximized) return
        const handler = (e) => { if (e.key === 'Escape') setMaximized(false) }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [maximized])

    return (
        <div className={`chat-window ${maximized ? 'chat-window-maximized' : ''}`}>
            {/* Header */}
            <div className="chat-window-header">
                <div className="chat-window-header-icon">
                    <Bot size={18} />
                </div>
                <div>
                    <h3 className="chat-window-title">{title || 'AI Chat'}</h3>
                    {subtitle && <p className="chat-window-sub">{subtitle}</p>}
                </div>
                <div className="chat-window-status">
                    <span className="chat-status-dot" />
                    <span>Gemini AI</span>
                </div>
                <button
                    className="chat-maximize-btn"
                    onClick={() => setMaximized(m => !m)}
                    title={maximized ? 'Minimize chat' : 'Maximize chat'}
                >
                    {maximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
            </div>

            {/* Messages */}
            <div className="chat-messages">
                {messages.length === 0 && !streaming && (
                    <div className="chat-empty">
                        <div className="chat-empty-icon">
                            <Sparkles size={28} />
                        </div>
                        <h3>Start a conversation</h3>
                        <p>Ask me anything about your studies. I'm here to help!</p>
                    </div>
                )}

                {messages.map(msg => (
                    <ChatMessage
                        key={msg.id}
                        message={msg}
                        isStreaming={false}
                    />
                ))}

                {streaming && (
                    <ChatMessage
                        message={{ id: 'streaming', role: 'assistant', content: '', created_at: new Date().toISOString() }}
                        isStreaming={true}
                        streamingText={streamingText}
                    />
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <ChatInput
                onSend={sendMessage}
                disabled={streaming}
                sessionId={context?.sessionId}
            />

            <style>{`
        .chat-window {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg);
          overflow: hidden;
        }
        .chat-window-maximized {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 999999 !important;
          border-radius: 0;
          animation: chat-maximize-in 0.25s ease;
        }
        @keyframes chat-maximize-in {
          from { opacity: 0.8; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .chat-window-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          border-bottom: 1px solid var(--glass-border);
          background: var(--bg-2);
          flex-shrink: 0;
        }
        .chat-window-header-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, var(--brand-from), var(--brand-to));
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }
        .chat-window-title { font-size: 15px; font-weight: 600; color: var(--text-1); }
        .chat-window-sub { font-size: 12px; color: var(--text-3); margin-top: 1px; }
        .chat-window-status {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-3);
        }
        .chat-status-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--success);
          box-shadow: 0 0 6px var(--success);
          animation: blink 2s ease infinite;
        }
        .chat-maximize-btn {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: var(--glass);
          border: 1px solid var(--glass-border);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-2);
          cursor: pointer;
          transition: all 0.2s;
          margin-left: 8px;
          flex-shrink: 0;
        }
        .chat-maximize-btn:hover {
          color: var(--text-1);
          border-color: var(--brand-from);
          background: rgba(99,102,241,0.1);
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .chat-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 60px 20px;
          gap: 12px;
          opacity: 0.6;
        }
        .chat-empty-icon {
          width: 60px; height: 60px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1));
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          color: var(--brand-from);
        }
        .chat-empty h3 { font-size: 16px; font-weight: 600; color: var(--text-1); }
        .chat-empty p { font-size: 13px; color: var(--text-3); max-width: 260px; }
      `}</style>
        </div>
    )
}
