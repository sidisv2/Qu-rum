import React, { useState } from 'react';
import { Plus, FolderOpen, FileText, Trash2, Download, UploadCloud, Loader2 } from 'lucide-react';
import { useOrg } from '../../context/OrgContext';
import { DocumentRecord } from '../../types';
import { formatDate } from '../../lib/utils/formatters';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { getStorageRepository } from '../../lib/storage';

export const DocumentsView: React.FC = () => {
  const { documents, uploadDocument, deleteDocument, suppliers, currentOrg } = useOrg();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'invoice' as DocumentRecord['category'],
    relatedSupplierId: '',
    docDate: new Date().toISOString().split('T')[0]
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      if (!formData.name) {
        setFormData(prev => ({ ...prev, name: f.name.replace(/\.[^/.]+$/, '') }));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !currentOrg) return;

    setIsUploading(true);
    try {
      let fileUrl = '#';
      let fileSize = '0 KB';

      if (selectedFile) {
        const storageRepo = getStorageRepository();
        const docId = 'doc-' + Date.now();
        const result = await storageRepo.uploadDocument({
          organizationId: currentOrg.id,
          documentId: docId,
          file: selectedFile,
          fileName: selectedFile.name,
          contentType: selectedFile.type || 'application/octet-stream'
        });
        fileUrl = result.storagePath;
        fileSize = Math.round(result.sizeBytes / 1024) + ' KB';
      }

      await uploadDocument({
        name: formData.name,
        category: formData.category,
        relatedSupplierId: formData.relatedSupplierId || undefined,
        docDate: formData.docDate,
        fileUrl,
        fileSize
      });

      setIsCreateOpen(false);
      setSelectedFile(null);
      setFormData({
        name: '',
        category: 'invoice',
        relatedSupplierId: '',
        docDate: new Date().toISOString().split('T')[0]
      });
    } catch (err: any) {
      console.error('Error subiendo archivo:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: DocumentRecord) => {
    if (!currentOrg || !doc.fileUrl || doc.fileUrl === '#') return;
    setDownloadingId(doc.id);
    try {
      const storageRepo = getStorageRepository();
      const signedUrl = await storageRepo.getSignedUrl(currentOrg.id, doc.fileUrl);
      window.open(signedUrl, '_blank');
    } catch (err: any) {
      console.error('Error descargando documento:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderOpen size={24} style={{ color: 'var(--color-primary)' }} />
            Documentos y Archivos Digitales
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Repositorio multi-tenant cifrado con Supabase Object Storage y firmado de URLs seguro.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} /> Subir Documento
        </Button>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Documento</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Categoría</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Fecha</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Tamaño</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No hay documentos registrados en esta organización.
                  </td>
                </tr>
              ) : (
                documents.map(doc => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={16} style={{ color: 'var(--color-primary)' }} />
                      {doc.name}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className="badge badge-info">{doc.category.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{formatDate(doc.docDate)}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>{doc.fileSize || 'N/A'}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        {doc.fileUrl && doc.fileUrl !== '#' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDownload(doc)}
                            disabled={downloadingId === doc.id}
                            title="Descargar / Ver"
                          >
                            {downloadingId === doc.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm text-danger"
                          onClick={() => deleteDocument(doc.id)}
                          title="Eliminar documento"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Subir Documento */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Subir Nuevo Documento">
        <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label">Nombre del Documento</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Factura de Servicios Cloud"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="label">Categoría</label>
              <select
                className="input"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
              >
                <option value="invoice">Factura</option>
                <option value="receipt">Recibo</option>
                <option value="contract">Contrato</option>
                <option value="tax">Impuestos</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div>
              <label className="label">Fecha</label>
              <input
                type="date"
                className="input"
                value={formData.docDate}
                onChange={e => setFormData({ ...formData, docDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Proveedor Vinculado (Opcional)</label>
            <select
              className="input"
              value={formData.relatedSupplierId}
              onChange={e => setFormData({ ...formData, relatedSupplierId: e.target.value })}
            >
              <option value="">-- Sin vincular --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Archivo Físico (PDF, Imagen, CSV)</label>
            <div style={{ border: '2px dashed var(--color-border)', borderRadius: '8px', padding: '1.25rem', textAlign: 'center', background: 'var(--color-bg-secondary)' }}>
              <input
                type="file"
                id="doc-file-input"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.xlsx"
              />
              <label htmlFor="doc-file-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <UploadCloud size={32} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {selectedFile ? selectedFile.name : 'Haz clic para seleccionar un archivo'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : 'Máximo 10MB'}
                </span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)} disabled={isUploading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : 'Guardar y Subir'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
