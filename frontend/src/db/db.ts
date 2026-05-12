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

export type adminBadges = '++id, name, type'

export interface AdminBadge {
    id?: number;
    name: string;
    description: string;
    iconType: string;
    requirementType: 'points' | 'scans' | 'streak';
    requirementValue: number;
    createdAt: string;
}
export type AdminQuizType = 'multiple_choice' | 'true_false' | 'image_choice';

export type AdminQuizOption = {
    id: string;
    text: string;
    imageUrl?: string;
};

export type AdminQuiz = {
    id?: number;
    questionType: AdminQuizType;
    questionText: string;
    options: AdminQuizOption[];
    correctOptionId: string;
    xpValue: number;
    medicalSourceUrl: string;
    createdAt: string;
    updatedAt: string;
};
export type ScanSettingType = '++id, minAge, maxAge, intervalWeeksDefault, intervalWeeksHighRisk'

export interface ScanSetting {
    id?: number;
    minAge: number;
    maxAge: number;
    intervalWeeksDefault: number;
    intervalWeeksHighRisk: number; // Nova coluna para casos de risco
}

export class MyDatabase extends Dexie {
    users!: EntityTable<User, 'id'>;
    adminQuizzes!: EntityTable<AdminQuiz, 'id'>;
    adminBadges!: EntityTable<AdminBadge, 'id'>;
    scanSettings!: EntityTable<ScanSetting, 'id'>;

    constructor() {
        super('NevoDB');
        this.version(1).stores({
            users: '++id, email',
            adminQuizzes: '++id, questionType',
            adminBadges: '++id, name',
            scanSettings: '++id, minAge, maxAge, intervalWeeksDefault, intervalWeeksHighRisk'
        });
    }
}

export type AvatarColorId = 'green' | 'blue' | 'yellow' | 'red';
export type AvatarOutfitId = 'none' | 'simpleTee' | 'sweatshirt' | 'coat';
export type AvatarShoeId = 'none';
export type AvatarAccessoryId = 'none' | 'glasses' | 'stethoscope';
export type AvatarSpecialId = 'none' | 'football' | 'programmer' | 'doctor' | 'tennis';

export type UserAvatar = {
    name?: string;
    colorId: AvatarColorId;
    outfitId: AvatarOutfitId;
    shoeId: AvatarShoeId;
    accessoryId: AvatarAccessoryId;
    specialId: AvatarSpecialId;
};

export type AccountStatus = 'active' | 'suspended';

// Definimos a interface do Utilizador (o que guardamos)
interface User {
    id?: number;
    name: string;
    email: string;
    dob: string;      // Data de nascimento
    password: string;
    skinHistory: string;
    createdAt: string;
    accountStatus: AccountStatus;
    
    // Campos locais gerados pela aplicação e gamificação
    xp: number;
    points: number;
    weeksStreak: number;
    scansCount: number;
    earnedBadges: number[]; // Lista de IDs de badges ganhos
    lastMissionDate?: string;
    avatar?: UserAvatar;
    completedChallenges: string[];
    challengeHistory: ChallengeHistoryEntry[];
    assessmentHistory: AssessmentHistoryEntry[];
}

// Criamos a base de dados 'NevoDB'
const db = new Dexie('NevoDB') as Dexie & {
    users: EntityTable<User, 'id'>;
    adminQuizzes: EntityTable<AdminQuiz, 'id'>;
    adminBadges: EntityTable<AdminBadge, 'id'>;
    scanSettings: EntityTable<ScanSetting, 'id'>;
};

// Definimos o esquema (o email deve ser único para o login)
db.version(1).stores({
    users: '++id, &email' // ++id é auto-incremento, &email é único
});

db.version(2).stores({
    users: '++id, &email',
    adminQuizzes: '++id, questionType, createdAt'
});

db.version(3).stores({
    users: '++id, &email, createdAt, accountStatus',
    adminQuizzes: '++id, questionType, createdAt'
}).upgrade(async (tx) => {
    const usersTable = tx.table<User, number>('users');
    await usersTable.toCollection().modify((user) => {
        user.createdAt = user.createdAt || new Date().toISOString();
        user.accountStatus = user.accountStatus || 'active';
    });
});

db.version(4).stores({
    users: '++id, &email, createdAt, accountStatus, role',
    adminQuizzes: '++id, questionType, createdAt',
    adminBadges: '++id, name, requirementType' 
});

db.version(5).stores({
    users: '++id, &email, createdAt, accountStatus, role',
    adminQuizzes: '++id, questionType, createdAt',
    adminBadges: '++id, name, requirementType',
    scanSettings: '++id, minAge, maxAge, intervalWeeksDefault, intervalWeeksHighRisk'
});

export { db };
export type { User };
