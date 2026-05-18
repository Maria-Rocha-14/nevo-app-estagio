# UI Components Library

Biblioteca centralizada de componentes reutilizáveis para interface consistente em toda a aplicação.

## Componentes Disponíveis

### Button

Componente de botão com múltiplos estilos e estados.

```tsx
import { Button } from '@/components/UI';

// Variant: primary (default) | secondary | success | danger | ghost
// Size: sm | md (default) | lg

<Button onClick={handleClick}>Click me</Button>
<Button variant="success" size="lg">Submit</Button>
<Button variant="danger" disabled>Disabled</Button>
<Button isLoading>Carregando...</Button>
```

### Card

Componente de card para agrupar conteúdo.

```tsx
import { Card } from '@/components/UI';

<Card>
  <h3>Card Title</h3>
  <p>Card content here</p>
</Card>

// Interactive card with click handler
<Card interactive onClick={handleCardClick}>
  Clicável
</Card>
```

### Input

Componente de input com suporte a labels, erros e helper text.

```tsx
import { Input } from '@/components/UI';

<Input 
  label="Email" 
  type="email" 
  placeholder="Enter your email"
  required
/>

<Input
  label="Password"
  type="password"
  error="Password is too short"
  helperText="Minimum 8 characters"
/>

<Input
  label="Name"
  variant="filled"
  disabled
/>
```

## Design Tokens

Tokens de design centralizados em `src/styles/tokens.css` para interface consistente.

### Colors

```css
--color-primary: #1abc9c
--color-secondary: #3498db
--color-success: #27ae60
--color-warning: #f39c12
--color-danger: #e74c3c
```

### Spacing

```css
--space-xs: 0.25rem    (4px)
--space-sm: 0.5rem     (8px)
--space-md: 1rem       (16px)
--space-lg: 1.5rem     (24px)
--space-xl: 2rem       (32px)
--space-2xl: 3rem      (48px)
--space-3xl: 4rem      (64px)
```

### Typography

```css
--font-size-xs: 0.75rem
--font-size-sm: 0.875rem
--font-size-base: 1rem
--font-size-lg: 1.125rem
--font-size-xl: 1.25rem
--font-size-2xl: 1.5rem
--font-size-3xl: 1.875rem

--font-weight-light: 300
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
```

### Border Radius

```css
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
--radius-full: 9999px
```

### Shadows

```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08)
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12)
--shadow-lg: 0 12px 28px rgba(0, 0, 0, 0.16)
--shadow-xl: 0 20px 40px rgba(0, 0, 0, 0.2)
```

## Importação com Aliases

Graças aos path aliases configurados em `tsconfig.app.json`, pode importar componentes de forma clara:

```tsx
// ✅ Recomendado
import { Button, Card, Input } from '@/components/UI';
import { ChameleonAvatar } from '@/components';

// ❌ Evitar
import { Button } from '../../../components/UI/Button';
```

## Dark Mode

Todos os tokens e componentes suportam dark mode automaticamente. O tema é gerenciado via `data-theme` no elemento `html`:

```tsx
// Ativar dark mode
document.documentElement.setAttribute('data-theme', 'dark');

// Desativar (light mode)
document.documentElement.removeAttribute('data-theme');
```

## Performance

- Componentes envolvidos em `React.memo` para evitar re-renders desnecessários
- Lazy loading de imagens com `loading="lazy"`
- Dynamic imports com `import.meta.glob()` para reduzir bundle size
- CSS variables para fácil customização

## Contribuindo

Ao criar novos componentes:

1. Exportar via `src/components/UI/index.ts`
2. Incluir `React.memo` se apropriado
3. Usar CSS variables dos tokens
4. Adicionar TypeScript types
5. Documentar no README
