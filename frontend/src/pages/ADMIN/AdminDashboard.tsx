import { useState } from 'react';
import {
    Users, BookOpen, Medal,
    BarChart3, Plus, LogOut, ChevronRight, Menu,
    Settings2
} from 'lucide-react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import './AdminDashboard.css';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const isHome = location.pathname === '/admin' || location.pathname === '/admin/';

    return (
        <div className={`admin-layout ${isCollapsed ? 'collapsed' : ''}`}>
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <button className="menu-toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
                        <Menu size={22} color="#5fa79a" />
                    </button>
                    {!isCollapsed && (
                        <div className="admin-brand">
                            <p className="admin-kicker">Área Reservada</p>
                            <h1>Admin<span>Panel</span></h1>
                        </div>
                    )}
                </div>

                <nav className="sidebar-nav">
                    <button className={`nav-item ${isHome ? 'active' : ''}`} onClick={() => navigate('/admin')}>
                        <BarChart3 size={22} />
                        {!isCollapsed && <span>Vista Global</span>}
                    </button>
                    <button className={`nav-item ${location.pathname.includes('users') ? 'active' : ''}`} onClick={() => navigate('/admin/users')}>
                        <Users size={22} />
                        {!isCollapsed && <span>Utilizadores</span>}
                    </button>
                    <button className={`nav-item ${location.pathname.includes('quizzes') ? 'active' : ''}`} onClick={() => navigate('/admin/quizzes')}>
                        <BookOpen size={22} />
                        {!isCollapsed && <span>Quizzes</span>}
                    </button>
                    <button className={`nav-item ${location.pathname.includes('badges') ? 'active' : ''}`} onClick={() => navigate('/admin/badges')}>
                        <Medal size={22} />
                        {!isCollapsed && <span>Badges</span>}
                    </button>
                        <button
                            className={`nav-item ${location.pathname.includes('settings') ? 'active' : ''}`}
                            onClick={() => navigate('/admin/settings')}
                        >
                            <Settings2 size={22} />
                            {!isCollapsed && <span>Configurações</span>}
                        </button>
                </nav>

                <div className="sidebar-footer">
                    <button className="nav-item logout" onClick={() => navigate('/')}>
                        <LogOut size={22} />
                        {!isCollapsed && <span>Terminar Sessão</span>}
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                {isHome ? (
                    <div className="global-view">
                        <header className="main-header">
                            <h1>Painel de Administração</h1>
                            <p>Bem-vindo, Admin. Escolha uma área para gerir a plataforma.</p>
                        </header>

                        <div className="stats-highlight-card">
                            <div className="stats-icon-box">
                                <BarChart3 size={24} color="#fff" />
                            </div>
                            <div className="stats-info">
                                <h3>Vista Global</h3>
                                <p>O sistema está a funcionar corretamente.</p>
                            </div>
                        </div>

                        <div className="admin-separator">
                            <span>Ações Rápidas</span>
                        </div>

                        <div className="quick-actions-grid">
                            <div className="action-card-row" onClick={() => navigate('/admin/quizzes')}>
                                <div className="action-icon-circle" style={{ backgroundColor: '#60a5fa' }}>
                                    <Plus size={24} />
                                </div>
                                <div className="action-content">
                                    <h3>Novo Quizz</h3>
                                    <p>Editar perguntas do "Aprender"</p>
                                </div>
                                <ChevronRight size={20} className="arrow-icon" />
                            </div>

                            <div className="action-card-row" onClick={() => navigate('/admin/badges')}>
                                <div className="action-icon-circle" style={{ backgroundColor: '#facc15' }}>
                                    <Plus size={24} />
                                </div>
                                <div className="action-content">
                                    <h3>Novo Badge</h3>
                                    <p>Criar e editar conquistas</p>
                                </div>
                                <ChevronRight size={20} className="arrow-icon" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <Outlet />
                )}
            </main>
        </div>
    );
}