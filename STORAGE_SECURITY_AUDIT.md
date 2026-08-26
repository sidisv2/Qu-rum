# AUDITORÍA DE SEGURIDAD DE STORAGE — DIREX

1. **Bucket Privado:**
   - Bucket `documents` creado con flag `public = false`.
2. **Estructura Jerárquica:**
   - Formato de path: `{organization_id}/{document_id}/{filename}`.
3. **Validación RLS en Storage:**
   - La policy `storage.objects` exige que el usuario autenticado sea miembro de la organización indicada en el primer segmento del path.
4. **Acceso mediante Signed URLs:**
   - Ninguna URL pública estática es expuesta; el acceso temporal se firma criptográficamente con tiempo de vida limitado.
5. **Aislamiento Multi-Tenant:**
   - Los intentos de generar Signed URLs sobre rutas pertenecientes a otras organizaciones son rechazados con excepción de acceso denegado.
