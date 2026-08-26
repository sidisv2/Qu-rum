import React, { createContext, useContext, useState, useEffect } from "react";
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
  AuditLog,
  NotificationItem,
  User
} from "../types";
import { OrganizationStore, AppState } from "../lib/db/orgStore";

interface OrgContextType {
  currentUser: User | null;
  currentOrg: Organization | null;
  organizations: Organization[];
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
  notifications: NotificationItem[];
  
  setCurrentOrg: (org: Organization) => void;
  createCustomer: (customer: Omit<Customer, "id" | "organizationId" | "createdAt">) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  createSupplier: (supplier: Omit<Supplier, "id" | "organizationId" | "createdAt">) => Supplier;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  createProduct: (product: Omit<Product, "id" | "organizationId" | "createdAt">) => Product;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  createSale: (sale: Omit<Sale, "id" | "organizationId" | "createdAt">) => Sale;
  updateSaleStatus: (id: string, status: Sale["status"]) => void;

  createExpense: (expense: Omit<Expense, "id" | "organizationId" | "createdAt">) => Expense;
  deleteExpense: (id: string) => void;

  recordPaymentReceivable: (receivableId: string, amount: number) => void;
  recordPaymentPayable: (payableId: string, amount: number) => void;

  createQuote: (quote: Omit<Quote, "id" | "organizationId" | "createdAt">) => Quote;
  updateQuoteStatus: (id: string, status: Quote["status"]) => void;

  createTask: (task: Omit<Task, "id" | "organizationId" | "createdAt">) => Task;
  toggleTaskStatus: (id: string) => void;
  deleteTask: (id: string) => void;

  uploadDocument: (doc: Omit<DocumentRecord, "id" | "organizationId" | "createdAt">) => DocumentRecord;
  deleteDocument: (id: string) => void;

  applyAIRecommendation: (id: string) => void;
  dismissAIRecommendation: (id: string) => void;

  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  importBulkData: (entity: "customers" | "suppliers" | "products" | "expenses" | "sales", records: any[]) => number;
  resetDemoData: () => void;
  createNewOrganization: (name: string, taxId: string, industry: string) => Organization;
}

const OrgContext = createContext<OrgContextType | null>(null);

export const OrgProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => OrganizationStore.loadState());

  useEffect(() => {
    OrganizationStore.saveState(state);
  }, [state]);

  const addAuditLog = (action: string, entityType: string, entityId: string, details: string) => {
    if (!state.currentOrg) return;
    const newLog: AuditLog = {
      id: "aud-" + Date.now(),
      organizationId: state.currentOrg.id,
      userId: state.currentUser?.id || "usr-1",
      userName: state.currentUser?.fullName || "Usuario",
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      auditLogs: [newLog, ...prev.auditLogs]
    }));
  };

  const createCustomer: OrgContextType["createCustomer"] = (data) => {
    if (!state.currentOrg) throw new Error("No active org");
    const newCust: Customer = {
      ...data,
      id: "cust-" + Date.now(),
      organizationId: state.currentOrg.id,
      createdAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      customers: [newCust, ...prev.customers]
    }));
    addAuditLog("Creó cliente", "Customer", newCust.id, "Cliente " + newCust.name + " creado.");
    return newCust;
  };

  const updateCustomer: OrgContextType["updateCustomer"] = (id, data) => {
    setState(prev => ({
      ...prev,
      customers: prev.customers.map(c => c.id === id ? { ...c, ...data } : c)
    }));
    addAuditLog("Modificó cliente", "Customer", id, "Datos actualizados.");
  };

  const deleteCustomer: OrgContextType["deleteCustomer"] = (id) => {
    const target = state.customers.find(c => c.id === id);
    setState(prev => ({
      ...prev,
      customers: prev.customers.filter(c => c.id !== id)
    }));
    addAuditLog("Eliminó cliente", "Customer", id, "Cliente " + (target?.name || id) + " eliminado.");
  };

  const createSupplier: OrgContextType["createSupplier"] = (data) => {
    if (!state.currentOrg) throw new Error("No active org");
    const newSup: Supplier = {
      ...data,
      id: "sup-" + Date.now(),
      organizationId: state.currentOrg.id,
      createdAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      suppliers: [newSup, ...prev.suppliers]
    }));
    addAuditLog("Creó proveedor", "Supplier", newSup.id, "Proveedor " + newSup.name + " creado.");
    return newSup;
  };

  const updateSupplier: OrgContextType["updateSupplier"] = (id, data) => {
    setState(prev => ({
      ...prev,
      suppliers: prev.suppliers.map(s => s.id === id ? { ...s, ...data } : s)
    }));
    addAuditLog("Modificó proveedor", "Supplier", id, "Datos de proveedor actualizados.");
  };

  const deleteSupplier: OrgContextType["deleteSupplier"] = (id) => {
    setState(prev => ({
      ...prev,
      suppliers: prev.suppliers.filter(s => s.id !== id)
    }));
    addAuditLog("Eliminó proveedor", "Supplier", id, "Proveedor eliminado.");
  };

  const createProduct: OrgContextType["createProduct"] = (data) => {
    if (!state.currentOrg) throw new Error("No active org");
    const newProd: Product = {
      ...data,
      id: "prod-" + Date.now(),
      organizationId: state.currentOrg.id,
      createdAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      products: [newProd, ...prev.products]
    }));
    addAuditLog("Creó producto", "Product", newProd.id, "Producto " + newProd.name + " creado.");
    return newProd;
  };

  const updateProduct: OrgContextType["updateProduct"] = (id, data) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, ...data } : p)
    }));
    addAuditLog("Modificó producto", "Product", id, "Producto actualizado.");
  };

  const deleteProduct: OrgContextType["deleteProduct"] = (id) => {
    setState(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    }));
    addAuditLog("Eliminó producto", "Product", id, "Producto eliminado.");
  };

  const createSale: OrgContextType["createSale"] = (data) => {
    if (!state.currentOrg) throw new Error("No active org");
    const saleId = "sale-" + Date.now();
    const newSale: Sale = {
      ...data,
      id: saleId,
      organizationId: state.currentOrg.id,
      createdAt: new Date().toISOString()
    };

    let newRec: Receivable | null = null;
    if (newSale.paymentStatus !== "paid") {
      const balance = newSale.paymentStatus === "unpaid" ? newSale.total : newSale.total * 0.5;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 15);
      newRec = {
        id: "rec-" + Date.now(),
        organizationId: state.currentOrg.id,
        customerId: newSale.customerId,
        customerName: newSale.customerName,
        saleId: newSale.id,
        saleNumber: newSale.saleNumber,
        amount: newSale.total,
        balance,
        dueDate: dueDate.toISOString().split("T")[0],
        status: "pending",
        overdueDays: 0,
        notes: "Cuenta a cobrar generada desde venta " + newSale.saleNumber,
        createdAt: new Date().toISOString()
      };
    }

    setState(prev => {
      const updatedCustomers = prev.customers.map(c => {
        if (c.id === newSale.customerId) {
          return {
            ...c,
            totalSpent: c.totalSpent + newSale.total,
            lastPurchaseDate: newSale.date,
            totalPendingDebt: newRec ? c.totalPendingDebt + newRec.balance : c.totalPendingDebt,
            status: (c.status === "inactive" || c.status === "at_risk" ? "active" : c.status) as Customer["status"]
          };
        }
        return c;
      });

      return {
        ...prev,
        customers: updatedCustomers,
        sales: [newSale, ...prev.sales],
        receivables: newRec ? [newRec, ...prev.receivables] : prev.receivables
      };
    });

    addAuditLog("Registró venta", "Sale", newSale.id, "Venta " + newSale.saleNumber + " por valor total de $" + newSale.total);
    return newSale;
  };

  const updateSaleStatus: OrgContextType["updateSaleStatus"] = (id, status) => {
    setState(prev => ({
      ...prev,
      sales: prev.sales.map(s => s.id === id ? { ...s, status } : s)
    }));
    addAuditLog("Actualizó estado de venta", "Sale", id, "Nuevo estado: " + status);
  };

  const createExpense: OrgContextType["createExpense"] = (data) => {
    if (!state.currentOrg) throw new Error("No active org");
    const newExp: Expense = {
      ...data,
      id: "exp-" + Date.now(),
      organizationId: state.currentOrg.id,
      createdAt: new Date().toISOString()
    };

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 10);
    const newPayable: Payable = {
      id: "pay-" + Date.now(),
      organizationId: state.currentOrg.id,
      supplierId: newExp.supplierId || "sup-gen",
      supplierName: newExp.supplierName || "Varios / Servicios",
      expenseId: newExp.id,
      amount: newExp.amount,
      balance: newExp.amount,
      dueDate: dueDate.toISOString().split("T")[0],
      status: "pending",
      notes: "Pago pendiente generado por gasto en " + newExp.category,
      createdAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      expenses: [newExp, ...prev.expenses],
      payables: [newPayable, ...prev.payables]
    }));
    addAuditLog("Registró gasto", "Expense", newExp.id, "Gasto de $" + newExp.amount + " en " + newExp.category);
    return newExp;
  };

  const deleteExpense: OrgContextType["deleteExpense"] = (id) => {
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id)
    }));
    addAuditLog("Eliminó gasto", "Expense", id, "Gasto eliminado");
  };

  const recordPaymentReceivable: OrgContextType["recordPaymentReceivable"] = (receivableId, amount) => {
    setState(prev => {
      const rec = prev.receivables.find(r => r.id === receivableId);
      if (!rec) return prev;

      const newBalance = Math.max(0, rec.balance - amount);
      const newStatus: Receivable["status"] = newBalance === 0 ? "paid" : "partial";

      const updatedReceivables = prev.receivables.map(r => 
        r.id === receivableId ? { ...r, balance: newBalance, status: newStatus } : r
      );

      const updatedCustomers = prev.customers.map(c => {
        if (c.id === rec.customerId) {
          const debt = Math.max(0, c.totalPendingDebt - amount);
          return {
            ...c,
            totalPendingDebt: debt,
            status: (debt === 0 && c.status === "overdue" ? "active" : c.status) as Customer["status"]
          };
        }
        return c;
      });

      return {
        ...prev,
        receivables: updatedReceivables,
        customers: updatedCustomers
      };
    });
    addAuditLog("Registró cobro", "Receivable", receivableId, "Cobro recibido por monto $" + amount);
  };

  const recordPaymentPayable: OrgContextType["recordPaymentPayable"] = (payableId, amount) => {
    setState(prev => {
      const pay = prev.payables.find(p => p.id === payableId);
      if (!pay) return prev;

      const newBalance = Math.max(0, pay.balance - amount);
      const newStatus: Payable["status"] = newBalance === 0 ? "paid" : "partial";

      return {
        ...prev,
        payables: prev.payables.map(p => p.id === payableId ? { ...p, balance: newBalance, status: newStatus } : p)
      };
    });
    addAuditLog("Registró pago a proveedor", "Payable", payableId, "Pago realizado por monto $" + amount);
  };

  const createQuote: OrgContextType["createQuote"] = (data) => {
    if (!state.currentOrg) throw new Error("No active org");
    const newQuote: Quote = {
      ...data,
      id: "quo-" + Date.now(),
      organizationId: state.currentOrg.id,
      createdAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      quotes: [newQuote, ...prev.quotes]
    }));
    addAuditLog("Generó presupuesto", "Quote", newQuote.id, "Presupuesto " + newQuote.quoteNumber + " por $" + newQuote.total);
    return newQuote;
  };

  const updateQuoteStatus: OrgContextType["updateQuoteStatus"] = (id, status) => {
    setState(prev => ({
      ...prev,
      quotes: prev.quotes.map(q => q.id === id ? { ...q, status } : q)
    }));
    addAuditLog("Cambió estado de presupuesto", "Quote", id, "Nuevo estado: " + status);
  };

  const createTask: OrgContextType["createTask"] = (data) => {
    if (!state.currentOrg) throw new Error("No active org");
    const newTask: Task = {
      ...data,
      id: "tsk-" + Date.now(),
      organizationId: state.currentOrg.id,
      createdAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      tasks: [newTask, ...prev.tasks]
    }));
    addAuditLog("Creó tarea", "Task", newTask.id, "Tarea " + newTask.title + " creada.");
    return newTask;
  };

  const toggleTaskStatus: OrgContextType["toggleTaskStatus"] = (id) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id === id) {
          const nextStatus: Task["status"] = t.status === "completed" ? "pending" : "completed";
          return { ...t, status: nextStatus };
        }
        return t;
      })
    }));
  };

  const deleteTask: OrgContextType["deleteTask"] = (id) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id)
    }));
    addAuditLog("Eliminó tarea", "Task", id, "Tarea eliminada.");
  };

  const uploadDocument: OrgContextType["uploadDocument"] = (data) => {
    if (!state.currentOrg) throw new Error("No active org");
    const newDoc: DocumentRecord = {
      ...data,
      id: "doc-" + Date.now(),
      organizationId: state.currentOrg.id,
      createdAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      documents: [newDoc, ...prev.documents]
    }));
    addAuditLog("Subió documento", "Document", newDoc.id, "Documento " + newDoc.name + " cargado.");
    return newDoc;
  };

  const deleteDocument: OrgContextType["deleteDocument"] = (id) => {
    setState(prev => ({
      ...prev,
      documents: prev.documents.filter(d => d.id !== id)
    }));
    addAuditLog("Eliminó documento", "Document", id, "Documento eliminado.");
  };

  const applyAIRecommendation: OrgContextType["applyAIRecommendation"] = (id) => {
    const rec = state.recommendations.find(r => r.id === id);
    if (!rec) return;

    const task: Task = {
      id: "tsk-" + Date.now(),
      organizationId: state.currentOrg?.id || "org-demo-100",
      title: "[IA] Acción: " + rec.title,
      description: rec.recommendation,
      priority: rec.impact === "high" ? "high" : "medium",
      dueDate: new Date().toISOString().split("T")[0],
      status: "pending",
      suggestedByAi: true,
      createdAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      tasks: [task, ...prev.tasks],
      recommendations: prev.recommendations.map(r => r.id === id ? { ...r, status: "applied" } : r)
    }));

    addAuditLog("Aplicó recomendación de IA", "AIRecommendation", id, "Acción ejecutada: " + rec.title);
  };

  const dismissAIRecommendation: OrgContextType["dismissAIRecommendation"] = (id) => {
    setState(prev => ({
      ...prev,
      recommendations: prev.recommendations.map(r => r.id === id ? { ...r, status: "dismissed" } : r)
    }));
    addAuditLog("Descartó recomendación de IA", "AIRecommendation", id, "Recomendación descartada.");
  };

  const markNotificationAsRead: OrgContextType["markNotificationAsRead"] = (id) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
    }));
  };

  const markAllNotificationsAsRead: OrgContextType["markAllNotificationsAsRead"] = () => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, isRead: true }))
    }));
  };

  const importBulkData: OrgContextType["importBulkData"] = (entity, records) => {
    if (!state.currentOrg) return 0;
    const orgId = state.currentOrg.id;
    let count = 0;

    setState(prev => {
      const copy = { ...prev };
      if (entity === "customers") {
        const mapped: Customer[] = records.map((r, i) => ({
          id: "cust-imp-" + Date.now() + "-" + i,
          organizationId: orgId,
          name: r.name || r.Nombre || "Sin nombre",
          email: r.email || r.Email || "",
          phone: r.phone || r.Telefono || "",
          status: "active",
          totalSpent: Number(r.totalSpent || 0),
          totalPendingDebt: Number(r.totalPendingDebt || 0),
          createdAt: new Date().toISOString()
        }));
        copy.customers = [...mapped, ...copy.customers];
        count = mapped.length;
      } else if (entity === "products") {
        const mapped: Product[] = records.map((r, i) => ({
          id: "prod-imp-" + Date.now() + "-" + i,
          organizationId: orgId,
          name: r.name || r.Nombre || "Producto importado",
          sku: r.sku || r.Codigo || ("SKU-" + Date.now() + "-" + i),
          category: r.category || r.Categoria || "General",
          cost: Number(r.cost || r.Costo || 0),
          price: Number(r.price || r.Precio || 0),
          marginAmount: Number(r.price || 0) - Number(r.cost || 0),
          marginPercent: Number(r.price) > 0 ? ((Number(r.price) - Number(r.cost)) / Number(r.price)) * 100 : 0,
          status: "active",
          createdAt: new Date().toISOString()
        }));
        copy.products = [...mapped, ...copy.products];
        count = mapped.length;
      }
      return copy;
    });

    addAuditLog("Importó " + count + " " + entity + " vía CSV", "Import", entity, count + " registros creados");
    return count;
  };

  const resetDemoData = () => {
    const fresh = OrganizationStore.resetToDemo();
    setState(fresh);
  };

  const createNewOrganization = (name: string, taxId: string, industry: string) => {
    const newOrg: Organization = {
      id: "org-" + Date.now(),
      name,
      taxId,
      currency: "ARS",
      currencySymbol: "$",
      industry,
      isDemo: false,
      createdAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      currentOrg: newOrg,
      organizations: [newOrg, ...prev.organizations],
      customers: [],
      suppliers: [],
      products: [],
      sales: [],
      expenses: [],
      receivables: [],
      payables: [],
      quotes: [],
      tasks: [],
      documents: [],
      recommendations: [],
      auditLogs: [{
        id: "aud-" + Date.now(),
        organizationId: newOrg.id,
        userId: prev.currentUser?.id || "usr-1",
        userName: prev.currentUser?.fullName || "Usuario",
        action: "Creó organización",
        entityType: "Organization",
        entityId: newOrg.id,
        details: "Organización " + newOrg.name + " creada exitosamente.",
        timestamp: new Date().toISOString()
      }]
    }));

    return newOrg;
  };

  return (
    <OrgContext.Provider value={{
      currentUser: state.currentUser,
      currentOrg: state.currentOrg,
      organizations: state.organizations,
      customers: state.customers,
      suppliers: state.suppliers,
      products: state.products,
      sales: state.sales,
      expenses: state.expenses,
      receivables: state.receivables,
      payables: state.payables,
      quotes: state.quotes,
      tasks: state.tasks,
      documents: state.documents,
      recommendations: state.recommendations,
      auditLogs: state.auditLogs,
      notifications: state.notifications,
      setCurrentOrg: (org) => setState(prev => ({ ...prev, currentOrg: org })),
      createCustomer,
      updateCustomer,
      deleteCustomer,
      createSupplier,
      updateSupplier,
      deleteSupplier,
      createProduct,
      updateProduct,
      deleteProduct,
      createSale,
      updateSaleStatus,
      createExpense,
      deleteExpense,
      recordPaymentReceivable,
      recordPaymentPayable,
      createQuote,
      updateQuoteStatus,
      createTask,
      toggleTaskStatus,
      deleteTask,
      uploadDocument,
      deleteDocument,
      applyAIRecommendation,
      dismissAIRecommendation,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      importBulkData,
      resetDemoData,
      createNewOrganization
    }}>
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => {
  const context = useContext(OrgContext);
  if (!context) throw new Error("useOrg must be used within an OrgProvider");
  return context;
};
