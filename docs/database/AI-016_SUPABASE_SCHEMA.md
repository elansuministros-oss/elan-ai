# AI-016 — Contrato de datos Supabase

## Alcance

Este movimiento define el esquema inicial de persistencia de ELAN AI sin ejecutarlo contra ninguna base de datos.

## Tablas

- `elan_ai_identities`
- `elan_ai_identity_links`
- `elan_ai_memory_sessions`
- `elan_ai_memory_messages`
- `elan_ai_states`
- `elan_ai_knowledge`
- `elan_ai_health`

## Reglas

- Identity es la entidad canónica.
- Memory se relaciona con Identity.
- State permanece separado de Memory.
- Knowledge permanece separado de conversaciones.
- No existen políticas públicas en esta fase.
- La migración no se aplica automáticamente.
- ELANVISUAL, Orchestrator y producción no se modifican.