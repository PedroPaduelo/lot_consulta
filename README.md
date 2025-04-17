# Lot Consulta (Validador de CPF em Lote)

## Visão Geral

Esta é uma aplicação web desenvolvida em React e TypeScript que permite aos usuários fazer upload de arquivos Excel (.xlsx, .xls) contendo CPFs. A aplicação valida os CPFs, permite salvar os dados processados como um lote em um banco de dados Supabase e visualizar os lotes salvos e seus detalhes. Inclui funcionalidade para iniciar um processo externo (via webhook) para consultar os CPFs do lote em uma API bancária (simulada/externa).

A aplicação também possui um sistema de troca de temas (claro/escuro).

## Funcionalidades Principais

*   **Upload de Arquivo:** Carrega arquivos Excel (.xlsx, .xls).
*   **Extração e Validação de CPF:** Tenta identificar automaticamente a coluna de CPF, limpa os dados e valida o formato e o dígito verificador.
*   **Visualização Prévia:** Exibe os dados extraídos (CPF, Nome, Telefone) e o status da validação inicial em uma tabela paginada.
*   **Salvar Lote:** Salva as informações do arquivo e os dados dos CPFs em um banco de dados Supabase como um "lote" com status inicial "Pendente".
*   **Listagem de Lotes:** Exibe os lotes salvos com informações como nome, arquivo, contagem de CPFs, status e data de criação.
*   **Detalhes do Lote:** Mostra informações detalhadas de um lote específico, incluindo uma lista paginada e filtrável dos CPFs associados, status de processamento individual (Pendente, Em execução, Finalizado) e um modal para visualizar o resultado da consulta externa (campo `result`).
*   **Barra de Progresso:** Exibe o progresso da consulta dos CPFs para lotes "Em execução" (atualizado via polling).
*   **Iniciar Processamento:** Botão para acionar um webhook externo (ex: n8n) para iniciar o processamento/consulta dos CPFs de um lote.
*   **Consulta Individual de CPF (Simulada):** Uma tela separada para consultar um CPF individualmente (atualmente com dados mockados).
*   **Troca de Tema:** Permite alternar entre os modos claro (light) e escuro (dark), ou seguir a preferência do sistema.

## Tecnologias Utilizadas

*   **Frontend:**
    *   React
    *   TypeScript
    *   Vite (Build Tool)
    *   Tailwind CSS (Estilização)
    *   `next-themes` (Gerenciamento de Temas)
    *   `lucide-react` (Ícones)
    *   `xlsx` (Leitura de arquivos Excel)
*   **Banco de Dados:**
    *   Supabase (PostgreSQL)
*   **Outros:**
    *   `eslint`, `prettier` (Linting e Formatação)

## Pré-requisitos

*   Node.js (versão 18 ou superior recomendada)
*   npm (ou yarn/pnpm)

## Configuração do Ambiente

1.  **Clonar o Repositório (se aplicável):**
    ```bash
    # git clone <url-do-repositorio>
    # cd <diretorio-do-projeto>
    ```

2.  **Instalar Dependências:**
    ```bash
    npm install
    ```

3.  **Configurar Variáveis de Ambiente (CRÍTICO):**
    *   Crie um arquivo chamado `.env` na raiz do projeto.
    *   Adicione as seguintes variáveis de ambiente, substituindo pelos valores do seu projeto Supabase:

    ```dotenv
    VITE_SUPABASE_URL=https://vgfvrxacfbboetihlnxm.supabase.co
    VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnZnZyeGFjZmJib2V0aWhsbnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NjE4NTYsImV4cCI6MjA2MDQzNzg1Nn0.GOwIXrjhyMTkBTVRL3TOKs5YsdTBnXytDP2Pl9opumw
    ```
    *   **IMPORTANTE:** A aplicação **não funcionará** sem estas variáveis corretamente configuradas. O prefixo `VITE_` é necessário para que o Vite exponha essas variáveis ao código do lado do cliente.

## Rodando o Projeto

1.  **Iniciar o Servidor de Desenvolvimento:**
    ```bash
    npm run dev
    ```

2.  Abra seu navegador e acesse `http://localhost:5173` (ou a porta indicada no terminal).

## Banco de Dados (Supabase)

*   A aplicação utiliza o Supabase como backend e banco de dados.
*   As migrações SQL para criar as tabelas necessárias (`batches`, `cpf_records`) e adicionar colunas (`id_execucao`) estão localizadas no diretório `/supabase/migrations`.
*   Se estiver configurando um novo projeto Supabase, você precisará aplicar essas migrações ao seu banco de dados. Para o ambiente de desenvolvimento atual, presume-se que o banco de dados conectado via `.env` já possui o esquema necessário.

## Dependências Externas

*   **Webhook de Início de Job:** A funcionalidade do botão "Iniciar" na lista de lotes depende de um webhook externo configurado em:
    `https://n8n-queue-2-n8n-webhook.mrt7ga.easypanel.host/webhook/job-consulta`
    Este webhook é responsável por receber o `batch_id`, iniciar o processo de consulta dos CPFs e, idealmente, atualizar o status do lote e dos CPFs no banco de dados Supabase.
*   **Webhook de Pausa de Job (Placeholder):** A funcionalidade de pausar um job ainda não está totalmente implementada e dependerá de um webhook similar (URL e payload a serem definidos).
