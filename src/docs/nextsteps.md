Abaixo, a separação do que precisa ser construído e validado em cada setor:

🟢 1. Onboarding (O Portal de Entrada)
Modo Herdeiro: Tela de listagem de clubes com "Vaga Aberta" (IA ou Inativos). Ao selecionar, o banco vincula seu user_id ao club_id existente.

Modo Fundador: * Fluxo de criação (Nome, Sigla, Cores).

O Draft: Tela com contador de Rating (9.000) e travas de posição (2 GK, 5 DEF, 5 MID, 3 ATK) + trava de 3 "Top 50".

Finalização: Script que deleta o time antigo e "assenta" o novo elenco no banco de dados.

🏠 2. Tela Home (O Painel de Controle)
Card Próximo Jogo: Mostra o escudo do adversário, o Rating comparativo e botão "Jogar/Assistir".

Card Resumo Financeiro/Rating: O valor total da sua franquia e quanto você tem para gastar.

Card de Manchete: A última notícia gerada pelo motor de jogo (ex: o resultado do último jogo).

Navegação Rápida: Atalhos funcionais para Elenco e Mercado.

🛡️ 3. Tela Elenco (Gestão Profunda)
[x] Visualização de Elenco (Lista/Grid).
[x] Integração com LineupBuilder (Campo Tático).
[x] Atributos e Pentágono do Jogador.

📅 4. Tela Calendário (A Linha do Tempo)
Agenda de Jogos: Lista de rodadas passadas e futuras.

Integração de Notícias: Em vez de uma aba separada, as notícias (lesões, transferências da liga, crises) aparecem como "cards de evento" entre os jogos.

O SISTEMA É AO VIVO: Não existe botão de avançar. Os jogos acontecem em horários reais agendados. O servidor/motor processa as rodadas automaticamente.

🌎 5. Mundo (O Ecossistema)
Mercado: Filtros por posição e Rating. Botão "Proposta" funcional.

Ligas: Tabela de classificação (G4, Zona de Rebaixamento).

Clubes: Ranking de "Franquias mais valiosas" (soma de Rating).

Ranking de Players: O "Top 50" global para você saber quem são os alvos de elite.

(Notícias migraram para o Calendário para limpar a UI).

👤 6. Carreira (O Perfil do Manager)
Card de Info: Seu nível, títulos conquistados e vitórias/derrotas.

Botões Clicáveis: Editar perfil, Configurações de conta e Sair.

Histórico de Contratações: Lista das suas melhores jogadas de mercado.

⚙️ 7. O "Motor de Popa" (Back-end e Lógica)
Simulador: A função que lê as variáveis, aplica o Caos (20%) e gera os Ticks.

Cálculo de Evolução: O script de Inércia que roda após o apito final.

Conexão e Save: Garantir que quando você fechar o PWA e abrir de novo, os dados do Supabase carreguem instantaneamente (cache local).

🎨 8. Retoques de UI Finais
Identidade Visual: Aplicação do tema Neon em todos os botões e backgrounds.

Feedback de Clique: Animações leves ao contratar ou ganhar um jogo.

Ajuste de Notch: CSS para garantir que nada fique escondido no iPhone.

Avatares: O sistema que "veste" os cabelos e chuteiras nos seus jogadores com base nos dados.