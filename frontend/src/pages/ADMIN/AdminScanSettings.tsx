import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Clock, Settings2, ShieldAlert, Inbox } from 'lucide-react';
import FeedbackMessage from '../../components/FeedbackMessage';
import { isAdminLoggedIn } from '../../services/session'; // Importado para segurança
import './AdminQuizzes.css';

const API_URL = 'http://localhost:5000/api/scan-settings';

export default function AdminScanSettings() {
    const navigate = useNavigate();
    const [settings, setSettings] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

    // Auto-ocultar feedback
    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    const fetchSettings = async () => {
        try {
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setSettings(data);
        } catch (err) {
            setFeedback({ tone: 'error', message: 'Erro ao carregar configurações.' });
        }
    };

    useEffect(() => {
        // Verifica se o admin está logado antes de carregar os dados
        if (!isAdminLoggedIn()) {
            navigate('/');
        } else {
            fetchSettings();
        }
    }, [navigate]);

    const handleAddRow = async () => {
        const newRule = { minAge: 18, maxAge: 30, intervalWeeksDefault: 4, intervalWeeksHighRisk: 2 };
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRule)
            });
            if (res.ok) {
                fetchSettings();
                setFeedback({ tone: 'success', message: 'Nova regra adicionada com sucesso.' });
            }
        } catch (err) {
            setFeedback({ tone: 'error', message: 'Erro ao comunicar com o servidor.' });
        }
    };

    const handleUpdate = async (id: string, field: string, value: number) => {
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });

            if (res.ok) {
                setSettings(settings.map(s => s._id === id ? { ...s, [field]: value } : s));
            } else {
                setFeedback({ tone: 'error', message: 'Erro ao guardar no servidor.' });
            }
        } catch (err) {
            setFeedback({ tone: 'error', message: 'Erro ao atualizar regra.' });
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Eliminar esta configuração permanentemente?')) {
            try {
                const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    setSettings(settings.filter(s => s._id !== id));
                    setFeedback({ tone: 'success', message: 'Regra removida com sucesso.' });
                }
            } catch (err) {
                setFeedback({ tone: 'error', message: 'Erro ao eliminar regra.' });
            }
        }
    };

    return (
        <div className="admin-quizzes-wrapper">
            <main className="admin-page">
                <header className="admin-header-row">
                    <div className="header-titles">
                        <h1>Frequência de Scans</h1>
                        <p>Configuração de intervalos base e de risco por faixa etária.</p>
                    </div>
                    <button className="btn-create-new" onClick={handleAddRow}>
                        <Plus size={20} /> <span>Nova Regra</span>
                    </button>
                </header>

                {feedback && (
                    <FeedbackMessage
                        tone={feedback.tone}
                        message={feedback.message}
                        onClose={() => setFeedback(null)}
                    />
                )}

                <section className="admin-panel">
                    <div className="admin-section-title">
                        <Settings2 size={22} color="#5fa79a" />
                        <h2>Matriz de Prevenção</h2>
                    </div>

                    {settings.length === 0 ? (
                        <div className="admin-empty-state-container">
                            <Inbox size={48} color="#cbd5e1" />
                            <p>Ainda não existem regras configuradas.</p>
                        </div>
                    ) : (
                        <div className="admin-table-wrap">
                            <table className="admin-custom-table">
                                <thead>
                                    <tr>
                                        <th>Idade Mín.</th>
                                        <th>Idade Máx.</th>
                                        <th>Intervalo Base (Sem.)</th>
                                        <th><ShieldAlert size={14} style={{ display: 'inline', marginRight: '4px' }} />Alto Risco (Sem.)</th>
                                        <th className="text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {settings.map((rule: any) => (
                                        <tr key={rule._id}>
                                            <td>
                                                <input
                                                    type="number" className="input-field small"
                                                    value={rule.minAge}
                                                    onChange={(e) => handleUpdate(rule._id, 'minAge', Number(e.target.value))}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number" className="input-field small"
                                                    value={rule.maxAge}
                                                    onChange={(e) => handleUpdate(rule._id, 'maxAge', Number(e.target.value))}
                                                />
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Clock size={16} color="#94a3b8" />
                                                    <input
                                                        type="number" className="input-field small"
                                                        value={rule.intervalWeeksDefault}
                                                        onChange={(e) => handleUpdate(rule._id, 'intervalWeeksDefault', Number(e.target.value))}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <input
                                                    type="number" className="input-field small"
                                                    style={{ borderColor: '#ff7675', color: '#ef4444' }}
                                                    value={rule.intervalWeeksHighRisk}
                                                    onChange={(e) => handleUpdate(rule._id, 'intervalWeeksHighRisk', Number(e.target.value))}
                                                />
                                            </td>
                                            <td className="text-center">
                                                <div className="admin-actions-cell">
                                                    <button className="action-btn delete" onClick={() => handleDelete(rule._id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}   