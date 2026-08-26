import React, { useState } from 'react';
import { Bot, Send, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { useOrg } from '../../context/OrgContext';
import { AIService, AIResponse } from '../../lib/ai/aiService';
import { Button } from '../ui/Button';

interface DirectorIAViewProps {
  onNavigateToSection?: (section: string) => void;
}

export const DirectorIAView: React.FC<DirectorIAViewProps> = ({ onNavigateToSection }) => {
  const { sales, expenses, receivables, payables, quotes, customers, products, applyAIRecommendation } = useOrg();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; response?: AIResponse; query?: string }>>([
    {
      role: 'assistant',
      response: {
        answer: 'Hola. Soy tu Director Administrativo IA. Analizo en tiempo real los datos consolidados de tu empresa para indicarte qué está pasando y qué acciones tomar.',
        basedOnPeriod: 'Agosto 2026',
        costEstimatedTokens: 0,
        recommendations: []
      }
    }
  ]);

  const suggestedQuestions = [
    '¿Cómo está mi negocio?',
    '¿Qué debería hacer hoy?',
    '¿Quién me debe dinero?',
    '¿Dónde estoy gastando de más?',
    '¿Qué clientes están en riesgo?'
  ];

  const handleAsk = async (questionText: string) => {
    if (!questionText.trim() || loading) return;
    const q = questionText.trim();
    setQuery('');
    setLoading(true);

    // Add user message
    setHistory(prev => [...prev, { role: 'user', query: q }]);

    try {
      const res = await AIService.queryDirector(q, {
        sales,
        expenses,
        receivables,
        payables,
        quotes,
        customers,
        products
      });
      setHistory(prev => [...prev, { role: 'assistant', response: res }]);
    } catch (e) {
      console.error(e);
      setHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          response: {
            answer: 'Hubo un inconveniente al procesar la consulta con los datos actuales.',
            basedOnPeriod: 'Período actual',
            costEstimatedTokens: 0,
            recommendations: []
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header section */}
      <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <Bot size={22} style={{ color: 'var(--color-primary)' }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Director Administrativo IA
          </h1>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Analizá tu negocio y descubrí qué requiere atención. La IA opera exclusivamente sobre las transacciones y clientes de tu empresa sin inventar datos.
        </p>
      </div>

      {/* Suggested prompts */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
          Consultas sugeridas de gestión
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {suggestedQuestions.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(sq)}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-full)',
                padding: '0.4rem 0.85rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-border-default)';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Chat conversation stream */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          minHeight: '400px',
          maxHeight: '520px',
          overflowY: 'auto',
          backgroundColor: '#ffffff'
        }}
      >
        {history.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              gap: '0.5rem'
            }}
          >
            {msg.role === 'user' ? (
              <div
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px 12px 2px 12px',
                  maxWidth: '80%',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                {msg.query}
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '12px 12px 12px 2px',
                  padding: '1rem 1.25rem',
                  maxWidth: '90%',
                  fontSize: '0.875rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: 'var(--color-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                    IA
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
                    Director Administrativo
                  </span>
                  {msg.response?.basedOnPeriod && (
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                      Basado en datos de: {msg.response.basedOnPeriod}
                    </span>
                  )}
                </div>

                <div style={{ whiteSpace: 'pre-line', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                  {msg.response?.answer}
                </div>

                {/* Render actionable recommendations if any */}
                {msg.response?.recommendations && msg.response.recommendations.length > 0 && (
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Recomendaciones estructuradas
                    </div>
                    {msg.response.recommendations.map(rec => (
                      <div
                        key={rec.id}
                        style={{
                          border: '1px solid var(--color-border-default)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.75rem',
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '1rem'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>{rec.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{rec.recommendation}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => applyAIRecommendation(rec.id)}
                          icon={<ArrowRight size={12} />}
                        >
                          Crear tarea / Resolver
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
            <Sparkles size={16} className="spin" />
            Analizando balance, cobros, presupuestos y gastos de la empresa...
          </div>
        )}
      </div>

      {/* Input box */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleAsk(query);
        }}
        style={{ display: 'flex', gap: '0.75rem' }}
      >
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Escribí tu consulta administrativa (ej: ¿quién me debe dinero hoy?)..."
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-default)',
            outline: 'none',
            fontSize: '0.875rem'
          }}
          disabled={loading}
        />
        <Button
          type="submit"
          variant="primary"
          icon={<Send size={16} />}
          loading={loading}
          disabled={!query.trim()}
        >
          Consultar
        </Button>
      </form>
    </div>
  );
};
