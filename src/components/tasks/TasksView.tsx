import React, { useState } from 'react';
import { Plus, CheckSquare, Clock, Trash2, Bot } from 'lucide-react';
import { useOrg } from '../../context/OrgContext';
import { Task, TaskPriority } from '../../types';
import { formatDate } from '../../lib/utils/formatters';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export const TasksView: React.FC = () => {
  const { tasks, createTask, toggleTaskStatus, deleteTask } = useOrg();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    dueDate: new Date().toISOString().split('T')[0]
  });

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    createTask({
      ...formData,
      status: 'pending',
      suggestedByAi: false
    });
    setIsCreateOpen(false);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: new Date().toISOString().split('T')[0]
    });
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'high': return <span className="badge badge-danger">Alta</span>;
      case 'medium': return <span className="badge badge-warning">Media</span>;
      case 'low': return <span className="badge badge-neutral">Baja</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Tareas de Gestión</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Acciones pendientes, reclamos de cobranzas y seguimiento operativo.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsCreateOpen(true)}
        >
          Nueva Tarea
        </Button>
      </div>

      {/* Task lists */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
          Pendientes ({pendingTasks.length})
        </h3>

        {pendingTasks.length === 0 ? (
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            No hay tareas pendientes. ¡Excelente día!
          </div>
        ) : (
          pendingTasks.map(t => (
            <div
              key={t.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
                padding: '1rem 1.25rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={t.status === 'completed'}
                  onChange={() => toggleTaskStatus(t.id)}
                  style={{ marginTop: '3px', cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    {getPriorityBadge(t.priority)}
                    {t.suggestedByAi && (
                      <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.6875rem' }}>
                        <Bot size={10} /> Sugerida por IA
                      </span>
                    )}
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                      {t.title}
                    </span>
                  </div>
                  {t.description && (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                      {t.description}
                    </p>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                    Vencimiento: {formatDate(t.dueDate)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteTask(t.id)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.25rem' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}

        {completedTasks.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Completadas ({completedTasks.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {completedTasks.map(t => (
                <div key={t.id} className="card" style={{ opacity: 0.6, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => toggleTaskStatus(t.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ textDecoration: 'line-through', fontSize: '0.875rem' }}>{t.title}</span>
                  </div>
                  <button onClick={() => deleteTask(t.id)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateOpen(false)}
          title="Nueva Tarea"
          subtitle="Crear recordatorio o acción administrativa"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateSubmit} disabled={!formData.title.trim()}>
                Guardar Tarea
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                Título de la tarea *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Prioridad
                </label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)' }}
                >
                  <option value="high">Alta</option>
                  <option value="medium">Media</option>
                  <option value="low">Baja</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Fecha Límite
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                Descripción o Instrucciones
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', minHeight: '60px' }}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
