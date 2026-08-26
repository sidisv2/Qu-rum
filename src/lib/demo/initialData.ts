import {
  Organization,
  Customer,
  Supplier,
  Product,
  Sale,
  Expense,
  Receivable,
  Payable,
  Quote,
  Task,
  DocumentRecord,
  AIRecommendation,
  AuditLog
} from '../../types';

export function getInitialDemoState(orgId: string = 'org-demo-100'): {
  organization: Organization;
  customers: Customer[];
  suppliers: Supplier[];
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  receivables: Receivable[];
  payables: Payable[];
  quotes: Quote[];
  tasks: Task[];
  documents: DocumentRecord[];
  recommendations: AIRecommendation[];
  auditLogs: AuditLog[];
} {
  const organization: Organization = {
    id: orgId,
    name: 'Distribuidora Central S.R.L.',
    taxId: '30-71234567-9',
    currency: 'ARS',
    currencySymbol: '$',
    industry: 'Comercio Mayorista y Distribución',
    isDemo: true,
    createdAt: '2026-01-15T00:00:00.000Z'
  };

  const customers: Customer[] = [
    {
      id: 'cust-1',
      organizationId: orgId,
      name: 'Carlos Benítez (Ferretería El Progreso)',
      email: 'carlos@elprogreso.com',
      phone: '+54 11 4455-8899',
      taxId: '20-28349210-4',
      address: 'Av. Rivadavia 8200, CABA',
      status: 'overdue',
      notes: 'Cliente histórico con atrasos recurrentes en pagos superiores a 30 días.',
      totalSpent: 3450000,
      totalPendingDebt: 180000,
      lastPurchaseDate: '2026-07-15',
      purchaseFrequencyDays: 30,
      createdAt: '2026-01-20'
    },
    {
      id: 'cust-2',
      organizationId: orgId,
      name: 'María Gómez (Constructora Sur)',
      email: 'mgomez@constructorasur.com',
      phone: '+54 11 5566-7788',
      taxId: '30-70981234-8',
      address: 'Calle Mitre 450, Quilmes',
      status: 'at_risk',
      notes: 'Frecuencia habitual cada 21 días. Lleva casi 2 meses sin realizar pedidos.',
      totalSpent: 8900000,
      totalPendingDebt: 0,
      lastPurchaseDate: '2026-06-29',
      purchaseFrequencyDays: 21,
      createdAt: '2026-02-01'
    },
    {
      id: 'cust-3',
      organizationId: orgId,
      name: 'Estudio Arquitectura V&M',
      email: 'compras@vym.com.ar',
      phone: '+54 11 3322-1100',
      taxId: '30-71554433-2',
      address: 'Palermo Soho, CABA',
      status: 'active',
      notes: 'Pagan puntualmente a 15 días de emitida la factura.',
      totalSpent: 5200000,
      totalPendingDebt: 450000,
      lastPurchaseDate: '2026-08-20',
      purchaseFrequencyDays: 14,
      createdAt: '2026-02-15'
    },
    {
      id: 'cust-4',
      organizationId: orgId,
      name: 'Sanitarios San Martín',
      email: 'sanitarios.sm@gmail.com',
      phone: '+54 11 6789-0123',
      taxId: '27-31298456-5',
      address: 'San Martín 1200, Morón',
      status: 'active',
      notes: 'Comprador habitual de insumos pesados.',
      totalSpent: 2100000,
      totalPendingDebt: 120000,
      lastPurchaseDate: '2026-08-18',
      purchaseFrequencyDays: 28,
      createdAt: '2026-03-10'
    }
  ];

  const suppliers: Supplier[] = [
    {
      id: 'sup-1',
      organizationId: orgId,
      name: 'YPF Combustibles y Logística',
      contactName: 'Guillermo Paz',
      email: 'distribucion@ypf-paz.com',
      phone: '+54 11 4000-1111',
      category: 'Combustible y Transporte',
      notes: 'Descuento del 3% por pago antes del día 10.',
      totalPaid: 1450000,
      pendingPayment: 320000,
      createdAt: '2026-01-10'
    },
    {
      id: 'sup-2',
      organizationId: orgId,
      name: 'Aceros & Metales del Plata',
      contactName: 'Lucía Varela',
      email: 'lvarela@acerosdelplata.com.ar',
      phone: '+54 11 4888-9999',
      category: 'Materia Prima e Insumos',
      notes: 'Proveedor principal de perfiles de acero.',
      totalPaid: 9800000,
      pendingPayment: 850000,
      createdAt: '2026-01-12'
    },
    {
      id: 'sup-3',
      organizationId: orgId,
      name: 'Embalajes Industriales SRL',
      contactName: 'Roberto Díaz',
      email: 'rdiaz@embalajes-srl.com',
      phone: '+54 11 4777-2233',
      category: 'Packaging',
      notes: 'Entrega semanal con flete incluido.',
      totalPaid: 780000,
      pendingPayment: 0,
      createdAt: '2026-02-05'
    }
  ];

  const products: Product[] = [
    {
      id: 'prod-1',
      organizationId: orgId,
      name: 'Viga IPN 120mm x 6m',
      sku: 'VIG-120-6M',
      category: 'Perfiles Pesados',
      cost: 45000,
      price: 72000,
      marginAmount: 27000,
      marginPercent: 37.5,
      stock: 45,
      status: 'active',
      createdAt: '2026-01-15'
    },
    {
      id: 'prod-2',
      organizationId: orgId,
      name: 'Chapa Galvanizada C25 (1.10 x 3m)',
      sku: 'CHP-GALV-C25',
      category: 'Chapas y Cubiertas',
      cost: 18500,
      price: 29900,
      marginAmount: 11400,
      marginPercent: 38.1,
      stock: 120,
      status: 'active',
      createdAt: '2026-01-15'
    },
    {
      id: 'prod-3',
      organizationId: orgId,
      name: 'Tubo Estructural 40x40x1.6mm',
      sku: 'TUB-EST-4040',
      category: 'Estructurales',
      cost: 12000,
      price: 18500,
      marginAmount: 6500,
      marginPercent: 35.1,
      stock: 200,
      status: 'active',
      createdAt: '2026-01-16'
    },
    {
      id: 'prod-4',
      organizationId: orgId,
      name: 'Electrodos Punta Azul 2.5mm (Caja 5kg)',
      sku: 'ELE-PAZUL-25',
      category: 'Fijaciones y Soldadura',
      cost: 14000,
      price: 24500,
      marginAmount: 10500,
      marginPercent: 42.9,
      stock: 80,
      status: 'active',
      createdAt: '2026-01-20'
    }
  ];

  const sales: Sale[] = [
    {
      id: 'sale-101',
      organizationId: orgId,
      customerId: 'cust-3',
      customerName: 'Estudio Arquitectura V&M',
      saleNumber: 'VTA-00101',
      items: [
        { id: 'item-1', productId: 'prod-1', description: 'Viga IPN 120mm x 6m', quantity: 10, unitPrice: 72000, subtotal: 720000 },
        { id: 'item-2', productId: 'prod-2', description: 'Chapa Galvanizada C25', quantity: 20, unitPrice: 29900, subtotal: 598000 }
      ],
      subtotal: 1318000,
      discount: 0,
      tax: 0,
      total: 1318000,
      status: 'completed',
      paymentStatus: 'paid',
      date: '2026-08-20',
      notes: 'Entrega en obra realizada.',
      createdAt: '2026-08-20T10:30:00.000Z'
    },
    {
      id: 'sale-102',
      organizationId: orgId,
      customerId: 'cust-4',
      customerName: 'Sanitarios San Martín',
      saleNumber: 'VTA-00102',
      items: [
        { id: 'item-3', productId: 'prod-3', description: 'Tubo Estructural 40x40x1.6mm', quantity: 30, unitPrice: 18500, subtotal: 555000 }
      ],
      subtotal: 555000,
      discount: 25000,
      tax: 0,
      total: 530000,
      status: 'confirmed',
      paymentStatus: 'partial',
      date: '2026-08-18',
      notes: 'Anticipo recibido de .000.',
      createdAt: '2026-08-18T14:15:00.000Z'
    },
    {
      id: 'sale-103',
      organizationId: orgId,
      customerId: 'cust-1',
      customerName: 'Carlos Benítez (Ferretería El Progreso)',
      saleNumber: 'VTA-00103',
      items: [
        { id: 'item-4', productId: 'prod-4', description: 'Electrodos Punta Azul 2.5mm', quantity: 15, unitPrice: 24500, subtotal: 367500 }
      ],
      subtotal: 367500,
      discount: 0,
      tax: 0,
      total: 367500,
      status: 'completed',
      paymentStatus: 'partial',
      date: '2026-07-15',
      notes: 'Saldo impago registrado como cuenta a cobrar.',
      createdAt: '2026-07-15T09:00:00.000Z'
    }
  ];

  const expenses: Expense[] = [
    {
      id: 'exp-1',
      organizationId: orgId,
      supplierId: 'sup-1',
      supplierName: 'YPF Combustibles y Logística',
      category: 'Combustible',
      amount: 480000,
      date: '2026-08-22',
      description: 'Carga de flota de 3 camiones reparto semana 3.',
      isAnomaly: true,
      anomalyReason: 'Aumento del 18% respecto al promedio mensual histórico de combustible.',
      createdAt: '2026-08-22T16:00:00.000Z'
    },
    {
      id: 'exp-2',
      organizationId: orgId,
      category: 'Alquiler y Servicios',
      amount: 650000,
      date: '2026-08-05',
      description: 'Alquiler depósito central depósito nave 2.',
      isAnomaly: false,
      createdAt: '2026-08-05T08:00:00.000Z'
    },
    {
      id: 'exp-3',
      organizationId: orgId,
      category: 'Sueldos y Cargas Sociales',
      amount: 1950000,
      date: '2026-08-04',
      description: 'Nómina operativa de planta y choferes.',
      isAnomaly: false,
      createdAt: '2026-08-04T12:00:00.000Z'
    }
  ];

  const receivables: Receivable[] = [
    {
      id: 'rec-1',
      organizationId: orgId,
      customerId: 'cust-1',
      customerName: 'Carlos Benítez (Ferretería El Progreso)',
      saleId: 'sale-103',
      saleNumber: 'VTA-00103',
      amount: 180000,
      balance: 180000,
      dueDate: '2026-08-03',
      status: 'overdue',
      overdueDays: 23,
      notes: 'Factura vencida hace 23 días sin aviso de cancelación.',
      createdAt: '2026-07-15T09:00:00.000Z'
    },
    {
      id: 'rec-2',
      organizationId: orgId,
      customerId: 'cust-4',
      customerName: 'Sanitarios San Martín',
      saleId: 'sale-102',
      saleNumber: 'VTA-00102',
      amount: 120000,
      balance: 120000,
      dueDate: '2026-08-28',
      status: 'pending',
      overdueDays: 0,
      notes: 'Saldo contra entrega.',
      createdAt: '2026-08-18T14:15:00.000Z'
    },
    {
      id: 'rec-3',
      organizationId: orgId,
      customerId: 'cust-3',
      customerName: 'Estudio Arquitectura V&M',
      amount: 450000,
      balance: 450000,
      dueDate: '2026-09-04',
      status: 'pending',
      overdueDays: 0,
      notes: 'Plazo 15 días.',
      createdAt: '2026-08-20T10:30:00.000Z'
    }
  ];

  const payables: Payable[] = [
    {
      id: 'pay-1',
      organizationId: orgId,
      supplierId: 'sup-1',
      supplierName: 'YPF Combustibles y Logística',
      expenseId: 'exp-1',
      amount: 320000,
      balance: 320000,
      dueDate: '2026-08-29',
      status: 'pending',
      notes: 'Vence en 3 días para aplicar descuento.',
      createdAt: '2026-08-22T16:00:00.000Z'
    },
    {
      id: 'pay-2',
      organizationId: orgId,
      supplierId: 'sup-2',
      supplierName: 'Aceros & Metales del Plata',
      amount: 850000,
      balance: 850000,
      dueDate: '2026-09-10',
      status: 'pending',
      notes: 'Pago a 30 días.',
      createdAt: '2026-08-11T09:00:00.000Z'
    }
  ];

  const quotes: Quote[] = [
    {
      id: 'quo-1',
      organizationId: orgId,
      customerId: 'cust-2',
      customerName: 'María Gómez (Constructora Sur)',
      quoteNumber: 'PRE-00201',
      items: [
        { id: 'qitem-1', productId: 'prod-1', description: 'Viga IPN 120mm x 6m', quantity: 25, unitPrice: 70000, subtotal: 1750000 },
        { id: 'qitem-2', productId: 'prod-2', description: 'Chapa Galvanizada C25', quantity: 50, unitPrice: 29000, subtotal: 1450000 }
      ],
      total: 3200000,
      validUntil: '2026-08-28',
      status: 'sent',
      notes: 'Presupuesto para obra residencial Quilmes Oeste. Vence esta semana.',
      createdAt: '2026-08-14T11:00:00.000Z'
    },
    {
      id: 'quo-2',
      organizationId: orgId,
      customerId: 'cust-3',
      customerName: 'Estudio Arquitectura V&M',
      quoteNumber: 'PRE-00202',
      items: [
        { id: 'qitem-3', productId: 'prod-3', description: 'Tubo Estructural 40x40x1.6mm', quantity: 80, unitPrice: 18000, subtotal: 1440000 }
      ],
      total: 1440000,
      validUntil: '2026-08-29',
      status: 'sent',
      notes: 'Presupuesto enviado por email. Requiere seguimiento.',
      createdAt: '2026-08-15T15:00:00.000Z'
    },
    {
      id: 'quo-3',
      organizationId: orgId,
      customerId: 'cust-4',
      customerName: 'Sanitarios San Martín',
      quoteNumber: 'PRE-00203',
      items: [
        { id: 'qitem-4', productId: 'prod-4', description: 'Electrodos Punta Azul 2.5mm', quantity: 40, unitPrice: 23500, subtotal: 940000 }
      ],
      total: 940000,
      validUntil: '2026-08-30',
      status: 'sent',
      notes: 'Vence este fin de semana.',
      createdAt: '2026-08-16T10:00:00.000Z'
    },
    {
      id: 'quo-4',
      organizationId: orgId,
      customerId: 'cust-1',
      customerName: 'Carlos Benítez (Ferretería El Progreso)',
      quoteNumber: 'PRE-00204',
      items: [
        { id: 'qitem-5', productId: 'prod-2', description: 'Chapa Galvanizada C25', quantity: 15, unitPrice: 29900, subtotal: 448500 }
      ],
      total: 448500,
      validUntil: '2026-08-31',
      status: 'sent',
      notes: 'Cotización sujeta a regularización de deuda previa.',
      createdAt: '2026-08-17T12:00:00.000Z'
    }
  ];

  const tasks: Task[] = [
    {
      id: 'tsk-1',
      organizationId: orgId,
      title: 'Llamar a Carlos Benítez por deuda vencida de .000',
      description: 'Deuda originada en VTA-00103 con 23 días de atraso. Ofrecer plan de pago en 2 cuotas semanales.',
      priority: 'high',
      dueDate: '2026-08-26',
      status: 'pending',
      suggestedByAi: true,
      relatedEntityId: 'cust-1',
      relatedEntityType: 'customer',
      createdAt: '2026-08-26T08:00:00.000Z'
    },
    {
      id: 'tsk-2',
      organizationId: orgId,
      title: 'Contactar a María Gómez (Constructora Sur) — 58 días sin compra',
      description: 'Enviar mensaje de seguimiento y consultar sobre el presupuesto PRE-00201 de .200.000 que vence el 28/08.',
      priority: 'high',
      dueDate: '2026-08-27',
      status: 'pending',
      suggestedByAi: true,
      relatedEntityId: 'cust-2',
      relatedEntityType: 'customer',
      createdAt: '2026-08-26T08:00:00.000Z'
    },
    {
      id: 'tsk-3',
      organizationId: orgId,
      title: 'Aprobar pago de combustible a YPF por .000',
      description: 'Vence el 29/08 para aprovechar el 3% de descuento por pronto pago (.600 de ahorro).',
      priority: 'medium',
      dueDate: '2026-08-29',
      status: 'pending',
      suggestedByAi: true,
      relatedEntityId: 'sup-1',
      relatedEntityType: 'expense',
      createdAt: '2026-08-26T08:00:00.000Z'
    }
  ];

  const documents: DocumentRecord[] = [
    {
      id: 'doc-1',
      organizationId: orgId,
      name: 'Factura-A-YPF-Combustibles-082026.pdf',
      fileUrl: '#',
      category: 'invoice',
      relatedSupplierId: 'sup-1',
      docDate: '2026-08-22',
      fileSize: '450 KB',
      createdAt: '2026-08-22'
    },
    {
      id: 'doc-2',
      organizationId: orgId,
      name: 'Contrato-Suministro-Aceros-2026.pdf',
      fileUrl: '#',
      category: 'contract',
      relatedSupplierId: 'sup-2',
      docDate: '2026-01-12',
      expiryDate: '2027-01-12',
      fileSize: '1.2 MB',
      createdAt: '2026-01-12'
    }
  ];

  const recommendations: AIRecommendation[] = [
    {
      id: 'rec-ai-1',
      organizationId: orgId,
      category: 'risk',
      title: 'Carlos tiene una deuda de .000 vencida hace 23 días.',
      explanation: 'El cliente Ferretería El Progreso superó el límite de tolerancia de 15 días. Su historial indica que responde favorablemente a llamados directos del responsable comercial.',
      impact: 'high',
      recommendation: 'Contactar telefónicamente para acordar cancelación o retener nuevos despachos hasta regularizar.',
      actionType: 'view_customer',
      actionPayload: { customerId: 'cust-1' },
      status: 'pending',
      createdAt: '2026-08-26T08:00:00.000Z'
    },
    {
      id: 'rec-ai-2',
      organizationId: orgId,
      category: 'quote',
      title: '4 presupuestos por un valor total de .028.500 vencen esta semana.',
      explanation: 'Presupuestos enviados entre el 14 y 17 de agosto están próximos a caducar. El de mayor impacto es Constructora Sur (.200.000).',
      impact: 'high',
      recommendation: 'Hacer seguimiento comercial antes del viernes 28/08 para cerrar antes de la actualización de listas de precios.',
      actionType: 'view_quote',
      actionPayload: { filter: 'expiring_this_week' },
      status: 'pending',
      createdAt: '2026-08-26T08:00:00.000Z'
    },
    {
      id: 'rec-ai-3',
      organizationId: orgId,
      category: 'expense',
      title: 'Los gastos de combustible aumentaron 18% respecto al mes anterior.',
      explanation: 'El desembolso en transporte y logística alcanzó .000 en la última semana, desviándose del promedio habitual de .000.',
      impact: 'medium',
      recommendation: 'Revisar rutas de entrega de los 3 vehículos y verificar conciliación de tickets cargados.',
      actionType: 'view_expense',
      actionPayload: { category: 'Combustible' },
      status: 'pending',
      createdAt: '2026-08-26T08:00:00.000Z'
    },
    {
      id: 'rec-ai-4',
      organizationId: orgId,
      category: 'customer',
      title: 'María (Constructora Sur) lleva 58 días sin comprar.',
      explanation: 'Compraba con un ciclo promedio de 21 días. Representa el 25% del volumen histórico de ventas del rubro perfiles.',
      impact: 'high',
      recommendation: 'Contactar al cliente con el seguimiento de su presupuesto abierto para reactivar la cuenta.',
      actionType: 'view_customer',
      actionPayload: { customerId: 'cust-2' },
      status: 'pending',
      createdAt: '2026-08-26T08:00:00.000Z'
    }
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'aud-1',
      organizationId: orgId,
      userId: 'usr-1',
      userName: 'Valentín Morales (Dueño)',
      action: 'Creó venta VTA-00101',
      entityType: 'Sale',
      entityId: 'sale-101',
      details: 'Venta por .318.000 a Estudio Arquitectura V&M',
      timestamp: '2026-08-20T10:30:00.000Z'
    },
    {
      id: 'aud-2',
      organizationId: orgId,
      userId: 'usr-1',
      userName: 'Valentín Morales (Dueño)',
      action: 'Registró gasto de Combustible',
      entityType: 'Expense',
      entityId: 'exp-1',
      details: 'Gasto por .000 a YPF Combustibles',
      timestamp: '2026-08-22T16:00:00.000Z'
    },
    {
      id: 'aud-3',
      organizationId: orgId,
      userId: 'usr-ai',
      userName: 'Director IA',
      action: 'Generó Alerta de Riesgo Crediticio',
      entityType: 'Receivable',
      entityId: 'rec-1',
      details: 'Detección automática de mora > 20 días en cliente Carlos Benítez',
      timestamp: '2026-08-26T08:00:00.000Z'
    }
  ];

  return {
    organization,
    customers,
    suppliers,
    products,
    sales,
    expenses,
    receivables,
    payables,
    quotes,
    tasks,
    documents,
    recommendations,
    auditLogs
  };
}
