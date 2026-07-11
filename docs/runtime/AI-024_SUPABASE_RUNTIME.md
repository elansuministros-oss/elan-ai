# AI-024 — Runtime Supabase

## Resultado

ELAN AI dispone de dos fábricas:

- `createDefaultElanAIRuntime()`: runtime local con adapters en memoria.
- `createSupabaseElanAIRuntime({ client })`: runtime con persistencia Supabase.
- `createConfiguredSupabaseRuntime({ env, clientFactory })`: crea cliente y runtime desde variables de entorno.

## Seguridad

- La clave `SUPABASE_SERVICE_ROLE_KEY` solo se usa en backend.
- Este movimiento no ejecuta migraciones.
- Este movimiento no modifica producción.
- La conexión real solo ocurre cuando se llama a la fábrica configurada con credenciales válidas.