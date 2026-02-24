# Motor de Progressão - Glyph 2050

## Visão Geral

O Motor de Progressão é uma Edge Function do Supabase que roda semanalmente para atualizar os ratings dos jogadores baseado em seu desempenho nas partidas. Este sistema é o coração da economia do jogo Glyph, onde o Rating é a moeda de troca.

## Como Funciona

### 1. Regras de Negócio

#### A. Volatilidade por Nível de Rating
- **Bagre/Promessa (Rating < 600)**: Alta volatilidade - multiplicador 1.5x
  - Ganham muito quando jogam bem, perdem muito quando jogam mal
  - Ex: Nota 9.0 = +22.5 pontos, Nota 4.0 = -15 pontos
  
- **Nível Médio (Rating 600-800)**: Volatilidade normal - multiplicador 1.0x
  - Variação proporcional ao desempenho
  - Ex: Nota 9.0 = +15 pontos, Nota 4.0 = -10 pontos
  
- **Craque (Rating > 800)**: Baixa volatilidade - multiplicador 0.15x
  - Blue chips do mercado - muito estáveis
  - Ex: Nota 9.0 = +2.3 pontos, Nota 4.0 = -1.5 pontos

#### B. Resistência do Potencial
- Quando o jogador está a menos de 15 pontos do seu potencial máximo, ganhos positivos são reduzidos pela metade
- O Rating nunca pode ultrapassar o Potential Rating

#### C. Modificadores de Badges
- **"Trabalhador"**: +20% em ganhos positivos
- **"Preguiçoso"**: -20% adicional em perdas negativas  
- **"Consistente"**: Reduz perdas negativas pela metade

### 2. Fórmula de Cálculo

```
Base Delta = (current_phase - 6.0) * 5
Volatility Multiplier = baseado no nível de rating
Potential Reduction = 0.5 se próximo do teto
Badge Modifiers = baseado nos traços do jogador

Novo Rating = Rating Atual + (Base Delta * Volatilidade * Modificadores)
```

## Uso da API

### Endpoint
```
POST https://your-project.supabase.co/functions/v1/motor-progressao
```

### Request Body
```json
{
  "match_performances": [
    {
      "player_id": "uuid-do-jogador-1",
      "phase": 8.5,
      "match_date": "2024-01-15T20:00:00Z"
    },
    {
      "player_id": "uuid-do-jogador-2", 
      "phase": 4.2,
      "match_date": "2024-01-15T20:00:00Z"
    }
  ]
}
```

### Response
```json
{
  "success": true,
  "updated_count": 2,
  "players": [
    {
      "id": "uuid-do-jogador-1",
      "name": "Zion Matrix",
      "old_rating": 650,
      "new_rating": 672,
      "delta": 22,
      "phase": 8.5
    },
    {
      "id": "uuid-do-jogador-2",
      "name": "Akira Voss",
      "old_rating": 820,
      "new_rating": 819,
      "delta": -1,
      "phase": 4.2
    }
  ]
}
```

## Exemplos de Cálculo

### Exemplo 1: Jovem Promessa
```
Jogador: Rating 550, Potential 800, Nota: 9.0, Badge: "Trabalhador"
Base Delta: (9.0 - 6.0) * 5 = +15
Volatilidade (Bagre): 15 * 1.5 = +22.5
Badge Trabalhador: 22.5 * 1.2 = +27
Novo Rating: 550 + 27 = 577
```

### Exemplo 2: Craque Consolidado
```
Jogador: Rating 850, Potential 900, Nota: 4.0, Badge: "Consistente"
Base Delta: (4.0 - 6.0) * 5 = -10
Volatilidade (Craque): -10 * 0.15 = -1.5
Badge Consistente: -1.5 * 0.5 = -0.75
Novo Rating: 850 - 1 = 849 (arredondado)
```

### Exemplo 3: Próximo do Teto
```
Jogador: Rating 785, Potential 800, Nota: 8.5, Badge: Nenhum
Base Delta: (8.5 - 6.0) * 5 = +12.5
Volatilidade (Médio): 12.5 * 1.0 = +12.5
Resistência Potencial: 12.5 * 0.5 = +6.25 (está a 15 do teto)
Novo Rating: 785 + 6 = 791
```

## Histórico de Fases

O sistema mantém um histórico das últimas 5 fases do jogador em formato JSONB:

```json
[
  {
    "date": "2024-01-15T20:00:00Z",
    "phase": 8.5,
    "rating": 672
  },
  {
    "date": "2024-01-08T20:00:00Z", 
    "phase": 7.2,
    "rating": 650
  }
]
```

## Agendamento

Configure a função para rodar automaticamente toda semana usando o Supabase Cron:

```sql
-- Agendar para rodar toda segunda-feira às 6h da manhã
SELECT cron.schedule(
  'motor-progressao-semanal',
  '0 6 * * 1', -- Cron expression: 6 AM every Monday
  'SELECT http_post(\'https://your-project.supabase.co/functions/v1/motor-progressao\', \'{"match_performances": []}\')'
);
```

## Monitoramento

A função gera logs detalhados para monitoramento:

```
Rating calculado para Zion Matrix: 650 → 672 (delta: 22, phase: 8.5)
Rating calculado para Akira Voss: 820 → 819 (delta: -1, phase: 4.2)
Motor de Progressão concluído. 2 jogadores atualizados.
```

## Segurança

- Use a Service Role Key do Supabase para acesso total ao banco
- Implemente rate limiting se necessário
- Valide todos os inputs antes de processar
- Use transações para garantir consistência dos dados