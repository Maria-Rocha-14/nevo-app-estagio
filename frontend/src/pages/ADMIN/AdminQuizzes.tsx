import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Edit3, Plus, Trash2, X, Inbox, BookOpenCheck, ExternalLink } from 'lucide-react';
import type { AdminQuizOption, AdminQuizType } from '../../db/db';
import FeedbackMessage from '../../components/FeedbackMessage';
import { isAdminLoggedIn } from '../../services/session';
import './AdminQuizzes.css';

const API_QUIZ_URL = '/api/admin/quizzes';

interface AdminContextType {
    autoOpenQuizModal: boolean;
    setAutoOpenQuizModal: (value: boolean) => void;
}

export default function AdminQuizzes() {
    const navigate = useNavigate();

    const context = useOutletContext<AdminContextType | null>();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        questionType: 'multiple_choice' as AdminQuizType,
        questionText: '',
        options: [
            { id: 'option-1', text: '', imageUrl: '' },
            { id: 'option-2', text: '', imageUrl: '' },
            { id: 'option-3', text: '', imageUrl: '' }
        ] as AdminQuizOption[],
        correctOptionId: 'option-1',
        xpValue: 10,
        medicalSourceUrl: ''
    });

    // Função para carregar dados do MongoDB
    const fetchQuizzes = async () => {
        try {
            const res = await fetch(API_QUIZ_URL);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setQuizzes(data);
        } catch {
            setFeedback({ tone: 'error', message: 'Erro ao carregar quizzes do servidor.' });
        } finally {
            setLoading(false);
        }
    };

    // Efeito para validar login e carregar os quizzes
    useEffect(() => {
        if (!isAdminLoggedIn()) {
            navigate('/');
        } else {
            fetchQuizzes();
        }
    }, [navigate]);

    useEffect(() => {
        if (context && context.autoOpenQuizModal) {
            handleOpenModal(); // Limpa o formulário e abre o modal
            context.setAutoOpenQuizModal(false); // Desliga a flag no pai para não repetir
        }
    }, [context]);

    const sortedQuizzes = useMemo(() => [...quizzes].reverse(), [quizzes]);

    const handleOpenModal = (quiz?: any) => {
        if (quiz && quiz._id) { // MongoDB usa _id
            setEditingId(quiz._id);
            setForm({
                questionType: quiz.questionType,
                questionText: quiz.questionText,
                options: quiz.options,
                correctOptionId: quiz.correctOptionId,
                xpValue: quiz.xpValue,
                medicalSourceUrl: quiz.medicalSourceUrl || ''
            });
        } else {
            setEditingId(null);
            setForm({
                questionType: 'multiple_choice',
                questionText: '',
                options: [
                    { id: 'option-1', text: '', imageUrl: '' },
                    { id: 'option-2', text: '', imageUrl: '' },
                    { id: 'option-3', text: '', imageUrl: '' }
                ],
                correctOptionId: 'option-1',
                xpValue: 10,
                medicalSourceUrl: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleTypeChange = (type: AdminQuizType) => {
        let newOptions: AdminQuizOption[] = [];
        let defaultCorrect = '';
        if (type === 'true_false') {
            newOptions = [{ id: 'true', text: 'Verdadeiro' }, { id: 'false', text: 'Falso' }];
            defaultCorrect = 'true';
        } else if (type === 'image_choice') {
            newOptions = [{ id: 'image-1', text: '', imageUrl: '' }, { id: 'image-2', text: '', imageUrl: '' }];
            defaultCorrect = 'image-1';
        } else {
            newOptions = [{ id: 'option-1', text: '', imageUrl: '' }, { id: 'option-2', text: '', imageUrl: '' }, { id: 'option-3', text: '', imageUrl: '' }];
            defaultCorrect = 'option-1';
        }
        setForm(f => ({ ...f, questionType: type, options: newOptions, correctOptionId: defaultCorrect }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.questionText.trim()) return setFeedback({ tone: 'warning', message: 'Falta o texto da pergunta.' });

        try {
            const method = editingId ? 'PUT' : 'POST';
            const url = editingId ? `${API_QUIZ_URL}/${editingId}` : API_QUIZ_URL;
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, updatedAt: new Date().toISOString() })
            });

            if (res.ok) {
                setFeedback({ tone: 'success', message: editingId ? 'Quiz atualizado!' : 'Quiz criado com sucesso!' });
                setIsModalOpen(false);
                fetchQuizzes(); // Refresh da lista após sucesso
            }
        } catch {
            setFeedback({ tone: 'error', message: 'Erro ao guardar no servidor.' });
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Eliminar este quiz permanentemente?')) {
            try {
                const res = await fetch(`${API_QUIZ_URL}/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    setFeedback({ tone: 'info', message: 'Quiz removido.' });
                    fetchQuizzes();
                }
            } catch {
                setFeedback({ tone: 'error', message: 'Erro ao eliminar.' });
            }
        }
    };

    return (
        <div className="admin-quizzes-wrapper">
            <main className="admin-page">
                <header className="admin-header-row">
                    <div className="header-titles">
                        <h1>Quizzes Educativos</h1>
                        <p>Gestão de conteúdos que aparecem na área Aprender.</p>
                    </div>
                    <button className="btn-create-new" onClick={() => handleOpenModal()}>
                        <Plus size={20} />
                        <span>Criar Novo Quiz</span>
                    </button>
                </header>

                {feedback && <FeedbackMessage tone={feedback.tone} message={feedback.message} onClose={() => setFeedback(null)} />}

                <section className="admin-panel">
                    <div className="admin-section-title">
                        <BookOpenCheck size={22} color="#5fa79a" />
                        <h2>Conteúdos Ativos</h2>
                    </div>

                    {loading ? (
                        <p className="text-center" style={{ padding: '20px' }}>A carregar conteúdos do servidor...</p>
                    ) : sortedQuizzes.length === 0 ? (
                        <div className="admin-empty-state-container">
                            <Inbox size={48} color="#cbd5e1" />
                            <p>Ainda não existem quizzes criados.</p>
                        </div>
                    ) : (
                        <div className="admin-table-wrap">
                            <table className="admin-custom-table">
                                <thead>
                                    <tr>
                                        <th>Pergunta</th>
                                        <th>Tipo</th>
                                        <th>XP</th>
                                        <th>Fonte</th>
                                        <th className="text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedQuizzes.map((quiz: any) => (
                                        <tr key={quiz._id}>
                                            <td className="td-main-text"><strong>{quiz.questionText}</strong></td>
                                            <td><span className={`badge-type-tag ${quiz.questionType}`}>{quiz.questionType.replace('_', ' ')}</span></td>
                                            <td><span className="xp-tag">{quiz.xpValue} XP</span></td>
                                            <td>
                                                {quiz.medicalSourceUrl && (
                                                    <a href={quiz.medicalSourceUrl} target="_blank" rel="noreferrer" className="source-link">
                                                        <ExternalLink size={14} /> Fonte
                                                    </a>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                <div className="admin-actions-cell">
                                                    <button className="action-btn edit" onClick={() => handleOpenModal(quiz)} title="Editar"><Edit3 size={16} /></button>
                                                    <button className="action-btn delete" onClick={() => handleDelete(quiz._id)} title="Apagar"><Trash2 size={16} /></button>
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
                            <div className="modal-header">
                                <div className="modal-titles">
                                    <h2>{editingId ? 'Editar Quiz' : 'Novo Quiz'}</h2>
                                    <p>Configura a pergunta e as opções de resposta.</p>
                                </div>
                                <button className="modal-close-x" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                            </div>

                            <form className="modal-form-body" onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <label>Tipo de Pergunta</label>
                                    <select className="input-field" value={form.questionType} onChange={e => handleTypeChange(e.target.value as AdminQuizType)}>
                                        <option value="multiple_choice">Múltipla Escolha</option>
                                        <option value="true_false">Verdadeiro/Falso</option>
                                        <option value="image_choice">Escolha por Imagens</option>
                                    </select>
                                </div>
                                <div className="form-row">
                                    <label>Texto da Pergunta</label>
                                    <textarea className="input-field textarea" value={form.questionText} onChange={e => setForm({ ...form, questionText: e.target.value })} placeholder="Escreva aqui a sua pergunta..." />
                                </div>
                                <div className="options-section">
                                    <p className="options-label">Opções (marque a correta)</p>
                                    {form.options.map((opt, idx) => (
                                        <div key={opt.id} className="option-input-group">
                                            <input type="radio" name="correct" checked={form.correctOptionId === opt.id} onChange={() => setForm({ ...form, correctOptionId: opt.id })} />
                                            <div className="option-fields-row">
                                                <input type="text" className="input-field small" value={opt.text} placeholder={form.questionType === 'true_false' ? opt.text : `Opção ${idx + 1}`} onChange={e => setForm(f => ({ ...f, options: f.options.map(o => o.id === opt.id ? { ...o, text: e.target.value } : o) }))} disabled={form.questionType === 'true_false'} />
                                                {form.questionType === 'image_choice' && (
                                                    <input type="url" className="input-field small" value={opt.imageUrl || ''} placeholder="URL da Imagem" onChange={e => setForm(f => ({ ...f, options: f.options.map(o => o.id === opt.id ? { ...o, imageUrl: e.target.value } : o) }))} />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="modal-footer-fields">
                                    <div className="form-row"><label>XP Atribuído</label><input type="number" className="input-field xp-input-small" value={form.xpValue} onChange={e => setForm({ ...form, xpValue: Number(e.target.value) })} /></div>
                                    <div className="form-row"><label>Link Médico (Fonte)</label><input type="url" className="input-field" value={form.medicalSourceUrl} onChange={e => setForm({ ...form, medicalSourceUrl: e.target.value })} placeholder="https://..." /></div>
                                </div>
                                <div className="modal-footer-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                    <button type="submit" className="btn-primary"><span>{editingId ? 'Guardar Alterações' : 'Criar Pergunta'}</span></button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}