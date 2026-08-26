import React, { useState } from 'react';
import { Plus, FolderOpen, FileText, Trash2, Download } from 'lucide-react';
import { useOrg } from '../../context/OrgContext';
import { DocumentRecord } from '../../types';
import { formatDate } from '../../lib/utils/formatters';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export const DocumentsView: React.FC = () => {
  const { documents, uploadDocument, deleteDocument, suppliers } = useOrg();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'invoice' as DocumentRecord['category'],
    relatedSupplierId: '',
    docDate: new Date().toISOString().split('T')[0],
    fileSize: '350 KB'
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    uploadDocument({
      ...formData,
      fileUrl: '#'
    });
    setIsCreateOpen(false);
    setFormData({ name: '', category: 'invoice', relatedSupplierId: '', docDate: new Date().toISOString().split('T')[0], fileSize: '350 KB' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Documentos y Comprobantes</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Repositorio documental administrativo preparado para procesamiento y OCR.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsCreateOpen(true)}
        >
          Subir Documento
        </Button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border-subtle)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Nombre Archivo</th>
              <th style={{ padding: '0.75rem 1rem' }}>Tipo</th>
              <th style={{ padding: '0.75rem 1rem' }}>Fecha</th>
              <th style={{ padding: '0.75rem 1rem' }}>Tamaño</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No hay documentos almacenados.
                </td>
              </tr>
            ) : (
              documents.map(doc => (
                <tr key={doc.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={16} style={{ color: 'var(--color-primary)' }} />
                    {doc.name}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className="badge badge-neutral">{doc.category}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    {formatDate(doc.docDate)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    {doc.fileSize || '150 KB'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isCreateOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateOpen(false)}
          title="Subir Documento"
          subtitle="Adjuntar factura, contrato o comprobante legal"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleUploadSubmit} disabled={!formData.name.trim()}>
                Guardar Registro
              </Button>
            </>
          }
        >
          <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                Nombre del Archivo / Título *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Factura-Compra-Aceros-082026.pdf"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)' }}
                >
                  <option value="invoice">Factura</option>
                  <option value="receipt">Recibo</option>
                  <option value="contract">Contrato</option>
                  <option value="tax">Impositivo</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Fecha de Comprobante
                </label>
                <input
                  type="date"
                  value={formData.docDate}
                  onChange={e => setFormData({ ...formData, docDate: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)' }}
                />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
