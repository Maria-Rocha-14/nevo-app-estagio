import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, History, Users, UserX, UserCheck } from 'lucide-react';
import FeedbackMessage from '../../components/FeedbackMessage';
import { isAdminLoggedIn } from '../../services/session';
import './AdminQuizzes.css';
import './AdminUsers.css';

type FeedbackState = { tone: 'success' | 'error' | 'warning' | 'info'; message: string };

const calculateAge = (dob?: string) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
};

export default function AdminUsers() {
    const navigate = useNavigate();
    const [feedback, setFeedback] = useState<FeedbackState | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/users');
            if (!response.ok) throw new Error('Erro ao carregar utilizadores externos');
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setFeedback({ tone: 'error', message: 'Falha na ligação com a base de dados externa.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAdminLoggedIn()) {
            navigate('/');
        } else {
            fetchUsers();
        }
    }, [navigate]);

    const activeCount = users.filter((u) => u.accountStatus === 'active').length;

    const handleToggleStatus = async (user: any) => {
        const nextStatus = user.accountStatus === 'active' ? 'suspended' : 'active';
        try {
            const response = await fetch(`/api/admin/users/${user._id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus })
            });

            if (!response.ok) throw new Error();

            setFeedback({
                tone: 'success',
                message: `Utilizador ${nextStatus === 'suspended' ? 'suspenso' : 'reativado'} no servidor externo.`
            });
            fetchUsers(); // Refresh da lista
        } catch {
            setFeedback({ tone: 'error', message: 'Erro ao atualizar estado no servidor.' });
        }
    };

    return (
        <div className="admin-quizzes-wrapper">
            <main className="admin-page">
                <header className="admin-header-row">
                    <div className="header-titles">
                        <h1>Gestão de Utilizadores</h1>
                        <p>Controlo centralizado de acessos no servidor externo.</p>
                    </div>
                </header>

                {feedback && <FeedbackMessage tone={feedback.tone} message={feedback.message} onClose={() => setFeedback(null)} />}

                <section className="admin-panel">
                    <div className="admin-section-title">
                        <Users size={22} color="#5fa79a" />
                        <h2>Utilizadores Registados</h2>
                    </div>

                    <div className="admin-user-stats" style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                        <div className="badge-type-tag points" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ShieldCheck size={14} /> {activeCount} Ativos
                        </div>
                        <div className="badge-type-tag true_false" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fef2f2', color: '#ef4444' }}>
                            <ShieldAlert size={14} /> {users.length - activeCount} Suspensos
                        </div>
                    </div>

                    <div className="admin-table-wrap">
                        <table className="admin-custom-table">
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Idade</th>
                                    <th>Histórico (Estatística)</th>
                                    <th>Estado</th>
                                    <th className="text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center">A carregar dados do MongoDB...</td></tr>
                                ) : users.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center">Nenhum utilizador encontrado no servidor.</td></tr>
                                ) : (
                                    users.map((user) => {
                                        const isSuspended = user.accountStatus === 'suspended';
                                        return (
                                            <tr key={user._id}>
                                                <td style={{ fontWeight: 600 }}>{user.email}</td>
                                                <td>{calculateAge(user.dob)} anos</td>
                                                <td>
                                                    <span className="scan-count-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
                                                        <History size={14} /> {user.xp || 0} XP acumulado
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge-type-tag ${isSuspended ? 'scans' : 'points'}`} style={isSuspended ? { background: '#fef2f2', color: '#ef4444' } : {}}>
                                                        {isSuspended ? 'Suspenso' : 'Ativo'}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <div className="admin-actions-cell">
                                                        <button
                                                            className={`action-btn ${isSuspended ? 'edit' : 'delete'}`}
                                                            onClick={() => handleToggleStatus(user)}
                                                            title={isSuspended ? "Reativar" : "Suspender"}
                                                        >
                                                            {isSuspended ? <UserCheck size={18} /> : <UserX size={18} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}