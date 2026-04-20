import Dexie, { type EntityTable } from 'dexie';

// Definimos a interface do Utilizador (o que guardamos)
interface User {
    id?: number;
    name: string;
    email: string;
    dob: string;      // Data de nascimento
    password: string;
    skinHistory: string;
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