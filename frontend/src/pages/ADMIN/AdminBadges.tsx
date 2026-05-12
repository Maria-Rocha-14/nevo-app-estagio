import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { Plus, Trash2, Award, X, Inbox, Edit3, AlertTriangle, HelpCircle } from 'lucide-react';
import FeedbackMessage from '../../components/FeedbackMessage';
import { isAdminLoggedIn } from '../../services/session';
import './AdminQuizzes.css';

const API_URL = 'http://localhost:5000/api/badges';

const AVAILABLE_ICONS = [
    { name: 'Trophy', label: 'Troféu' }, { name: 'Medal', label: 'Medalha' },
    { name: 'Award', label: 'Prémio' }, { name: 'Star', label: 'Estrela' },
    { name: 'Target', label: 'Alvo' }, { name: 'Zap', label: 'Energia' },
    { name: 'Heart', label: 'Saúde' }, { name: 'Shield', label: 'Proteção' },
    { name: 'Camera', label: 'Scan' }
];

const IconRenderer = ({ name, size = 20, color = 'currentColor' }: { name: string, size?: number, color?: string }) => {
    const IconComponent = (LucideIcons as any)[name];
    return IconComponent ? <IconComponent size={size} color={color} /> : <HelpCircle size={size} />;
};

export default function AdminBadges() {
    const navigate = useNavigate();
    const [badges, setBadges] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: '', description: '', iconType: 'Trophy',
        requirementType: 'points' as 'points' | 'scans' | 'streak',
        requirementValue: 0,
    });

    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    const fetchBadges = async () => {
        try {
            const res = await fetch(API_URL);
            const data = await res.json();
            setBadges(data);
        } catch {
            setFeedback({ tone: 'error', message: 'Erro ao carregar badges.' });
        }
    };

    useEffect(() => {
        if (!isAdminLoggedIn()) navigate('/');
        else fetchBadges();
    }, [navigate]);

    const handleOpenModal = (badge?: any) => {
        if (badge && badge._id) {
            setEditingId(badge._id);
            setForm({ ...badge });
        } else {
            setEditingId(null);
            setForm({ name: '', description: '', iconType: 'Trophy', requirementType: 'points', requirementValue: 0 });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = editingId ? 'PUT' : 'POST';
            const url = editingId ? `${API_URL}/${editingId}` : API_URL;
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                fetchBadges();
                setIsModalOpen(false);
                setFeedback({ tone: 'success', message: editingId ? 'Alterações guardadas!' : 'Badge criado!' });
            }
        } catch {
            setFeedback({ tone: 'error', message: 'Erro ao guardar.' });
        }
    };

    const confirmDelete = (id: string) => { setIdToDelete(id); setIsDeleteModalOpen(true); };

    const handleExecuteDelete = async () => {
        if (!idToDelete) return;
        try {
            const res = await fetch(`${API_URL}/${idToDelete}`, { method: 'DELETE' });
            if (res.ok) {
                setBadges(badges.filter(b => b._id !== idToDelete));
                setFeedback({ tone: 'success', message: 'Badge removido.' });
            }
        } catch {
            setFeedback({ tone: 'error', message: 'Erro ao eliminar.' });
        } finally {
            setIsDeleteModalOpen(false);
            setIdToDelete(null);
        }
    };

    return (
        <div className="admin-quizzes-wrapper">
            <main className="admin-page">
                <header className="admin-header-row">
                    <div className="header-titles">
                        <h1>Gestão de Conquistas</h1>
                        <p>Configura as metas e medalhas.</p>
                    </div>
                    <button className="btn-create-new" onClick={() => handleOpenModal()}><Plus size={20} /><span>Criar Novo Badge</span></button>
                </header>
                {feedback && <FeedbackMessage tone={feedback.tone} message={feedback.message} onClose={() => setFeedback(null)} />}
                <section className="admin-panel">
                    <div className="admin-section-title"><Award size={22} color="#5fa79a" /><h2>Badges Ativos</h2></div>
                    {badges.length === 0 ? (
                        <div className="admin-empty-state-container"><Inbox size={48} color="#cbd5e1" /><p>Sem badges configurados.</p></div>
                    ) : (
                        <div className="admin-table-wrap">
                            <table className="admin-custom-table">
                                <thead><tr><th>Badge</th><th>Descrição</th><th>Tipo</th><th>Meta</th><th className="text-right">Ações</th></tr></thead>
                                <tbody>
                                    {badges.map(badge => (
                                        <tr key={badge._id}>
                                            <td className="td-badge-name">
                                                <div className="mini-badge-icon"><IconRenderer name={badge.iconType || 'Trophy'} size={18} color="#f1c40f" /></div>
                                                <strong>{badge.name}</strong>
                                            </td>
                                            <td className="td-desc">{badge.description}</td>
                                            <td><span className={`badge-type-tag ${badge.requirementType}`}>{badge.requirementType}</span></td>
                                            <td><strong>{badge.requirementValue}</strong></td>
                                            <td className="text-right">
                                                <div className="admin-actions-cell">
                                                    <button className="action-btn edit" onClick={() => handleOpenModal(badge)}><Edit3 size={16} /></button>
                                                    <button className="action-btn delete" onClick={() => confirmDelete(badge._id)}><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
                {isModalOpen && (
                    <div className="admin-modal-overlay">
                        <div className="admin-modal-content">
                            <div className="modal-header"><h2>{editingId ? 'Editar' : 'Novo'} Badge</h2><button className="modal-close-x" onClick={() => setIsModalOpen(false)}><X size={20} /></button></div>
                            <form className="modal-form-body" onSubmit={handleSubmit}>
                                <div className="form-row"><label>Nome</label><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                                <div className="form-row"><label>Descrição</label><textarea className="input-field textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></div>
                                <div className="form-row"><label>Ícone</label>
                                    <div className="icon-selector-grid">
                                        {AVAILABLE_ICONS.map((icon) => (
                                            <button key={icon.name} type="button" className={`icon-option ${form.iconType === icon.name ? 'selected' : ''}`} onClick={() => setForm({ ...form, iconType: icon.name })}><IconRenderer name={icon.name} size={22} /></button>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-row-group">
                                    <div className="form-row"><label>Tipo</label><select className="input-field" value={form.requirementType} onChange={e => setForm({ ...form, requirementType: e.target.value as any })}><option value="points">XP</option><option value="scans">Scans</option></select></div>
                                    <div className="form-row"><label>Meta</label><input type="number" className="input-field" value={form.requirementValue} onChange={e => setForm({ ...form, requirementValue: Number(e.target.value) })} required /></div>
                                </div>
                                <div className="modal-footer-actions"><button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button><button type="submit" className="btn-primary">{editingId ? 'Atualizar' : 'Criar'}</button></div>
                            </form>
                        </div>
                    </div>
                )}
                {isDeleteModalOpen && (
                    <div className="admin-modal-overlay">
                        <div className="admin-modal-content confirm-dialog">
                            <div className="confirm-icon"><AlertTriangle size={40} color="#ef4444" /></div>
                            <h3>Eliminar badge?</h3>
                            <div className="modal-footer-actions"><button className="btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button><button className="btn-danger-confirm" onClick={handleExecuteDelete}>Sim, Eliminar</button></div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}