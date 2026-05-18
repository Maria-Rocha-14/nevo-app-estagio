import type { AssessmentHistoryEntry } from '../db/db';

export type ClinicalRoutine = 'educative' | 'annual' | 'semestral';

export const calculateAge = (dob: string): number => {
    if (!dob) return 0;

    if (/^\d{4}$/.test(dob)) {
        return Math.max(0, new Date().getFullYear() - Number(dob));
    }

    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return 0;
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

export const calculateClinicalRoutine = (age: number, skinHistory: string): ClinicalRoutine => {
    // Risco Elevado (Histórico Pessoal/Familiar positivo)
    if (skinHistory === 'sim') {
        return 'semestral'; 
    }
    
    // Idade 35-75 (Introdução de triagem anual obrigatória)
    if (age >= 35 && age <= 75) {
        return 'annual'; 
    }
    
    // < 35 sem histórico (Foco em educação e literacia em saúde)
    return 'educative'; 
};

// Calculates the consecutive streak of monthly scans.
// Incorporates a "Grace Period": If the user hasn't scanned this month, but scanned last month, the streak is maintained.
export const calculateMonthStreak = (history: AssessmentHistoryEntry[]): number => {
    if (!history || history.length === 0) return 0;
    
    const monthsWithExams = new Set(
        history.map(entry => entry.createdAt.substring(0, 7))
    );

    let streak = 0;
    const now = new Date();
    
    const currentMonthStr = now.toISOString().substring(0, 7);
    
    const lastMonth = new Date(now);
    lastMonth.setMonth(now.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().substring(0, 7);

    // If no exam this month AND no exam last month, streak is dead.
    if (!monthsWithExams.has(currentMonthStr) && !monthsWithExams.has(lastMonthStr)) {
        return 0; 
    }

    let checkDate = new Date(now);
    // If they haven't done it this month yet (Grace period active), start counting from last month
    if (!monthsWithExams.has(currentMonthStr)) {
        checkDate = lastMonth;
    }

    while (true) {
        const checkMonthStr = checkDate.toISOString().substring(0, 7);
        if (monthsWithExams.has(checkMonthStr)) {
            streak++;
            checkDate.setMonth(checkDate.getMonth() - 1);
        } else {
            break; // Streak broken on this month
        }
    }

    return streak;
};

export const isScanDoneThisMonth = (history: AssessmentHistoryEntry[]): boolean => {
    if (!history || history.length === 0) return false;
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    return history.some(entry => entry.createdAt.substring(0, 7) === currentMonthStr);
};
