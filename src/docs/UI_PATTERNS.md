# Elite 2050 - Padrões de UI Premium

Este documento define os padrões visuais e de experiência do usuário para o Elite 2050, garantindo consistência em toda a interface.

## 1. Identidade Visual
- **Tipografia**: Uso predominante de fontes Sans-Serif (Inter/System) com variações de peso (Black para títulos, Medium para corpo). Uso frequente de `uppercase`, `italic` e `tracking-tighter` para estética técnica/esportiva.
- **Cores Base**: 
  - Fundo: `#02040a` (Deep Space)
  - Bordas: `rgba(255, 255, 255, 0.05)` ou `rgba(255, 255, 255, 0.1)`
  - Destaque Cyan: `#22d3ee` (Glow/Tech)
  - Destaque Amber: `#f59e0b` (Premium/Gold)

## 2. Elementos de Interface (Glassmorphism)
- **Cards**:
  - Background: `bg-white/[0.02]` ou `bg-black/40`
  - Backdrop Blur: `backdrop-blur-xl` ou `backdrop-blur-2xl`
  - Bordas: `border-white/5` com transições para `border-cyan-500/30` no hover.
  - Border Radius: `rounded-2xl` para elementos pequenos, `rounded-[2.5rem]` para seções grandes.

## 3. Efeitos Neon e Glow
- **Pulse**: Uso de `animate-pulse` em indicadores de status ativos.
- **Shadows**: `shadow-[0_0_30px_rgba(34,211,238,0.2)]` para elementos em destaque.
- **Gradients**: `bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent` para backgrounds sutis.

## 4. Componentes Recorrentes
- **PlayerCard**: Exibição compacta de atletas com rating, posição e detalhes técnicos.
- **Technical Info**: Pequenos labels em `uppercase`, `text-[8px]`, `font-black`, `tracking-widest`.
- **Status Indicators**: Pequenos círculos (`w-2 h-2`) com cores semânticas (Cyan=Ok, Red=Alert, Amber=Pending).

## 5. Layout e Onboarding
- O onboarding deve ser imersivo, utilizando fundos radiais (`bg-[radial-gradient(...)]`) e elementos decorativos que remetam a uma interface de comando técnico.
- Responsividade: Uso rigoroso de breakpoints `xl`, `lg` e `md` para garantir que o conteúdo caiba na tela sem scroll excessivo.
