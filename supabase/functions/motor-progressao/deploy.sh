#!/bin/bash

# Script de deploy do Motor de Progressão para Supabase Edge Functions

echo "🚀 Deploy do Motor de Progressão - Glyph 2050"
echo "=============================================="

# Verificar se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado. Por favor, instale:"
    echo "npm install -g supabase"
    exit 1
fi

# Verificar se está logado
if ! supabase projects list &> /dev/null; then
    echo "❌ Você precisa estar logado no Supabase. Execute:"
    echo "supabase login"
    exit 1
fi

# Deploy da função
echo "📦 Fazendo deploy da função motor-progressao..."

supabase functions deploy motor-progressao \
  --project-ref your-project-id \
  --no-verify-jwt

echo "✅ Deploy concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure as variáveis de ambiente no Supabase:"
echo "   - SUPABASE_URL: sua URL do Supabase"
echo "   - SUPABASE_SERVICE_ROLE_KEY: sua Service Role Key"
echo ""
echo "2. Configure o agendamento semanal no Supabase:"
echo "   - Acesse: https://app.supabase.com/project/_/settings/cron"
echo "   - Adicione: 0 6 * * 1 (toda segunda às 6h)"
echo "   - URL: https://your-project.supabase.co/functions/v1/motor-progressao"
echo ""
echo "3. Teste a função:"
echo "curl -X POST https://your-project.supabase.co/functions/v1/motor-progressao \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"match_performances\": [{\"player_id\": \"uuid\", \"phase\": 8.5, \"match_date\": \"2024-01-15T20:00:00Z\"}]}'"
echo ""
echo "🎮 Motor de Progressão do Glyph 2050 pronto para revolucionar o mercado!"