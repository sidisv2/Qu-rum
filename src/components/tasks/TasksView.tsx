import React, { useState } from 'react';
import { Plus, CheckSquare, Clock, Trash2, Bot, AlertCircle } from 'lucide-react';
import { useOrg } from '../../context/OrgContext';
import { Task, TaskPriority } from '../../types';
import { formatDate } from '../../lib/utils/formatters';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export const TasksView: React.FC = () => {
  const { tasks, createTask, toggleTaskStatus, deleteTask } = useOrg();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: ''
  });

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const pendingTasks = filteredTasks.filter(t => t.status !== 'completed');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    await createTask({
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      dueDate: formData.dueDate,
      assignedTo: formData.assignedTo || undefined,
      status: 'pending'
    });
    setIsCreateOpen(false);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: new Date().toISOString().split('T')[0],
      assignedTo: ''
    });
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="badge badge-danger">Urgente</span>;
      case 'high':
        return <span className="badge badge-warning">Alta</span>;
      case 'medium':
        return <span className="badge badge-info">Media</span>;
      case 'low':
        return <span className="badge badge-secondary">Baja</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckSquare size={24} style={{ color: 'var(--color-primary)' }} />
            Centro de Tareas y Compromisos
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Planificación operativa, delegación de responsabilidades y seguimiento sugerido por Director IA.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} /> Nueva Tarea
        </Button>
      </div>

      {/* Barra de Filtros */}
      <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          className="input"
          placeholder="Buscar tareas..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: '1', minWidth: '200px' }}
        />
        <select
          className="input"
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          style={{ width: 'auto' }}
        >
          <option value="all">Todas las prioridades</option>
          <option value="urgent">Urgente</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {/* Tareas Pendientes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} /> Pendientes ({pendingTasks.length})
          </h2>
          {pendingTasks.length === 0 ? (
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              No hay tareas pendientes con los filtros actuales.
            </div>
          ) : (
            pendingTasks.map(task => (
              <div key={task.id} className="card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', borderLeft: '4px solid var(--color-primary)' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => toggleTaskStatus(task.id)}
                    style={{ marginTop: '0.25rem', cursor: 'pointer' }}
                  />
                  <div>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                      {task.title}
                    </h4>
                    {task.description && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                        {task.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                      {getPriorityBadge(task.priority)}
                      <span>Vence: {formatDate(task.dueDate)}</span>
                      {task.assignedTo && <span>Responsable: {task.assignedTo}</span>}
                      {task.suggestedByAi && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                          <Bot size={12} /> Sugerido por IA
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm text-danger"
                  onClick={() => deleteTask(task.id)}
                  title="Eliminar tarea"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Tareas Completadas */}
        {completedTasks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', opacity: 0.75 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckSquare size={16} /> Completadas ({completedTasks.length})
            </h2>
            {completedTasks.map(task => (
              <div key={task.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => toggleTaskStatus(task.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <div>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
                      {task.title}
                    </h4>
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm text-danger"
                  onClick={() => deleteTask(task.id)}
                  title="Eliminar tarea"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear Tarea */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Crear Nueva Tarea">
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label">Título de la Tarea</label>
            <input
              type="text"
              className="input"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Llamar a proveedor para renegociar plazo"
              required
            />
          </div>

          <div>
            <label className="label">Descripción (Opcional)</label>
            <textarea
              className="input"
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalles sobre la tarea..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="label">Prioridad</label>
              <select
                className="input"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <div>
              <label className="label">Fecha de Vencimiento</label>
              <input
                type="date"
                className="input"
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Responsable (Opcional)</label>
            <input
              type="text"
              className="input"
              value={formData.assignedTo}
              onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
              placeholder="Ej: Juan Pérez / Contabilidad"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Crear Tarea
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
