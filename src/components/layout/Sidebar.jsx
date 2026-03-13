import { NavLink, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, BookOpen, MessageSquare, Library,
    BarChart3, LogOut, Sparkles, ChevronRight, GraduationCap, UserCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/subjects', icon: BookOpen, label: 'Subjects' },
    { to: '/chat', icon: MessageSquare, label: 'AI Chat' },
    { to: '/library', icon: Library, label: 'Library' },
    { to: '/insights', icon: BarChart3, label: 'Insights' },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
]

const LEVEL_LABELS = {
    high_school: 'High School',
    intermediate: 'Intermediate',
    under_graduation: 'Under Grad',
}

export default function Sidebar() {
    const { profile, signOut } = useAuth()
    const navigate = useNavigate()

    async function handleSignOut() {
        await signOut()
        navigate('/login')
    }

    const initials = profile?.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : '?'

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon"><Sparkles size={20} /></div>
                <span className="sidebar-logo-text">StudyAI</span>
            </div>

            {/* Nav */}
            <nav className="sidebar-nav">
                <p className="sidebar-section-label">Navigation</p>
                {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                    >
                        <Icon size={18} />
                        <span>{label}</span>
                        <ChevronRight size={14} className="sidebar-arrow" />
                    </NavLink>
                ))}
            </nav>

            {/* Bottom */}
            <div className="sidebar-bottom">
                {/* Profile */}
                <div className="sidebar-profile" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
                    <div className="sidebar-avatar">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="sidebar-avatar-img" />
                        ) : initials}
                    </div>
                    <div className="sidebar-profile-info">
                        <p className="sidebar-profile-name">{profile?.full_name || 'Student'}</p>
                        <p className="sidebar-profile-level">
                            <GraduationCap size={11} />
                            {LEVEL_LABELS[profile?.education_level] || 'Not set'}
                        </p>
                    </div>
                </div>
                <button className="sidebar-signout" onClick={handleSignOut}>
                    <LogOut size={15} />
                    <span>Sign out</span>
                </button>
            </div>

            <style>{`
        .sidebar {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          width: var(--sidebar-w);
          background: var(--bg-2);
          border-right: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          z-index: 100;
          overflow: hidden;
        }
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 20px 20px 16px;
          border-bottom: 1px solid var(--glass-border);
        }
        .sidebar-logo-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, var(--brand-from), var(--brand-to));
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }
        .sidebar-logo-text {
          font-size: 18px;
          font-weight: 800;
          background: linear-gradient(135deg, var(--brand-from), var(--brand-to));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .sidebar-nav {
          flex: 1;
          padding: 16px 12px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sidebar-section-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-3);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0 8px;
          margin-bottom: 6px;
        }
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          color: var(--text-2);
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          position: relative;
          text-decoration: none;
        }
        .sidebar-item:hover {
          background: var(--glass);
          color: var(--text-1);
        }
        .sidebar-item.active {
          background: linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12));
          color: var(--text-1);
          border: 1px solid rgba(99,102,241,0.25);
        }
        .sidebar-item.active svg:first-child { color: var(--brand-from); }
        .sidebar-arrow {
          margin-left: auto;
          opacity: 0;
          transition: opacity 0.2s, transform 0.2s;
        }
        .sidebar-item:hover .sidebar-arrow,
        .sidebar-item.active .sidebar-arrow { opacity: 1; transform: translateX(2px); }
        .sidebar-bottom {
          padding: 12px;
          border-top: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sidebar-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border-radius: 10px;
          background: var(--glass);
          border: 1px solid var(--glass-border);
        }
        .sidebar-avatar {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, var(--brand-from), var(--brand-to));
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
          overflow: hidden;
        }
        .sidebar-avatar-img {
          width: 100%; height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
        .sidebar-profile-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-1);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }
        .sidebar-profile-level {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--text-3);
          margin-top: 1px;
        }
        .sidebar-signout {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 9px 12px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-3);
          transition: all 0.2s;
          background: none;
          border: none;
          cursor: pointer;
        }
        .sidebar-signout:hover {
          background: rgba(239,68,68,0.1);
          color: var(--error);
        }
      `}</style>
        </aside>
    )
}
