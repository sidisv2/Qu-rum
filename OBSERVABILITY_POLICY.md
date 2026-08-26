# POLÍTICA DE OBSERVABILIDAD Y REGISTRO ESTRUCTURADO — DIREX

1. **Correlation IDs (`X-Request-ID`):** Todo request que ingresa genera o propaga un UUID para auditoría unificada.
2. **Audit Logs Inmutables:** Los registros de auditoría almacenan metadata de la solicitud (`duration_ms`, `requestId`, `user_name`, `action`).
3. **No Filtración de PII ni Secretos:** Nunca se registran contraseñas, tokens JWT, API keys de LLM ni números completos de tarjetas en los logs.
