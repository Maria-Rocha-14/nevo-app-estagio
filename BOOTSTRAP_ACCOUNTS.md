# Bootstrap Accounts

Este projeto cria automaticamente contas de teste ao iniciar a aplicação frontend.

## Contas disponíveis

### 1. Admin
- Email: `admin@nevo.local`
- Password: `Admin#1234`
- Log in via a página de login principal.
- Esta conta usa a validação de admin hard-coded no frontend (`frontend/src/services/session.ts`).

### 2. Utilizador normal
- Email: `user@nevo.local`
- Password: `User@1234`
- XP: `0`
- Pontos: `0`
- Conta criada automaticamente no banco local Dexie se ainda não existir.

### 3. Utilizador power
- Email: `power@nevo.local`
- Password: `Power@1234`
- XP: `25000`
- Pontos: `10000`
- Conta criada automaticamente no banco local Dexie se ainda não existir.

## Como funciona

- O bootstrap roda durante o carregamento do app em `frontend/src/App.tsx`.
- O arquivo responsável pela inicialização das contas é `frontend/src/services/bootstrapUsers.ts`.
- Se as contas já existirem no banco local, elas não serão duplicadas.

## Observações

- O admin continua a ser autenticado pelo fluxo frontend de admin, usando `validateAdminCredentials`.
- As duas contas de utilizador (`user@nevo.local` e `power@nevo.local`) estão disponíveis na base local Dexie e podem ser usadas diretamente no login.
- Se quiser redefinir essas contas, limpe o IndexedDB do navegador ou apague o banco `NevoDB` e recarregue a aplicação.
