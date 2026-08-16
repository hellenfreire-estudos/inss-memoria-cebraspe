# NASA Push Server
Servidor mínimo para registrar a assinatura do iPhone, agendar alertas e entregar Web Push via APNs.

- POST /subscribe
- POST /schedule
- POST /test
- Cron a cada minuto para horários e revisões
- VAPID em secrets
- KV para uma assinatura pessoal e agenda
