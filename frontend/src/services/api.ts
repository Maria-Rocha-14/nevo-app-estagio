const API_BASE_URL = 'http://127.0.0.1:5000/api';

export const api = {
    // Auth & Users
    registerExternal: (data: any) =>
        fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),

    // ADMIN: Quizzes
    getQuizzes: () => fetch(`${API_BASE_URL}/admin/quizzes`).then(res => res.json()),
    saveQuiz: (quiz: any) =>
        fetch(`${API_BASE_URL}/admin/quizzes`, {
            method: quiz.id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(quiz)
        }),
    deleteQuiz: (id: number) =>
        fetch(`${API_BASE_URL}/admin/quizzes/${id}`, { method: 'DELETE' }),

    // ADMIN: Users
    getExternalUsers: () => fetch(`${API_BASE_URL}/admin/users`).then(res => res.json()),
    toggleUserStatus: (userId: string, status: string) =>
        fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        })
};