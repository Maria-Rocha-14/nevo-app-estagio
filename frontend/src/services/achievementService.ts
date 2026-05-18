import { db } from '../db/db';
import { api } from './api';

export type RequirementType = 'points' | 'scans' | 'streak';

export const achievementService = {
    /**
     * Valida se alcançou novos badges e sincroniza com Local (Dexie) e Nuvem (MongoDB).
     * Retorna true se um novo badge foi adicionado nesta validação.
     */
    checkBadgeProgress: async (sessionUser: any, type: RequirementType, currentProgressValue: number): Promise<boolean> => {
        if (!sessionUser || !sessionUser.id) return false;

        try {
            // 1. Obter todos os badges configurados pelo Admin no MongoDB
            const remoteBadges = await api.getBadges();
            if (!remoteBadges || remoteBadges.length === 0) return false;

            // Forçar todos os IDs já ganhos a serem Strings puras
            const earnedBadgesIds = (sessionUser.earnedBadges || []).map((id: any) => String(id));

            // 2. Filtrar apenas os que pertencem ao tipo atual e que o utilizador AINDA NÃO GANHOU
            const potentialBadges = remoteBadges.filter((badge: any) => {
                const badgeId = String(badge.id || badge._id);
                const matchesType = badge.requirementType === type;
                const notEarnedYet = !earnedBadgesIds.includes(badgeId);
                return matchesType && notEarnedYet;
            });

            let newBadgesEarned: string[] = [];

            // 3. Avaliar se o progresso local bateu a meta estipulada pelo admin
            for (const badge of potentialBadges) {
                if (currentProgressValue >= badge.requirementValue) {
                    const badgeId = String(badge.id || badge._id);
                    newBadgesEarned.push(badgeId);
                }
            }

            // 4. Se houver conquistas novas, guarda em ambas as bases de dados
            if (newBadgesEarned.length > 0) {
                const updatedEarnedList = [...earnedBadgesIds, ...newBadgesEarned];

                // A) Grava localmente no Dexie com o tipo correto para acesso imediato
                await db.users.update(sessionUser.id, {
                    earnedBadges: updatedEarnedList
                });

                // B) Grava remotamente no MongoDB para o Administrador ver e dar persistência na conta
                await api.updateUserBadges(sessionUser.id, updatedEarnedList);

                console.log(`🎉 [Gamificação] Novos badges conquistados e enviados para o MongoDB:`, newBadgesEarned);

                return true;
            }
        } catch (error) {
            console.error('Erro ao processar e sincronizar conquistas híbridas:', error);
        }
        return false;
    }
};