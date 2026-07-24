# ELAN AI

Motor de Inteligencia Operacional del ecosistema ELANKAV.

Arquitectura:

Channel
?
Dispatcher
?
Planner
?
Memory
?
Knowledge
?
Reasoning
?
Operators
?
Tools
?
Business Engine

## Integración con Orchestrator

El runtime expone el contrato interno `ELAN-AI-INT-001`:

```text
POST /v1/runtime/messages
X-ELAN-AI-Token: <token interno>
```

Modos:

- `shadow`: procesa contexto y decisión, sin ejecutar herramientas y sin
  autorizar entrega al canal.
- `active`: habilita herramientas y marca la respuesta como entregable.

El servicio exige `ELAN_AI_INTERNAL_TOKEN`. Por defecto escucha únicamente en
`127.0.0.1:4200`; puede configurarse mediante `ELAN_AI_HOST` y `ELAN_AI_PORT`.
