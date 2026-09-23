-- Migración 002: Asegurar campos técnicos y de archivos para rotulación MEB
-- Las migraciones nunca deben eliminar o recrear tablas existentes.

-- SQLite permite ALTER TABLE ADD COLUMN de forma segura.
-- Si la columna ya existe, el ejecutor de migraciones captura el caso de forma segura.
