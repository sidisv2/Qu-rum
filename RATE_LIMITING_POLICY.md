# POLÍTICA DE RATE LIMITING — DIREX

| Endpoint | Alcance | Límite | Ventana | Código HTTP |
| :--- | :---: | :---: | :---: | :---: |
| `/functions/v1/director-ia` | Por Usuario (`user_id`) | 20 peticiones | 60 seg | `429 Too Many Requests` |
| `/rest/v1/*` (Supabase PostgREST) | Por IP / Token | Global Cloudflare | 1 min | `429 Too Many Requests` |
