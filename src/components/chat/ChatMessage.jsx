import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Bot, User } from 'lucide-react'

export default function ChatMessage({ message, isStreaming, streamingText }) {
    const isAssistant = message.role === 'assistant'
    const displayText = isStreaming && isAssistant ? streamingText : message.content

    return (
        <div className={`chat-msg ${isAssistant ? 'chat-msg--ai' : 'chat-msg--user'}`}>
            <div className="chat-msg-avatar">
                {isAssistant
                    ? <div className="avatar-ai"><Bot size={14} /></div>
                    : <div className="avatar-user"><User size={14} /></div>
                }
            </div>
            <div className="chat-msg-body">
                {isAssistant ? (
                    <div className="chat-msg-bubble chat-msg-bubble--ai">
                        <div className="prose">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                                {displayText || ''}
                            </ReactMarkdown>
                            {isStreaming && <span className="cursor-blink" />}
                        </div>
                    </div>
                ) : (
                    <div className="chat-msg-bubble chat-msg-bubble--user">
                        {message.attachments?.length > 0 && (
                            <div className="chat-attachments">
                                {message.attachments.map((a, i) => (
                                    <span key={i} className="chat-attachment-tag">
                                        📎 {a.name || a.type}
                                    </span>
                                ))}
                            </div>
                        )}
                        <p>{displayText}</p>
                    </div>
                )}
                <p className="chat-msg-time">
                    {new Date(message.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>

            <style>{`
        .chat-msg {
          display: flex;
          gap: 10px;
          animation: fadeIn 0.25s ease both;
          max-width: 85%;
        }
        .chat-msg--user { flex-direction: row-reverse; align-self: flex-end; }
        .chat-msg--ai { align-self: flex-start; }
        .chat-msg-avatar { flex-shrink: 0; }
        .avatar-ai {
          width: 30px; height: 30px;
          background: linear-gradient(135deg, var(--brand-from), var(--brand-to));
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
        }
        .avatar-user {
          width: 30px; height: 30px;
          background: var(--glass);
          border: 1px solid var(--glass-border);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-2);
        }
        .chat-msg-body { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .chat-msg--user .chat-msg-body { align-items: flex-end; }
        .chat-msg-bubble { padding: 12px 16px; border-radius: 14px; max-width: 100%; }
        .chat-msg-bubble--ai {
          background: var(--glass);
          border: 1px solid var(--glass-border);
          border-top-left-radius: 4px;
        }
        .chat-msg-bubble--user {
          background: linear-gradient(135deg, var(--brand-from), var(--brand-to));
          color: #fff;
          border-top-right-radius: 4px;
        }
        .chat-msg-bubble--user .prose { color: rgba(255,255,255,0.95); }
        .chat-msg-time { font-size: 10px; color: var(--text-3); margin-top: 2px; }
        .chat-attachments { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
        .chat-attachment-tag {
          background: rgba(255,255,255,0.15);
          border-radius: 4px;
          padding: 2px 8px;
          font-size: 11px;
        }
      `}</style>
        </div>
    )
}
