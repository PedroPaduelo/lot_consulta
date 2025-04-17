/*
  # Adicionar id_execucao à tabela batches

  Este script adiciona uma nova coluna `id_execucao` à tabela `batches`.

  1. Modificações na Tabela `batches`:
     - Adiciona a coluna `id_execucao` (tipo `text`, pode ser `NULL`). Esta coluna armazenará o identificador do job de execução externo (ex: n8n workflow ID).
*/

-- Adiciona a coluna id_execucao se ela não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'batches'
    AND column_name = 'id_execucao'
  ) THEN
    ALTER TABLE public.batches ADD COLUMN id_execucao TEXT NULL;
    RAISE NOTICE 'Coluna id_execucao adicionada à tabela batches.';
  ELSE
    RAISE NOTICE 'Coluna id_execucao já existe na tabela batches.';
  END IF;
END $$;