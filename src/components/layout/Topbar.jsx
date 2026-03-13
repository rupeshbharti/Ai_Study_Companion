import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search, Plus, ArrowLeft, Sun, Moon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const PAGE_TITLES = {
    '/': 'Dashboard',
    '/subjects': 'My Subjects',
    '/chat': 'AI Chat',
    '/library': 'Study Library',
    '/insights': 'Insights',
    '/profile': 'My Profile',
}

export default function Topbar({ onAddSubject }) {
    const { pathname } = useLocation()
    const navigate = useNavigate()
    const { profile } = useAuth()
    const { theme, toggleTheme } = useTheme()

    const isSubjectDetail = pathname.startsWith('/subjects/')
    const title = isSubjectDetail ? 'Subject Details' : (PAGE_TITLES[pathname] || 'StudyAI')

    const initials = profile?.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : '?'

    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

    return (
        <header className="topbar">
            <div className="topbar-left">
                {isSubjectDetail ? (
                    <button className="topbar-back" onClick={() => navigate('/subjects')}>
                        <ArrowLeft size={18} />
                        <span>Subjects</span>
                    </button>
                ) : (
                    <div className="topbar-title-wrap">
                        <h2 className="topbar-title">{title}</h2>
                        {pathname === '/' && (
                            <p className="topbar-greeting">
                                {greeting}, {profile?.full_name?.split(' ')[0] || 'Student'} 👋
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="topbar-right">
                {pathname === '/subjects' && (
                    <button className="btn btn-primary btn-sm" onClick={onAddSubject}>
                        <Plus size={14} /> Add Subject
                    </button>
                )}
                <button className="topbar-icon-btn" onClick={toggleTheme} title="Toggle theme">
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button className="topbar-icon-btn" title="Notifications">
                    <Bell size={18} />
                </button>
                <div className="topbar-avatar" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="topbar-avatar-img" />
                    ) : initials}
                </div>
            </div>

            <style>{`
        .topbar {
          position: fixed;
          top: 0;
          left: var(--sidebar-w);
          right: 0;
          height: var(--topbar-h);
          background: var(--bg-translucent);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--glass-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          z-index: 50;
        }
        .topbar-left { display: flex; align-items: center; gap: 12px; }
        .topbar-title { font-size: 18px; font-weight: 700; color: var(--text-1); line-height: 1.2; }
        .topbar-greeting { font-size: 12px; color: var(--text-3); margin-top: 1px; }
        .topbar-back {
          display: flex; align-items: center; gap: 6px;
          color: var(--text-2); font-size: 14px; font-weight: 500;
          padding: 6px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--glass);
          border: 1px solid var(--glass-border);
        }
        .topbar-back:hover { color: var(--text-1); border-color: var(--glass-border-hover); }
        .topbar-right { display: flex; align-items: center; gap: 10px; }
        .topbar-icon-btn {
          width: 36px; height: 36px;
          border-radius: 9px;
          background: var(--glass);
          border: 1px solid var(--glass-border);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-2);
          cursor: pointer;
          transition: all 0.2s;
        }
        .topbar-icon-btn:hover { color: var(--text-1); border-color: var(--glass-border-hover); }
        .topbar-avatar {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, var(--brand-from), var(--brand-to));
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: #fff;
          cursor: pointer;
          overflow: hidden;
        }
        .topbar-avatar-img {
          width: 100%; height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
        @media (max-width: 768px) {
          .topbar { left: 0; padding: 0 16px; }
        }
      `}</style>
        </header>
    )
}
