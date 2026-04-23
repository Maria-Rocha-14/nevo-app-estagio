import Dexie, { type EntityTable } from 'dexie';

export type ChallengeHistoryEntry = {
    challengeId: string;
    completedAt: string;
    pointsAwarded: number;
};
  
export type AssessmentHistoryEntry = {
    createdAt: string;
    fileName: string;
    imageUrl?: string;
    probability: number;
    riskLevel: 'low' | 'moderate' | 'high';
    simulated: boolean;
};

// Definimos a interface do Utilizador (o que guardamos)
interface User {
    id?: number;
    name: string;
    email: string;
    dob: string;      // Data de nascimento
    password: string;
    skinHistory: string;
    
    // Campos locais gerados pela aplicação e gamificação
    xp: number;
    points: number;
    weeksStreak: number;
    scansCount: number;
    lastMissionDate?: string;
    completedChallenges: string[];
    challengeHistory: ChallengeHistoryEntry[];
    assessmentHistory: AssessmentHistoryEntry[];
}

// Criamos a base de dados 'NevoDB'
const db = new Dexie('NevoDB') as Dexie & {
    users: EntityTable<User, 'id'>;
};

// Definimos o esquema (o email deve ser único para o login)
db.version(1).stores({
    users: '++id, &email' // ++id é auto-incremento, &email é único
});

export { db };
export type { User };