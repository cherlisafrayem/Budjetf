import { useState, useMemo, useRef, useEffect } from "react";

// ─── SUPABASE SETUP (بدون أي مكتبة خارجية — fetch مباشر) ─────────────────────
const SUPABASE_URL = "https://zplhjnnpgbbywnbaveaz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZmWhQLRY5ALF-9TDR3h0cw_0qwg2Z3Y";

async function supaSignUp(email, password, meta){
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { "Content-Type":"application/json", "apikey": SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password, data: meta })
  });
  const data = await res.json();
  if(!res.ok) throw new Error(data.msg || data.error_description || "Signup failed");
  return data; // قد يحتوي access_token لو "Confirm email" متعطل، أو يكون بدون session لو مفعّل
}
async function supaSignIn(email, password){
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type":"application/json", "apikey": SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if(!res.ok) throw new Error(data.error_description || data.msg || "Login failed");
  return data; // { access_token, user, ... }
}
async function supaGetTransactions(token){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/transactions?select=*&order=created_at.desc`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
  });
  if(!res.ok){
    const e = await res.json().catch(()=>({}));
    return { ok:false, error: `[${res.status}] ${e.message || e.msg || JSON.stringify(e)}` };
  }
  return { ok:true, data: await res.json() };
}
async function supaInsertTransaction(token, row){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`,
      "Content-Type":"application/json", "Prefer":"return=minimal" },
    body: JSON.stringify(row)
  });
  if(!res.ok){
    const e = await res.json().catch(()=>({}));
    return { ok:false, error: `[${res.status}] ${e.message || e.msg || e.error_description || JSON.stringify(e)}` };
  }
  return { ok:true };
}

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const LANGS = {
  en: { flag:"🇺🇸", name:"English",  dir:"ltr" },
  es: { flag:"🇪🇸", name:"Español",  dir:"ltr" },
  pt: { flag:"🇧🇷", name:"Português",dir:"ltr" },
  fr: { flag:"🇫🇷", name:"Français", dir:"ltr" },
  ar: { flag:"🇸🇦", name:"العربية",  dir:"rtl" },
};

const T = {
  en: {
    appName:"MyBudget", appSlogan:"Full control of your money for $1/month",
    login:"Login", signup:"Sign Up", enterEmail:"Email address", enterPass:"Password",
    yourName:"Your name", choosePlan:"Choose your plan:", free:"Free", pro:"⭐ Pro",
    freePrice:"$0 / month", proPrice:"$1 / month", freeFeature:"Basic", proFeature:"All features",
    loginBtn:"Login →", signupBtn:"Create Account →", loading:"Loading...",
    demoNote:"Enter any details to try the demo account",
    monthYear:"June 2026 👋", welcome:"Welcome,",
    addTx:"+ Transaction", settings:"⚙️",
    addTxTitle:"➕ Add Transaction", income:"Income", expense:"Expense",
    description:"Description", amount:"Amount $", day:"Day (1-31)", month:"Month", category:"Category",
    save:"Save ✓", cancel:"Cancel", addTxErr1:"Enter a description", addTxErr2:"Enter a valid amount", addTxErr3:"Enter a valid day (1-31)",
    summary:"Month Summary ✨", totalIncome:"Total Income", totalExpenses:"Total Expenses",
    netSurplus:"Net Surplus", savingsRate:"Savings Rate",
    monthlyBalance:"Monthly Balance", surplusWarning:"⚠️ Warning: expenses exceed income",
    surplusLabel:"✨ Net Surplus", deficitBadge:"❌ Budget Deficit", healthyBadge:"✅ Healthy Budget",
    incomeLabel:"Income", spendingLabel:"Spending", savedLabel:"Saved",
    surplusOfIncome:"Surplus as % of income",
    incomeVsExpenses:"Income vs Expenses — Last 6 Months",
    netWorth:"Net Worth", currentValue:"Current Value",
    spendingBreakdown:"Spending Breakdown", thisMonth:"This Month", twoMonths:"2 Months", threeMonths:"3 Months", sixMonths:"6 Months",
    noExpenses:"No expenses in this period",
    savingsGoals:"Savings Goals", activeGoals:"active goals",
    noGoals:"No goals — add from Settings ⚙️",
    debtPayoff:"Debt Payoff", totalRemaining:"Total Remaining", paidOff:"paid off",
    noDebts:"No debts — add from Settings ⚙️",
    upcomingBills:"Upcoming Bills", dueThisMonth:"Due this month",
    noBills:"No bills — add from Settings ⚙️",
    recentTransactions:"Recent Transactions",
    progress:"Progress", remaining:"Remaining", monthlyAdd:"Monthly Addition", monthsLeft:"Months Left",
    goalProgress:"📈 Goal Progress Over Months", progressLog:"📅 Progress Log",
    paid:"Paid", upcoming:"Upcoming", overdue:"Overdue",
    paidLabel:"✓ Paid", upcomingLabel:"⏰ Upcoming", overdueLabel:"⚠ Overdue",
    dueDay:"Due day", ofEveryMonth:"of every month",
    updateStatus:"Update Status", debtRemaining:"remaining", interestRate:"Interest Rate",
    paidAmount:"Paid", paymentLog:"📅 Payment Log",
    debtProgress:"📉 Debt Progress Over Months", repaymentPct:"Repayment %",
    settingsTitle:"⚙️ Settings", cats:"Categories", goals:"Goals", debts:"Debts", bills:"Bills",
    expenseCats:"Expense Categories", incomeCats:"Income Categories",
    newExpenseCat:"New expense category", newIncomeCat:"New income category", addBtn:"+ Add",
    savingsGoalsTitle:"Savings Goals", newGoalTitle:"+ New Goal",
    goalName:"Goal name", targetAmount:"Target Amount", currentAmount:"Current Amount",
    addGoal:"Add ✓", editGoal:"Edit", deleteGoal:"Delete", saveBtn:"Save ✓",
    debtsTitle:"Debts", newDebtTitle:"+ New Debt",
    debtName:"Debt name", totalAmount:"Total", leftAmount:"Remaining", aprPct:"APR%",
    addDebt:"Add ✓",
    billsTitle:"Monthly Bills", newBillTitle:"+ New Bill",
    billName:"Bill name", billAmount:"Amount", dueDate:"Due Day", billStatus:"Status",
    addBill:"+ Add Bill",
    closeBtn:"✕ Close", copyright:"MyBudget © 2026",
    jun:"Jun",
  },
  es: {
    appName:"MiPresupuesto", appSlogan:"Control total de tu dinero por $1/mes",
    login:"Iniciar Sesión", signup:"Crear Cuenta", enterEmail:"Correo electrónico", enterPass:"Contraseña",
    yourName:"Tu nombre", choosePlan:"Elige tu plan:", free:"Gratis", pro:"⭐ Pro",
    freePrice:"$0 / mes", proPrice:"$1 / mes", freeFeature:"Básico", proFeature:"Todo incluido",
    loginBtn:"Entrar →", signupBtn:"Crear Cuenta →", loading:"Cargando...",
    demoNote:"Ingresa cualquier dato para probar la cuenta demo",
    monthYear:"Junio 2026 👋", welcome:"Bienvenido,",
    addTx:"+ Transacción", settings:"⚙️",
    addTxTitle:"➕ Añadir Transacción", income:"Ingreso", expense:"Gasto",
    description:"Descripción", amount:"Monto $", day:"Día (1-31)", month:"Mes", category:"Categoría",
    save:"Guardar ✓", cancel:"Cancelar", addTxErr1:"Ingresa una descripción", addTxErr2:"Ingresa un monto válido", addTxErr3:"Ingresa un día válido (1-31)",
    summary:"Resumen del Mes ✨", totalIncome:"Ingresos Totales", totalExpenses:"Gastos Totales",
    netSurplus:"Superávit Neto", savingsRate:"Tasa de Ahorro",
    monthlyBalance:"Balance Mensual", surplusWarning:"⚠️ Advertencia: gastos superan ingresos",
    surplusLabel:"✨ Superávit Neto", deficitBadge:"❌ Déficit Presupuestario", healthyBadge:"✅ Presupuesto Saludable",
    incomeLabel:"Ingresos", spendingLabel:"Gastos", savedLabel:"Ahorrado",
    surplusOfIncome:"Superávit como % del ingreso",
    incomeVsExpenses:"Ingresos vs Gastos — Últimos 6 Meses",
    netWorth:"Patrimonio Neto", currentValue:"Valor Actual",
    spendingBreakdown:"Desglose de Gastos", thisMonth:"Este Mes", twoMonths:"2 Meses", threeMonths:"3 Meses", sixMonths:"6 Meses",
    noExpenses:"Sin gastos en este período",
    savingsGoals:"Metas de Ahorro", activeGoals:"metas activas",
    noGoals:"Sin metas — añade desde Configuración ⚙️",
    debtPayoff:"Pago de Deudas", totalRemaining:"Total Restante", paidOff:"pagado",
    noDebts:"Sin deudas — añade desde Configuración ⚙️",
    upcomingBills:"Próximos Pagos", dueThisMonth:"Por pagar este mes",
    noBills:"Sin facturas — añade desde Configuración ⚙️",
    recentTransactions:"Transacciones Recientes",
    progress:"Progreso", remaining:"Restante", monthlyAdd:"Aporte Mensual", monthsLeft:"Meses Restantes",
    goalProgress:"📈 Progreso de la Meta", progressLog:"📅 Registro de Progreso",
    paid:"Pagado", upcoming:"Próximo", overdue:"Vencido",
    paidLabel:"✓ Pagado", upcomingLabel:"⏰ Próximo", overdueLabel:"⚠ Vencido",
    dueDay:"Día de vencimiento", ofEveryMonth:"de cada mes",
    updateStatus:"Actualizar Estado", debtRemaining:"restante", interestRate:"Tasa de Interés",
    paidAmount:"Pagado", paymentLog:"📅 Registro de Pagos",
    debtProgress:"📉 Progreso de Deuda", repaymentPct:"% Pagado",
    settingsTitle:"⚙️ Configuración", cats:"Categorías", goals:"Metas", debts:"Deudas", bills:"Facturas",
    expenseCats:"Categorías de Gastos", incomeCats:"Categorías de Ingresos",
    newExpenseCat:"Nueva categoría de gasto", newIncomeCat:"Nueva categoría de ingreso", addBtn:"+ Añadir",
    savingsGoalsTitle:"Metas de Ahorro", newGoalTitle:"+ Nueva Meta",
    goalName:"Nombre de la meta", targetAmount:"Monto Objetivo", currentAmount:"Monto Actual",
    addGoal:"Añadir ✓", editGoal:"Editar", deleteGoal:"Eliminar", saveBtn:"Guardar ✓",
    debtsTitle:"Deudas", newDebtTitle:"+ Nueva Deuda",
    debtName:"Nombre de la deuda", totalAmount:"Total", leftAmount:"Restante", aprPct:"APR%",
    addDebt:"Añadir ✓",
    billsTitle:"Facturas Mensuales", newBillTitle:"+ Nueva Factura",
    billName:"Nombre de la factura", billAmount:"Monto", dueDate:"Día de Vencimiento", billStatus:"Estado",
    addBill:"+ Añadir Factura",
    closeBtn:"✕ Cerrar", copyright:"MiPresupuesto © 2026",
    jun:"Jun",
  },
  pt: {
    appName:"MeuOrçamento", appSlogan:"Controle total do seu dinheiro por $1/mês",
    login:"Entrar", signup:"Cadastrar", enterEmail:"E-mail", enterPass:"Senha",
    yourName:"Seu nome", choosePlan:"Escolha seu plano:", free:"Grátis", pro:"⭐ Pro",
    freePrice:"$0 / mês", proPrice:"$1 / mês", freeFeature:"Básico", proFeature:"Todos recursos",
    loginBtn:"Entrar →", signupBtn:"Criar Conta →", loading:"Carregando...",
    demoNote:"Digite qualquer dado para testar a conta demo",
    monthYear:"Junho 2026 👋", welcome:"Bem-vindo,",
    addTx:"+ Transação", settings:"⚙️",
    addTxTitle:"➕ Adicionar Transação", income:"Receita", expense:"Despesa",
    description:"Descrição", amount:"Valor $", day:"Dia (1-31)", month:"Mês", category:"Categoria",
    save:"Salvar ✓", cancel:"Cancelar", addTxErr1:"Insira uma descrição", addTxErr2:"Insira um valor válido", addTxErr3:"Insira um dia válido (1-31)",
    summary:"Resumo do Mês ✨", totalIncome:"Receita Total", totalExpenses:"Despesas Totais",
    netSurplus:"Saldo Líquido", savingsRate:"Taxa de Poupança",
    monthlyBalance:"Balanço Mensal", surplusWarning:"⚠️ Atenção: despesas superam receitas",
    surplusLabel:"✨ Saldo Líquido", deficitBadge:"❌ Déficit Orçamentário", healthyBadge:"✅ Orçamento Saudável",
    incomeLabel:"Receita", spendingLabel:"Despesas", savedLabel:"Poupado",
    surplusOfIncome:"Saldo como % da receita",
    incomeVsExpenses:"Receita vs Despesas — Últimos 6 Meses",
    netWorth:"Patrimônio Líquido", currentValue:"Valor Atual",
    spendingBreakdown:"Distribuição de Gastos", thisMonth:"Este Mês", twoMonths:"2 Meses", threeMonths:"3 Meses", sixMonths:"6 Meses",
    noExpenses:"Sem despesas neste período",
    savingsGoals:"Metas de Poupança", activeGoals:"metas ativas",
    noGoals:"Sem metas — adicione em Configurações ⚙️",
    debtPayoff:"Pagamento de Dívidas", totalRemaining:"Total Restante", paidOff:"pago",
    noDebts:"Sem dívidas — adicione em Configurações ⚙️",
    upcomingBills:"Próximas Contas", dueThisMonth:"A pagar este mês",
    noBills:"Sem contas — adicione em Configurações ⚙️",
    recentTransactions:"Transações Recentes",
    progress:"Progresso", remaining:"Restante", monthlyAdd:"Adição Mensal", monthsLeft:"Meses Restantes",
    goalProgress:"📈 Progresso da Meta", progressLog:"📅 Registro de Progresso",
    paid:"Pago", upcoming:"Próximo", overdue:"Atrasado",
    paidLabel:"✓ Pago", upcomingLabel:"⏰ Próximo", overdueLabel:"⚠ Atrasado",
    dueDay:"Dia de vencimento", ofEveryMonth:"de cada mês",
    updateStatus:"Atualizar Status", debtRemaining:"restante", interestRate:"Taxa de Juros",
    paidAmount:"Pago", paymentLog:"📅 Registro de Pagamentos",
    debtProgress:"📉 Progresso da Dívida", repaymentPct:"% Pago",
    settingsTitle:"⚙️ Configurações", cats:"Categorias", goals:"Metas", debts:"Dívidas", bills:"Contas",
    expenseCats:"Categorias de Despesas", incomeCats:"Categorias de Receitas",
    newExpenseCat:"Nova categoria de despesa", newIncomeCat:"Nova categoria de receita", addBtn:"+ Adicionar",
    savingsGoalsTitle:"Metas de Poupança", newGoalTitle:"+ Nova Meta",
    goalName:"Nome da meta", targetAmount:"Valor Alvo", currentAmount:"Valor Atual",
    addGoal:"Adicionar ✓", editGoal:"Editar", deleteGoal:"Excluir", saveBtn:"Salvar ✓",
    debtsTitle:"Dívidas", newDebtTitle:"+ Nova Dívida",
    debtName:"Nome da dívida", totalAmount:"Total", leftAmount:"Restante", aprPct:"APR%",
    addDebt:"Adicionar ✓",
    billsTitle:"Contas Mensais", newBillTitle:"+ Nova Conta",
    billName:"Nome da conta", billAmount:"Valor", dueDate:"Dia de Vencimento", billStatus:"Status",
    addBill:"+ Adicionar Conta",
    closeBtn:"✕ Fechar", copyright:"MeuOrçamento © 2026",
    jun:"Jun",
  },
  fr: {
    appName:"MonBudget", appSlogan:"Contrôle total de vos finances pour 1$/mois",
    login:"Connexion", signup:"Inscription", enterEmail:"Adresse e-mail", enterPass:"Mot de passe",
    yourName:"Votre prénom", choosePlan:"Choisissez votre plan :", free:"Gratuit", pro:"⭐ Pro",
    freePrice:"0$ / mois", proPrice:"1$ / mois", freeFeature:"Basique", proFeature:"Tout inclus",
    loginBtn:"Connexion →", signupBtn:"Créer un compte →", loading:"Chargement...",
    demoNote:"Entrez n'importe quelles données pour tester le compte démo",
    monthYear:"Juin 2026 👋", welcome:"Bonjour,",
    addTx:"+ Transaction", settings:"⚙️",
    addTxTitle:"➕ Ajouter une Transaction", income:"Revenu", expense:"Dépense",
    description:"Description", amount:"Montant $", day:"Jour (1-31)", month:"Mois", category:"Catégorie",
    save:"Enregistrer ✓", cancel:"Annuler", addTxErr1:"Entrez une description", addTxErr2:"Entrez un montant valide", addTxErr3:"Entrez un jour valide (1-31)",
    summary:"Résumé du Mois ✨", totalIncome:"Revenus Totaux", totalExpenses:"Dépenses Totales",
    netSurplus:"Solde Net", savingsRate:"Taux d'Épargne",
    monthlyBalance:"Bilan Mensuel", surplusWarning:"⚠️ Attention : vos dépenses dépassent vos revenus",
    surplusLabel:"✨ Solde Net", deficitBadge:"❌ Déficit Budgétaire", healthyBadge:"✅ Budget Sain",
    incomeLabel:"Revenus", spendingLabel:"Dépenses", savedLabel:"Épargné",
    surplusOfIncome:"Solde en % du revenu",
    incomeVsExpenses:"Revenus vs Dépenses — 6 Derniers Mois",
    netWorth:"Patrimoine Net", currentValue:"Valeur Actuelle",
    spendingBreakdown:"Répartition des Dépenses", thisMonth:"Ce Mois", twoMonths:"2 Mois", threeMonths:"3 Mois", sixMonths:"6 Mois",
    noExpenses:"Aucune dépense sur cette période",
    savingsGoals:"Objectifs d'Épargne", activeGoals:"objectifs actifs",
    noGoals:"Aucun objectif — ajoutez depuis Paramètres ⚙️",
    debtPayoff:"Remboursement de Dettes", totalRemaining:"Total Restant", paidOff:"remboursé",
    noDebts:"Aucune dette — ajoutez depuis Paramètres ⚙️",
    upcomingBills:"Factures à Venir", dueThisMonth:"À payer ce mois",
    noBills:"Aucune facture — ajoutez depuis Paramètres ⚙️",
    recentTransactions:"Transactions Récentes",
    progress:"Progrès", remaining:"Restant", monthlyAdd:"Ajout Mensuel", monthsLeft:"Mois Restants",
    goalProgress:"📈 Progression de l'Objectif", progressLog:"📅 Journal de Progression",
    paid:"Payé", upcoming:"À venir", overdue:"En retard",
    paidLabel:"✓ Payé", upcomingLabel:"⏰ À venir", overdueLabel:"⚠ En retard",
    dueDay:"Jour d'échéance", ofEveryMonth:"de chaque mois",
    updateStatus:"Mettre à jour le statut", debtRemaining:"restant", interestRate:"Taux d'Intérêt",
    paidAmount:"Payé", paymentLog:"📅 Journal des Paiements",
    debtProgress:"📉 Progression de la Dette", repaymentPct:"% Remboursé",
    settingsTitle:"⚙️ Paramètres", cats:"Catégories", goals:"Objectifs", debts:"Dettes", bills:"Factures",
    expenseCats:"Catégories de Dépenses", incomeCats:"Catégories de Revenus",
    newExpenseCat:"Nouvelle catégorie de dépense", newIncomeCat:"Nouvelle catégorie de revenu", addBtn:"+ Ajouter",
    savingsGoalsTitle:"Objectifs d'Épargne", newGoalTitle:"+ Nouvel Objectif",
    goalName:"Nom de l'objectif", targetAmount:"Montant Cible", currentAmount:"Montant Actuel",
    addGoal:"Ajouter ✓", editGoal:"Modifier", deleteGoal:"Supprimer", saveBtn:"Enregistrer ✓",
    debtsTitle:"Dettes", newDebtTitle:"+ Nouvelle Dette",
    debtName:"Nom de la dette", totalAmount:"Total", leftAmount:"Restant", aprPct:"APR%",
    addDebt:"Ajouter ✓",
    billsTitle:"Factures Mensuelles", newBillTitle:"+ Nouvelle Facture",
    billName:"Nom de la facture", billAmount:"Montant", dueDate:"Jour d'Échéance", billStatus:"Statut",
    addBill:"+ Ajouter une Facture",
    closeBtn:"✕ Fermer", copyright:"MonBudget © 2026",
    jun:"Juin",
  },
  ar: {
    appName:"ميزانيتي", appSlogan:"تحكم كامل بأموالك بدولار واحد فقط",
    login:"دخول", signup:"حساب جديد", enterEmail:"البريد الإلكتروني", enterPass:"كلمة المرور",
    yourName:"اسمك الكريم", choosePlan:"اختر خطتك:", free:"مجاني", pro:"⭐ برو",
    freePrice:"$0 / شهر", proPrice:"$1 / شهر", freeFeature:"أساسي", proFeature:"كل الميزات",
    loginBtn:"دخول ←", signupBtn:"إنشاء حساب ←", loading:"⏳ جاري...",
    demoNote:"أدخل أي بيانات لتجربة الحساب التجريبي",
    monthYear:"يونيو 2026 👋", welcome:"مرحباً،",
    addTx:"+ معاملة", settings:"⚙️",
    addTxTitle:"➕ إضافة معاملة", income:"دخل", expense:"مصروف",
    description:"الوصف", amount:"المبلغ $", day:"اليوم (1-31)", month:"الشهر", category:"الفئة",
    save:"حفظ ✓", cancel:"إلغاء", addTxErr1:"أدخل وصف المعاملة", addTxErr2:"أدخل مبلغاً صحيحاً", addTxErr3:"أدخل يوماً صحيحاً (1-31)",
    summary:"ملخص الشهر ✨", totalIncome:"إجمالي الدخل", totalExpenses:"إجمالي المصاريف",
    netSurplus:"الفائض الصافي", savingsRate:"معدل الادخار",
    monthlyBalance:"الرصيد الشهري", surplusWarning:"⚠️ تحذير: مصاريفك أعلى من دخلك",
    surplusLabel:"✨ الفائض الصافي", deficitBadge:"❌ عجز في الميزانية", healthyBadge:"✅ ميزانية صحية",
    incomeLabel:"الدخل", spendingLabel:"الإنفاق", savedLabel:"المدخر",
    surplusOfIncome:"نسبة الفائض من الدخل",
    incomeVsExpenses:"الدخل مقابل المصاريف — آخر 6 أشهر",
    netWorth:"صافي الثروة", currentValue:"القيمة الحالية",
    spendingBreakdown:"توزيع المصاريف", thisMonth:"هذا الشهر", twoMonths:"شهرين", threeMonths:"3 أشهر", sixMonths:"6 أشهر",
    noExpenses:"لا توجد مصاريف في هذه الفترة",
    savingsGoals:"أهداف الادخار", activeGoals:"أهداف نشطة",
    noGoals:"لا توجد أهداف — أضف من الإعدادات ⚙️",
    debtPayoff:"سداد الديون", totalRemaining:"إجمالي المتبقي", paidOff:"مسدد",
    noDebts:"لا توجد ديون — أضف من الإعدادات ⚙️",
    upcomingBills:"الفواتير القادمة", dueThisMonth:"المستحق هذا الشهر",
    noBills:"لا توجد فواتير — أضف من الإعدادات ⚙️",
    recentTransactions:"آخر المعاملات",
    progress:"التقدم", remaining:"المتبقي", monthlyAdd:"الإضافة الشهرية", monthsLeft:"الأشهر المتبقية",
    goalProgress:"📈 تطور الهدف خلال الأشهر", progressLog:"📅 سجل التقدم",
    paid:"مدفوع", upcoming:"قادم", overdue:"متأخر",
    paidLabel:"✓ مدفوع", upcomingLabel:"⏰ قادم", overdueLabel:"⚠ متأخر",
    dueDay:"يستحق يوم", ofEveryMonth:"من كل شهر",
    updateStatus:"تغيير الحالة", debtRemaining:"متبقي", interestRate:"نسبة الفائدة",
    paidAmount:"المسدد", paymentLog:"📅 سجل السداد",
    debtProgress:"📉 تطور الدين خلال الأشهر", repaymentPct:"% مسدد",
    settingsTitle:"⚙️ الإعدادات", cats:"الفئات", goals:"الأهداف", debts:"الديون", bills:"الفواتير",
    expenseCats:"فئات المصاريف", incomeCats:"فئات الدخل",
    newExpenseCat:"فئة مصروف جديدة", newIncomeCat:"فئة دخل جديدة", addBtn:"+ إضافة",
    savingsGoalsTitle:"أهداف الادخار", newGoalTitle:"+ هدف جديد",
    goalName:"اسم الهدف", targetAmount:"المبلغ المستهدف", currentAmount:"المبلغ الحالي",
    addGoal:"إضافة ✓", editGoal:"تعديل", deleteGoal:"حذف", saveBtn:"حفظ ✓",
    debtsTitle:"الديون", newDebtTitle:"+ دين جديد",
    debtName:"اسم الدين", totalAmount:"الإجمالي", leftAmount:"المتبقي", aprPct:"APR%",
    addDebt:"إضافة ✓",
    billsTitle:"الفواتير الشهرية", newBillTitle:"+ فاتورة جديدة",
    billName:"اسم الفاتورة", billAmount:"المبلغ", dueDate:"يوم الاستحقاق", billStatus:"الحالة",
    addBill:"+ إضافة الفاتورة",
    closeBtn:"✕ إغلاق", copyright:"ميزانيتي © 2026",
    jun:"يون",
  },
};

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const MONTHS_BY_LANG = { en:MONTHS_EN, es:MONTHS_ES, pt:MONTHS_PT, fr:MONTHS_FR, ar:MONTHS_AR };

const NOW_MONTH = 5;

const DEFAULT_CATS = {
  expense: ["Housing","Food","Transport","Utilities","Lifestyle","Health","Education","Entertainment","Other"],
  income:  ["Salary","Freelance","Investment","Gift","Other"],
};

const CAT_COLORS = {
  "Housing":"#1a472a","Food":"#3b82f6","Transport":"#f59e0b","Utilities":"#ef4444",
  "Lifestyle":"#8b5cf6","Health":"#06b6d4","Education":"#f97316","Entertainment":"#ec4899",
  "Other":"#6b7280","Salary":"#16a34a","Freelance":"#0891b2","Investment":"#7c3aed","Gift":"#db2777",
};

const HIST = [
  { month:0, income:7800, expenses:5600 },
  { month:1, income:7900, expenses:5400 },
  { month:2, income:8100, expenses:5700 },
  { month:3, income:7950, expenses:5200 },
  { month:4, income:8200, expenses:5500 },
];

const INIT_TX = [
  { id:1,  name:"June Salary",      cat:"Salary",       type:"income",  amount:8450, month:5, day:1  },
  { id:2,  name:"Rent",             cat:"Housing",      type:"expense", amount:1950, month:5, day:1  },
  { id:3,  name:"Groceries",        cat:"Food",         type:"expense", amount:320,  month:5, day:3  },
  { id:4,  name:"Dinner Out",       cat:"Food",         type:"expense", amount:85,   month:5, day:5  },
  { id:5,  name:"Electricity",      cat:"Utilities",    type:"expense", amount:145,  month:5, day:8  },
  { id:6,  name:"Internet",         cat:"Utilities",    type:"expense", amount:60,   month:5, day:12 },
  { id:7,  name:"Fuel",             cat:"Transport",    type:"expense", amount:180,  month:5, day:14 },
  { id:8,  name:"Gym Membership",   cat:"Lifestyle",    type:"expense", amount:90,   month:5, day:15 },
  { id:9,  name:"May Salary",       cat:"Salary",       type:"income",  amount:8200, month:4, day:1  },
  { id:10, name:"May Rent",         cat:"Housing",      type:"expense", amount:1950, month:4, day:1  },
  { id:11, name:"May Groceries",    cat:"Food",         type:"expense", amount:290,  month:4, day:5  },
];

const INIT_GOALS = [
  { id:1, name:"Emergency Fund", icon:"🛡️", current:9200,  target:12000, color:"#1a472a",
    history:[{m:"Jan",v:7000},{m:"Feb",v:7500},{m:"Mar",v:8000},{m:"Apr",v:8600},{m:"May",v:8900},{m:"Jun",v:9200}] },
  { id:2, name:"Dream Vacation", icon:"✈️", current:3400,  target:5000,  color:"#f59e0b",
    history:[{m:"Jan",v:1200},{m:"Feb",v:1800},{m:"Mar",v:2200},{m:"Apr",v:2700},{m:"May",v:3100},{m:"Jun",v:3400}] },
  { id:3, name:"New Car",        icon:"🚗", current:11500, target:25000, color:"#1e40af",
    history:[{m:"Jan",v:8000},{m:"Feb",v:8800},{m:"Mar",v:9500},{m:"Apr",v:10200},{m:"May",v:10900},{m:"Jun",v:11500}] },
  { id:4, name:"Home Down Payment",icon:"🏠",current:18600,target:60000, color:"#dc2626",
    history:[{m:"Jan",v:14000},{m:"Feb",v:15000},{m:"Mar",v:16000},{m:"Apr",v:17000},{m:"May",v:17800},{m:"Jun",v:18600}] },
];

const INIT_DEBTS = [
  { id:1, name:"Credit Card", left:2340,  apr:19.9, total:5000,
    history:[{m:"Jan",v:4200},{m:"Feb",v:3900},{m:"Mar",v:3500},{m:"Apr",v:3100},{m:"May",v:2700},{m:"Jun",v:2340}] },
  { id:2, name:"Student Loan",left:9800,  apr:5.2,  total:15000,
    history:[{m:"Jan",v:12000},{m:"Feb",v:11500},{m:"Mar",v:11000},{m:"Apr",v:10700},{m:"May",v:10200},{m:"Jun",v:9800}] },
  { id:3, name:"Car Loan",    left:7450,  apr:6.8,  total:12000,
    history:[{m:"Jan",v:10000},{m:"Feb",v:9500},{m:"Mar",v:9000},{m:"Apr",v:8500},{m:"May",v:8000},{m:"Jun",v:7450}] },
];

const INIT_BILLS = [
  { id:1, day:1,  name:"Rent",           amount:1950, status:"paid"     },
  { id:2, day:8,  name:"Electricity",    amount:145,  status:"paid"     },
  { id:3, day:12, name:"Internet",       amount:60,   status:"upcoming" },
  { id:4, day:18, name:"Car Insurance",  amount:210,  status:"upcoming" },
  { id:5, day:22, name:"Phone",          amount:55,   status:"upcoming" },
  { id:6, day:25, name:"Streaming",      amount:32,   status:"overdue"  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt  = n => `$${Math.abs(n).toLocaleString()}`;
const pct  = (c,t) => Math.min(100, Math.round((c/t)*100));
const uid  = () => Date.now() + Math.random();

const Card = ({ children, style={} }) => (
  <div style={{ background:"#fff", borderRadius:22, padding:20,
    boxShadow:"0 2px 16px rgba(0,0,0,0.06)", marginBottom:14, ...style }}>
    {children}
  </div>
);
const Sec = ({ children }) => (
  <p style={{ margin:"20px 0 10px", fontSize:11, fontWeight:800,
    color:"#9ca3af", textTransform:"uppercase", letterSpacing:1 }}>{children}</p>
);

// ─── CHARTS ──────────────────────────────────────────────────────────────────
function Donut({ data, total }) {
  const r=52, cx=68, cy=68, C=2*Math.PI*r;
  let off=0;
  const segs = data.map(d => { const s={...d,off,len:(d.pct/100)*C}; off+=s.len; return s; });
  return (
    <svg width={136} height={136} viewBox="0 0 136 136" style={{flexShrink:0}}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={22}/>
      {segs.map((s,i)=>(
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={22}
          strokeDasharray={`${s.len} ${C-s.len}`} strokeDashoffset={-s.off}
          style={{transform:"rotate(-90deg)",transformOrigin:"68px 68px"}}/>
      ))}
      <text x={cx} y={cy-7}  textAnchor="middle" fontSize="10" fill="#9ca3af" fontFamily="Segoe UI">Total</text>
      <text x={cx} y={cy+10} textAnchor="middle" fontSize="13" fontWeight="800" fill="#111" fontFamily="Segoe UI">{total}</text>
    </svg>
  );
}

function Bars({ data, onBarClick, activeBar }) {
  const max = Math.max(...data.flatMap(d=>[d.income,d.expenses]), 1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:130,paddingTop:8}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div onClick={()=>onBarClick(i)}
            style={{display:"flex",gap:2,alignItems:"flex-end",height:100,width:"100%",cursor:"pointer",
              borderRadius:6, outline: activeBar===i?"2px solid #22c55e":"none"}}>
            <div style={{flex:1,background:activeBar===i?"#22c55e":"#1a472a",borderRadius:"5px 5px 0 0",height:`${(d.income/max)*100}%`,transition:"all 0.3s"}}/>
            <div style={{flex:1,background:activeBar===i?"#fb923c":"#f59e0b",borderRadius:"5px 5px 0 0",height:`${(d.expenses/max)*100}%`,transition:"all 0.3s"}}/>
          </div>
          <span style={{fontSize:9,color: activeBar===i?"#22c55e":"#9ca3af",fontWeight:activeBar===i?800:400}}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function MiniLine({ data, color="#22c55e", height=70 }) {
  if (!data || data.length < 2) return null;
  const w=300, h=height, pad=6;
  const vals = data.map(d=>d.v);
  const max=Math.max(...vals), min=Math.min(...vals);
  const range = max-min || 1;
  const pts = vals.map((v,i)=>({
    x: pad+(i/(vals.length-1))*(w-pad*2),
    y: h-pad-((v-min)/range)*(h-pad*2)
  }));
  const path = pts.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" ");
  const area = `${path} L${pts[pts.length-1].x},${h} L${pts[0].x},${h} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{height,display:"block"}}>
      <defs>
        <linearGradient id={`g${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g${color.replace("#","")})`}/>
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke={color} strokeWidth="2"/>)}
    </svg>
  );
}

function Gauge({ value }) {
  const r=68, cx=90, cy=88, sw=13;
  const clamp = Math.min(Math.max(value,0),100);
  const a = (clamp/100)*Math.PI;
  const x = cx - r*Math.cos(a);
  const y = cy - r*Math.sin(a);
  const bg = `M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`;
  const fg = clamp===0 ? null : `M ${cx-r} ${cy} A ${r} ${r} 0 ${clamp>50?1:0} 1 ${x} ${y}`;
  const color = clamp>=20?"#22c55e":clamp>=10?"#f59e0b":"#ef4444";
  return (
    <svg width={180} height={105} viewBox="0 0 180 105" style={{display:"block",margin:"0 auto"}}>
      <path d={bg} fill="none" stroke="#f3f4f6" strokeWidth={sw} strokeLinecap="round"/>
      {fg && <path d={fg} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"/>}
      <line x1={cx} y1={cy} x2={cx-(r-8)*Math.cos(a)} y2={cy-(r-8)*Math.sin(a)}
        stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r="5" fill={color}/>
      <text x={cx-r-4} y={cy+16} textAnchor="middle" fontSize="9" fill="#9ca3af" fontFamily="Segoe UI">0%</text>
      <text x={cx+r+4} y={cy+16} textAnchor="middle" fontSize="9" fill="#9ca3af" fontFamily="Segoe UI">100%</text>
      <text x={cx} y={cy-14}  textAnchor="middle" fontSize="26" fontWeight="900" fill={color} fontFamily="Segoe UI">{clamp}%</text>
      <text x={cx} y={cy+2} textAnchor="middle" fontSize="10" fill="#9ca3af" fontFamily="Segoe UI">Savings Rate</text>
    </svg>
  );
}

// ─── LANGUAGE PICKER ─────────────────────────────────────────────────────────
function LangPicker({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{position:"relative"}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",
          borderRadius:12,padding:"8px 14px",color:"#fff",cursor:"pointer",fontSize:14,
          display:"flex",alignItems:"center",gap:6,fontWeight:600,backdropFilter:"blur(8px)"}}>
        <span>{LANGS[lang].flag}</span>
        <span style={{fontSize:12}}>{LANGS[lang].name}</span>
        <span style={{fontSize:10,opacity:0.7}}>{open?"▲":"▼"}</span>
      </button>
      {open && (
        <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,background:"rgba(10,30,15,0.97)",
          borderRadius:16,padding:8,border:"1px solid rgba(255,255,255,0.12)",
          boxShadow:"0 8px 32px rgba(0,0,0,0.4)",zIndex:999,minWidth:160,backdropFilter:"blur(16px)"}}>
          {Object.entries(LANGS).map(([code,info])=>(
            <button key={code} onClick={()=>{setLang(code);setOpen(false);}}
              style={{width:"100%",padding:"10px 14px",border:"none",background:lang===code?"rgba(34,197,94,0.2)":"transparent",
                borderRadius:10,cursor:"pointer",display:"flex",alignItems:"center",gap:10,
                color:lang===code?"#22c55e":"#e2e8f0",fontWeight:lang===code?700:400,fontSize:13,
                textAlign:"left",marginBottom:2,transition:"all 0.15s"}}>
              <span style={{fontSize:18}}>{info.flag}</span>
              <span>{info.name}</span>
              {lang===code && <span style={{marginLeft:"auto",fontSize:12}}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function Auth({ onLogin, lang, setLang }) {
  const t = T[lang];
  const dir = LANGS[lang].dir;
  const [mode,setMode]=useState("login");
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [pass,setPass]=useState("");
  const [plan,setPlan]=useState("pro"); const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const inp=(ph,val,set,type="text")=>(
    <input type={type} placeholder={ph} value={val} onChange={e=>set(e.target.value)}
      style={{width:"100%",padding:"13px 15px",borderRadius:14,border:"1px solid rgba(255,255,255,0.12)",
        background:"rgba(0,0,0,0.25)",color:"#fff",fontSize:14,outline:"none",marginBottom:12,
        boxSizing:"border-box",direction:dir,textAlign:dir==="rtl"?"right":"left"}}/>
  );
  async function handleSubmit(){
    setErr(""); setLoading(true);
    try{
      if(mode==="signup"){
        const data = await supaSignUp(email, pass, { name: name||"User", plan });
        if(data.access_token){
          onLogin({ id:data.user.id, name:name||"User", plan, email }, data.access_token);
        } else {
          setErr(lang==="ar" ? "تم إنشاء الحساب، تحقق من إيميلك لتأكيد التسجيل" : "Account created — check your email to confirm.");
        }
      } else {
        const data = await supaSignIn(email, pass);
        const meta = data.user.user_metadata || {};
        onLogin({ id:data.user.id, name:meta.name||"User", plan:meta.plan||"free", email }, data.access_token);
      }
    } catch(e){
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#071a0e,#0f2d17,#071a0e)",
      display:"flex",alignItems:"center",justifyContent:"center",direction:dir,
      fontFamily:"'Segoe UI',Tahoma,sans-serif",padding:20}}>
      <div style={{width:"100%",maxWidth:400}}>
        {/* Language picker top right */}
        <div style={{display:"flex",justifyContent:dir==="rtl"?"flex-start":"flex-end",marginBottom:16}}>
          <LangPicker lang={lang} setLang={setLang}/>
        </div>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:48,marginBottom:10}}>💰</div>
          <h1 style={{color:"#fff",margin:0,fontSize:28,fontWeight:900}}>{t.appName}</h1>
          <p style={{color:"#4ade80",margin:"6px 0 0",fontSize:13}}>{t.appSlogan}</p>
        </div>
        <div style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(24px)",borderRadius:28,
          border:"1px solid rgba(255,255,255,0.08)",padding:28}}>
          <div style={{display:"flex",background:"rgba(0,0,0,0.3)",borderRadius:14,padding:4,marginBottom:24}}>
            {[["login",t.login],["signup",t.signup]].map(([m,l])=>(
              <button key={m} onClick={()=>{setMode(m);setErr("");}} style={{flex:1,padding:"10px",borderRadius:11,border:"none",
                cursor:"pointer",fontSize:13,fontWeight:700,background:mode===m?"#16a34a":"transparent",
                color:mode===m?"#fff":"#86efac",transition:"all 0.2s"}}>{l}</button>
            ))}
          </div>
          {mode==="signup"&&inp(t.yourName,name,setName)}
          {inp(t.enterEmail,email,setEmail)}
          {inp(t.enterPass,pass,setPass,"password")}
          {mode==="signup"&&(
            <div style={{marginBottom:16}}>
              <p style={{color:"#86efac",fontSize:12,fontWeight:700,margin:"0 0 10px"}}>{t.choosePlan}</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[{id:"free",l:t.free,p:t.freePrice,f:t.freeFeature},{id:"pro",l:t.pro,p:t.proPrice,f:t.proFeature}].map(x=>(
                  <div key={x.id} onClick={()=>setPlan(x.id)} style={{padding:"14px 12px",borderRadius:14,
                    border:`2px solid ${plan===x.id?"#22c55e":"rgba(255,255,255,0.1)"}`,cursor:"pointer",
                    background:plan===x.id?"rgba(34,197,94,0.12)":"transparent",textAlign:"center",transition:"all 0.2s"}}>
                    <div style={{color:"#fff",fontWeight:700,fontSize:14}}>{x.l}</div>
                    <div style={{color:"#22c55e",fontSize:13,fontWeight:700,margin:"3px 0"}}>{x.p}</div>
                    <div style={{color:"#86efac",fontSize:11}}>{x.f}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {err && <p style={{color:"#fca5a5",fontSize:12,margin:"0 0 12px",textAlign:"center"}}>{err}</p>}
          <button onClick={handleSubmit} disabled={loading}
            style={{width:"100%",padding:15,borderRadius:16,border:"none",
              background:"linear-gradient(135deg,#22c55e,#15803d)",color:"#fff",fontSize:15,fontWeight:800,
              cursor:loading?"default":"pointer",opacity:loading?0.7:1,boxShadow:"0 6px 24px rgba(34,197,94,0.35)"}}>
            {loading?t.loading:mode==="login"?t.loginBtn:t.signupBtn}
          </button>
        </div>
        <p style={{textAlign:"center",color:"rgba(255,255,255,0.25)",fontSize:11,marginTop:16}}>{t.demoNote}</p>
      </div>
    </div>
  );
}

// ─── SETTINGS PANEL ──────────────────────────────────────────────────────────
function Settings({ cats, setCats, goals, setGoals, debts, setDebts, bills, setBills, onClose, t, dir }) {
  const [tab,setTab]=useState("cats");
  const [newCat,setNewCat]=useState({name:"",type:"expense"});
  const [newGoal,setNewGoal]=useState({name:"",icon:"🎯",target:"",current:"",color:"#22c55e"});
  const [newDebt,setNewDebt]=useState({name:"",total:"",left:"",apr:""});
  const [newBill,setNewBill]=useState({name:"",amount:"",day:"",status:"upcoming"});
  const [editGoal,setEditGoal]=useState(null);
  const [editDebt,setEditDebt]=useState(null);

  const tabs=[["cats",t.cats],["goals",t.goals],["debts",t.debts],["bills",t.bills]];
  const stOpts = [{v:"paid",l:t.paid},{v:"upcoming",l:t.upcoming},{v:"overdue",l:t.overdue}];

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:"#f0f2f5",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,
        maxHeight:"90vh",overflowY:"auto",padding:"0 0 40px",direction:dir,fontFamily:"'Segoe UI',Tahoma,sans-serif"}}>
        <div style={{background:"linear-gradient(135deg,#071a0e,#1a3a22)",padding:"20px 20px 16px",borderRadius:"24px 24px 0 0",
          position:"sticky",top:0,zIndex:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <h2 style={{color:"#fff",margin:0,fontSize:18,fontWeight:800}}>{t.settingsTitle}</h2>
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,
              color:"#fff",width:32,height:32,cursor:"pointer",fontSize:16}}>✕</button>
          </div>
          <div style={{display:"flex",gap:6}}>
            {tabs.map(([id,l])=>(
              <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"8px 4px",borderRadius:10,border:"none",
                cursor:"pointer",fontSize:11,fontWeight:700,background:tab===id?"#22c55e":"rgba(255,255,255,0.08)",
                color:tab===id?"#fff":"#86efac",transition:"all 0.2s"}}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{padding:"16px 14px"}}>
          {/* CATEGORIES */}
          {tab==="cats"&&(
            <>
              {["expense","income"].map(type=>(
                <div key={type}>
                  <Sec>{type==="expense"?t.expenseCats:t.incomeCats}</Sec>
                  <Card>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
                      {cats[type].map((c,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:6,background:"#f3f4f6",
                          borderRadius:20,padding:"6px 12px"}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:CAT_COLORS[c]||"#6b7280"}}/>
                          <span style={{fontSize:12,fontWeight:600}}>{c}</span>
                          {i>=DEFAULT_CATS[type].length-1&&(
                            <span onClick={()=>setCats(p=>({...p,[type]:p[type].filter((_,j)=>j!==i)}))}
                              style={{cursor:"pointer",color:"#dc2626",fontSize:13,marginRight:2}}>✕</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <input placeholder={type==="expense"?t.newExpenseCat:t.newIncomeCat} value={newCat.name}
                        onChange={e=>setNewCat(p=>({...p,name:e.target.value,type}))}
                        style={{flex:1,padding:"10px 12px",borderRadius:12,border:"1px solid #e5e7eb",fontSize:13,outline:"none"}}/>
                      <button onClick={()=>{
                        if(!newCat.name.trim()) return;
                        setCats(p=>({...p,[type]:[...p[type],newCat.name.trim()]}));
                        setNewCat({name:"",type:"expense"});
                      }} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:12,padding:"10px 16px",fontWeight:700,cursor:"pointer",fontSize:13}}>{t.addBtn}</button>
                    </div>
                  </Card>
                </div>
              ))}
            </>
          )}

          {/* GOALS */}
          {tab==="goals"&&(
            <>
              <Sec>{t.savingsGoalsTitle}</Sec>
              {goals.map(g=>(
                <Card key={g.id} style={{marginBottom:10}}>
                  {editGoal===g.id?(
                    <GoalForm init={g} t={t} onSave={updated=>{
                      setGoals(p=>p.map(x=>x.id===g.id?{...x,...updated}:x));
                      setEditGoal(null);
                    }} onCancel={()=>setEditGoal(null)}/>
                  ):(
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",gap:10,alignItems:"center"}}>
                        <span style={{fontSize:22}}>{g.icon}</span>
                        <div>
                          <p style={{margin:0,fontWeight:700,fontSize:14}}>{g.name}</p>
                          <p style={{margin:"2px 0 0",fontSize:11,color:"#9ca3af"}}>{fmt(g.current)} / {fmt(g.target)}</p>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>setEditGoal(g.id)} style={{background:"#eff6ff",color:"#2563eb",border:"none",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.editGoal}</button>
                        <button onClick={()=>setGoals(p=>p.filter(x=>x.id!==g.id))} style={{background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.deleteGoal}</button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
              <Card style={{border:"2px dashed #e5e7eb"}}>
                <p style={{margin:"0 0 12px",fontWeight:700,fontSize:14}}>{t.newGoalTitle}</p>
                <GoalForm init={newGoal} isNew t={t} onSave={g=>{
                  setGoals(p=>[...p,{...g,id:uid(),history:[{m:"Now",v:+g.current||0}]}]);
                  setNewGoal({name:"",icon:"🎯",target:"",current:"",color:"#22c55e"});
                }} onCancel={()=>{}}/>
              </Card>
            </>
          )}

          {/* DEBTS */}
          {tab==="debts"&&(
            <>
              <Sec>{t.debtsTitle}</Sec>
              {debts.map(d=>(
                <Card key={d.id} style={{marginBottom:10}}>
                  {editDebt===d.id?(
                    <DebtForm init={d} t={t} onSave={updated=>{
                      setDebts(p=>p.map(x=>x.id===d.id?{...x,...updated}:x));
                      setEditDebt(null);
                    }} onCancel={()=>setEditDebt(null)}/>
                  ):(
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <p style={{margin:0,fontWeight:700,fontSize:14}}>{d.name}</p>
                        <p style={{margin:"2px 0 0",fontSize:11,color:"#9ca3af"}}>{fmt(d.left)} {t.debtRemaining} · {d.apr}% APR</p>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>setEditDebt(d.id)} style={{background:"#eff6ff",color:"#2563eb",border:"none",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.editGoal}</button>
                        <button onClick={()=>setDebts(p=>p.filter(x=>x.id!==d.id))} style={{background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.deleteGoal}</button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
              <Card style={{border:"2px dashed #e5e7eb"}}>
                <p style={{margin:"0 0 12px",fontWeight:700,fontSize:14}}>{t.newDebtTitle}</p>
                <DebtForm init={newDebt} isNew t={t} onSave={d=>{
                  setDebts(p=>[...p,{...d,id:uid(),history:[{m:"Now",v:+d.left}]}]);
                  setNewDebt({name:"",total:"",left:"",apr:""});
                }} onCancel={()=>{}}/>
              </Card>
            </>
          )}

          {/* BILLS */}
          {tab==="bills"&&(
            <>
              <Sec>{t.billsTitle}</Sec>
              {bills.map((b,i)=>(
                <Card key={b.id} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <p style={{margin:0,fontWeight:700,fontSize:14}}>{b.name}</p>
                      <p style={{margin:"2px 0 0",fontSize:11,color:"#9ca3af"}}>{t.dueDay} {b.day} · {fmt(b.amount)}</p>
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <select value={b.status} onChange={e=>setBills(p=>p.map((x,j)=>j===i?{...x,status:e.target.value}:x))}
                        style={{padding:"6px 10px",borderRadius:10,border:"1px solid #e5e7eb",fontSize:12,outline:"none",background:"#fff"}}>
                        {stOpts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                      <button onClick={()=>setBills(p=>p.filter(x=>x.id!==b.id))} style={{background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:10,padding:"6px 10px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.deleteGoal}</button>
                    </div>
                  </div>
                </Card>
              ))}
              <Card style={{border:"2px dashed #e5e7eb"}}>
                <p style={{margin:"0 0 12px",fontWeight:700,fontSize:14}}>{t.newBillTitle}</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  <input placeholder={t.billName} value={newBill.name} onChange={e=>setNewBill(p=>({...p,name:e.target.value}))}
                    style={{padding:"10px 12px",borderRadius:12,border:"1px solid #e5e7eb",fontSize:13,outline:"none"}}/>
                  <input placeholder={t.billAmount} type="number" value={newBill.amount} onChange={e=>setNewBill(p=>({...p,amount:e.target.value}))}
                    style={{padding:"10px 12px",borderRadius:12,border:"1px solid #e5e7eb",fontSize:13,outline:"none"}}/>
                  <input placeholder={t.dueDate} type="number" value={newBill.day} onChange={e=>setNewBill(p=>({...p,day:e.target.value}))}
                    style={{padding:"10px 12px",borderRadius:12,border:"1px solid #e5e7eb",fontSize:13,outline:"none"}}/>
                  <select value={newBill.status} onChange={e=>setNewBill(p=>({...p,status:e.target.value}))}
                    style={{padding:"10px 12px",borderRadius:12,border:"1px solid #e5e7eb",fontSize:13,outline:"none",background:"#fff"}}>
                    {stOpts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
                <button onClick={()=>{
                  if(!newBill.name||!newBill.amount||!newBill.day) return;
                  setBills(p=>[...p,{...newBill,id:uid(),amount:+newBill.amount,day:+newBill.day}]);
                  setNewBill({name:"",amount:"",day:"",status:"upcoming"});
                }} style={{width:"100%",padding:"11px",borderRadius:12,border:"none",background:"#16a34a",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}}>{t.addBill}</button>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GoalForm({ init, onSave, onCancel, isNew, t }) {
  const [f,setF]=useState({name:init.name||"",icon:init.icon||"🎯",target:init.target||"",current:init.current||"",color:init.color||"#22c55e"});
  const icons=["🎯","🛡️","✈️","🚗","🏠","📚","💊","💍","🎓","💻","🌴","🏋️"];
  return (
    <div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
        {icons.map(ic=>(
          <span key={ic} onClick={()=>setF(p=>({...p,icon:ic}))}
            style={{fontSize:20,cursor:"pointer",padding:"4px 6px",borderRadius:8,background:f.icon===ic?"#dcfce7":"#f3f4f6",border:f.icon===ic?"2px solid #16a34a":"2px solid transparent"}}>{ic}</span>
        ))}
      </div>
      <input placeholder={t.goalName} value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}
        style={{width:"100%",padding:"11px 12px",borderRadius:12,border:"1px solid #e5e7eb",marginBottom:8,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        <input placeholder={t.targetAmount} type="number" value={f.target} onChange={e=>setF(p=>({...p,target:e.target.value}))}
          style={{padding:"11px 12px",borderRadius:12,border:"1px solid #e5e7eb",fontSize:13,outline:"none"}}/>
        <input placeholder={t.currentAmount} type="number" value={f.current} onChange={e=>setF(p=>({...p,current:e.target.value}))}
          style={{padding:"11px 12px",borderRadius:12,border:"1px solid #e5e7eb",fontSize:13,outline:"none"}}/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>{if(!f.name||!f.target)return;onSave({...f,target:+f.target,current:+f.current||0});}}
          style={{flex:1,padding:"11px",borderRadius:12,border:"none",background:"#16a34a",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}}>
          {isNew?t.addGoal:t.saveBtn}
        </button>
        {!isNew&&<button onClick={onCancel} style={{flex:1,padding:"11px",borderRadius:12,border:"none",background:"#f3f4f6",color:"#374151",fontWeight:600,cursor:"pointer",fontSize:13}}>{t.cancel}</button>}
      </div>
    </div>
  );
}

function DebtForm({ init, onSave, onCancel, isNew, t }) {
  const [f,setF]=useState({name:init.name||"",total:init.total||"",left:init.left||"",apr:init.apr||""});
  return (
    <div>
      <input placeholder={t.debtName} value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}
        style={{width:"100%",padding:"11px 12px",borderRadius:12,border:"1px solid #e5e7eb",marginBottom:8,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
        <input placeholder={t.totalAmount} type="number" value={f.total} onChange={e=>setF(p=>({...p,total:e.target.value}))}
          style={{padding:"11px 10px",borderRadius:12,border:"1px solid #e5e7eb",fontSize:12,outline:"none"}}/>
        <input placeholder={t.leftAmount} type="number" value={f.left} onChange={e=>setF(p=>({...p,left:e.target.value}))}
          style={{padding:"11px 10px",borderRadius:12,border:"1px solid #e5e7eb",fontSize:12,outline:"none"}}/>
        <input placeholder={t.aprPct} type="number" value={f.apr} onChange={e=>setF(p=>({...p,apr:e.target.value}))}
          style={{padding:"11px 10px",borderRadius:12,border:"1px solid #e5e7eb",fontSize:12,outline:"none"}}/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>{if(!f.name||!f.total||!f.left)return;onSave({...f,total:+f.total,left:+f.left,apr:+f.apr||0});}}
          style={{flex:1,padding:"11px",borderRadius:12,border:"none",background:"#16a34a",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}}>
          {isNew?t.addDebt:t.saveBtn}
        </button>
        {!isNew&&<button onClick={onCancel} style={{flex:1,padding:"11px",borderRadius:12,border:"none",background:"#f3f4f6",color:"#374151",fontWeight:600,cursor:"pointer",fontSize:13}}>{t.cancel}</button>}
      </div>
    </div>
  );
}

// ─── GOAL DETAIL MODAL ────────────────────────────────────────────────────────
function GoalDetail({ goal, onClose, t, dir }) {
  const p = pct(goal.current, goal.target);
  const remaining = goal.target - goal.current;
  const monthlyAdd = goal.history.length>=2 ? goal.history[goal.history.length-1].v - goal.history[goal.history.length-2].v : 0;
  const monthsLeft = monthlyAdd>0 ? Math.ceil(remaining/monthlyAdd) : "—";
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:"#f0f2f5",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,
        maxHeight:"85vh",overflowY:"auto",padding:"0 0 40px",direction:dir,fontFamily:"'Segoe UI',Tahoma,sans-serif"}}>
        <div style={{background:`linear-gradient(135deg,${goal.color}dd,${goal.color})`,padding:"20px 20px 24px",borderRadius:"24px 24px 0 0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <span style={{fontSize:32}}>{goal.icon}</span>
              <h2 style={{color:"#fff",margin:"8px 0 4px",fontSize:20,fontWeight:900}}>{goal.name}</h2>
              <p style={{color:"rgba(255,255,255,0.8)",margin:0,fontSize:13}}>{fmt(goal.current)} / {fmt(goal.target)}</p>
            </div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:12,color:"#fff",width:36,height:36,cursor:"pointer",fontSize:18}}>✕</button>
          </div>
          <div style={{marginTop:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{color:"rgba(255,255,255,0.8)",fontSize:12}}>{t.progress}</span>
              <span style={{color:"#fff",fontWeight:800,fontSize:12}}>{p}%</span>
            </div>
            <div style={{background:"rgba(255,255,255,0.25)",borderRadius:20,height:10}}>
              <div style={{background:"#fff",height:"100%",width:`${p}%`,borderRadius:20,transition:"width 0.8s ease"}}/>
            </div>
          </div>
        </div>
        <div style={{padding:"16px 14px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
            {[
              {l:t.remaining,v:fmt(remaining),c:"#dc2626"},
              {l:t.monthlyAdd,v:monthlyAdd>0?fmt(monthlyAdd):"—",c:goal.color},
              {l:t.monthsLeft,v:monthsLeft,c:"#2563eb"},
            ].map((s,i)=>(
              <div key={i} style={{background:"#fff",borderRadius:16,padding:"12px 10px",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
                <p style={{margin:0,fontSize:15,fontWeight:900,color:s.c}}>{s.v}</p>
                <p style={{margin:"3px 0 0",fontSize:10,color:"#9ca3af"}}>{s.l}</p>
              </div>
            ))}
          </div>
          <Card>
            <p style={{margin:"0 0 12px",fontWeight:700,fontSize:14}}>{t.goalProgress}</p>
            <MiniLine data={goal.history} color={goal.color} height={90}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
              {goal.history.map((h,i)=><span key={i} style={{fontSize:9,color:"#9ca3af"}}>{h.m.slice(0,3)}</span>)}
            </div>
          </Card>
          <Card>
            <p style={{margin:"0 0 12px",fontWeight:700,fontSize:14}}>{t.progressLog}</p>
            {[...goal.history].reverse().map((h,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:i<goal.history.length-1?"1px solid #f3f4f6":"none"}}>
                <span style={{fontSize:13,color:"#374151",fontWeight:600}}>{h.m}</span>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <span style={{fontSize:13,fontWeight:700}}>{fmt(h.v)}</span>
                  <span style={{fontSize:11,color:goal.color,fontWeight:600}}>{pct(h.v,goal.target)}%</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── DEBT DETAIL MODAL ───────────────────────────────────────────────────────
function DebtDetail({ debt, onClose, t, dir }) {
  const paid = debt.total - debt.left;
  const p = pct(paid, debt.total);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:"#f0f2f5",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,
        maxHeight:"85vh",overflowY:"auto",padding:"0 0 40px",direction:dir,fontFamily:"'Segoe UI',Tahoma,sans-serif"}}>
        <div style={{background:"linear-gradient(135deg,#1e3a5f,#1e40af)",padding:"20px 20px 24px",borderRadius:"24px 24px 0 0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <span style={{fontSize:32}}>💳</span>
              <h2 style={{color:"#fff",margin:"8px 0 4px",fontSize:20,fontWeight:900}}>{debt.name}</h2>
              <p style={{color:"rgba(255,255,255,0.8)",margin:0,fontSize:13}}>{fmt(debt.left)} {t.debtRemaining} · {debt.apr}% APR</p>
            </div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:12,color:"#fff",width:36,height:36,cursor:"pointer",fontSize:18}}>✕</button>
          </div>
          <div style={{marginTop:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{color:"rgba(255,255,255,0.8)",fontSize:12}}>{t.repaymentPct}</span>
              <span style={{color:"#fff",fontWeight:800,fontSize:12}}>{p}%</span>
            </div>
            <div style={{background:"rgba(255,255,255,0.25)",borderRadius:20,height:10}}>
              <div style={{background:"#22c55e",height:"100%",width:`${p}%`,borderRadius:20}}/>
            </div>
          </div>
        </div>
        <div style={{padding:"16px 14px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
            {[
              {l:t.paidAmount,v:fmt(paid),c:"#16a34a"},
              {l:t.remaining,v:fmt(debt.left),c:"#dc2626"},
              {l:t.interestRate,v:`${debt.apr}%`,c:"#d97706"},
            ].map((s,i)=>(
              <div key={i} style={{background:"#fff",borderRadius:16,padding:"12px 10px",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
                <p style={{margin:0,fontSize:15,fontWeight:900,color:s.c}}>{s.v}</p>
                <p style={{margin:"3px 0 0",fontSize:10,color:"#9ca3af"}}>{s.l}</p>
              </div>
            ))}
          </div>
          <Card>
            <p style={{margin:"0 0 12px",fontWeight:700,fontSize:14}}>{t.debtProgress}</p>
            <MiniLine data={debt.history} color="#22c55e" height={90}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
              {debt.history.map((h,i)=><span key={i} style={{fontSize:9,color:"#9ca3af"}}>{h.m.slice(0,3)}</span>)}
            </div>
          </Card>
          <Card>
            <p style={{margin:"0 0 12px",fontWeight:700,fontSize:14}}>{t.paymentLog}</p>
            {[...debt.history].reverse().map((h,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:i<debt.history.length-1?"1px solid #f3f4f6":"none"}}>
                <span style={{fontSize:13,color:"#374151",fontWeight:600}}>{h.m}</span>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <span style={{fontSize:13,fontWeight:700,color:"#dc2626"}}>{fmt(h.v)} {t.debtRemaining}</span>
                  <span style={{fontSize:11,color:"#16a34a",fontWeight:600}}>{pct(debt.total-h.v,debt.total)}% {t.paidOff}</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── BILL DETAIL MODAL ────────────────────────────────────────────────────────
function BillDetail({ bill, onClose, onUpdate, t, dir }) {
  const stStyle = s=>({
    paid:    {bg:"#dcfce7",color:"#16a34a",label:t.paidLabel},
    upcoming:{bg:"#fff7ed",color:"#d97706",label:t.upcomingLabel},
    overdue: {bg:"#fee2e2",color:"#dc2626",label:t.overdueLabel},
  }[s]);
  const s = stStyle(bill.status);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:"#fff",borderRadius:24,width:"100%",maxWidth:380,padding:24,direction:dir,fontFamily:"'Segoe UI',Tahoma,sans-serif"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
          <h3 style={{margin:0,fontSize:18,fontWeight:800}}>{bill.name}</h3>
          <button onClick={onClose} style={{background:"#f3f4f6",border:"none",borderRadius:10,width:32,height:32,cursor:"pointer",fontSize:16}}>✕</button>
        </div>
        <div style={{background:s.bg,borderRadius:16,padding:"20px",textAlign:"center",marginBottom:16}}>
          <p style={{margin:0,fontSize:32,fontWeight:900,color:s.color}}>{fmt(bill.amount)}</p>
          <p style={{margin:"6px 0 0",fontSize:13,color:s.color,fontWeight:700}}>{s.label}</p>
          <p style={{margin:"4px 0 0",fontSize:12,color:"#6b7280"}}>{t.dueDay} {bill.day} {t.ofEveryMonth}</p>
        </div>
        <p style={{margin:"0 0 12px",fontWeight:700,fontSize:14,color:"#374151"}}>{t.updateStatus}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {["paid","upcoming","overdue"].map(status=>{
            const ss=stStyle(status);
            return (
              <button key={status} onClick={()=>{onUpdate(status);onClose();}}
                style={{padding:"10px",borderRadius:12,border:`2px solid ${bill.status===status?ss.color:"#e5e7eb"}`,
                  background:bill.status===status?ss.bg:"#f9fafb",cursor:"pointer",fontSize:11,fontWeight:700,color:ss.color}}>
                {ss.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState("en");
  const [user,setUser]=useState(null);
  const [token,setToken]=useState(null);
  const [txList,setTxList]=useState(INIT_TX);
  const [goals,setGoals]=useState(INIT_GOALS);
  const [debts,setDebts]=useState(INIT_DEBTS);
  const [bills,setBills]=useState(INIT_BILLS);
  const [cats,setCats]=useState(DEFAULT_CATS);
  const [showAdd,setShowAdd]=useState(false);
  const [showSettings,setShowSettings]=useState(false);
  const [newTx,setNewTx]=useState({name:"",amount:"",type:"expense",cat:"Food",month:NOW_MONTH,day:""});
  const [addErr,setAddErr]=useState("");
  const [activeBar,setActiveBar]=useState(null);
  const [spendFilter,setSpendFilter]=useState(1);
  const [selectedGoal,setSelectedGoal]=useState(null);
  const [selectedDebt,setSelectedDebt]=useState(null);
  const [selectedBill,setSelectedBill]=useState(null);

  const t   = T[lang];
  const dir = LANGS[lang].dir;
  const MONTHS = MONTHS_BY_LANG[lang];

  // عند تسجيل الدخول بنجاح، نخزّن المستخدم + التوكن (في الذاكرة فقط أثناء هذه الجلسة)
  function handleLogin(u, accessToken){
    setUser(u);
    setToken(accessToken);
  }

  // ─── SUPABASE: تحميل المعاملات الخاصة بالمستخدم بعد تسجيل الدخول
  useEffect(()=>{
    if(!user || !token) return;
    (async ()=>{
      const result = await supaGetTransactions(token);
      if(result.ok){
        setTxList(result.data.map(r=>({
          id:r.id, name:r.name, cat:r.cat, amount:+r.amount, type:r.type, month:r.month, day:r.day
        })));
      } else {
        alert("⚠️ فشل تحميل المعاملات من قاعدة البيانات:\n" + result.error);
      }
    })();
  },[user, token]);

  const logout=()=>{ setUser(null); setToken(null); };

  const stats = useMemo(()=>{
    const curTx = txList.filter(tx=>tx.month===NOW_MONTH);
    const income   = curTx.filter(tx=>tx.type==="income").reduce((s,tx)=>s+tx.amount,0);
    const expenses = curTx.filter(tx=>tx.type==="expense").reduce((s,tx)=>s+tx.amount,0);
    const surplus  = income - expenses;
    const savingsRate = income>0 ? Math.round((surplus/income)*100) : 0;

    const filterFrom = NOW_MONTH - spendFilter + 1;
    const filteredTx = txList.filter(tx=>tx.type==="expense"&&tx.month>=filterFrom&&tx.month<=NOW_MONTH);
    const catMap={};
    filteredTx.forEach(tx=>{ catMap[tx.cat]=(catMap[tx.cat]||0)+tx.amount; });
    const totalSpend = Object.values(catMap).reduce((s,v)=>s+v,0);
    const spending = Object.entries(catMap).map(([label,amt])=>({
      label, amt, pct: totalSpend>0?Math.round((amt/totalSpend)*100):0,
      color: CAT_COLORS[label]||"#6b7280",
    })).sort((a,b)=>b.amt-a.amt);

    const chartData=[...HIST,{month:NOW_MONTH,income,expenses}].map((d,i)=>({
      ...d, label:MONTHS[d.month||i].slice(0,3)
    }));

    const currentNW = 50000 + surplus;
    const nwData = [42000,43500,45000,47000,50000,currentNW];

    return { income,expenses,surplus,savingsRate,spending,totalSpend,chartData,nwData,currentNW };
  },[txList,spendFilter,lang]);

  const addTransaction=async()=>{
    if(!newTx.name.trim()){setAddErr(t.addTxErr1);return;}
    if(!newTx.amount||isNaN(+newTx.amount)||+newTx.amount<=0){setAddErr(t.addTxErr2);return;}
    if(!newTx.day||isNaN(+newTx.day)||+newTx.day<1||+newTx.day>31){setAddErr(t.addTxErr3);return;}
    const tx={id:uid(),name:newTx.name.trim(),cat:newTx.cat,
      amount:+newTx.amount,type:newTx.type,month:+newTx.month,day:+newTx.day};
    setTxList(p=>[tx,...p]); // تحديث فوري للواجهة
    setNewTx({name:"",amount:"",type:"expense",cat:"Food",month:NOW_MONTH,day:""});
    setAddErr("");setShowAdd(false);
    // حفظ في Supabase في الخلفية — لو فشل، هيظهر تنبيه واضح بسبب الفشل
    const result = await supaInsertTransaction(token, {
      id:tx.id, user_id:user.id, name:tx.name, cat:tx.cat,
      amount:tx.amount, type:tx.type, month:tx.month, day:tx.day
    });
    if(!result.ok){
      alert("⚠️ فشل حفظ المعاملة في قاعدة البيانات:\n" + result.error);
    }
  };

  const stStyle = s=>({
    paid:    {bg:"#dcfce7",color:"#16a34a",label:t.paidLabel},
    upcoming:{bg:"#fff7ed",color:"#d97706",label:t.upcomingLabel},
    overdue: {bg:"#fee2e2",color:"#dc2626",label:t.overdueLabel},
  }[s]);

  if(!user) return <Auth onLogin={handleLogin} lang={lang} setLang={setLang}/>;

  const {income,expenses,surplus,savingsRate,spending,totalSpend,chartData,nwData,currentNW}=stats;
  const surplusNeg = surplus<0;


  return (
    <div style={{minHeight:"100vh",background:"#f0f2f5",fontFamily:"'Segoe UI',Tahoma,sans-serif",direction:dir,maxWidth:480,margin:"0 auto"}}>

      {showSettings&&<Settings cats={cats} setCats={setCats} goals={goals} setGoals={setGoals}
        debts={debts} setDebts={setDebts} bills={bills} setBills={setBills}
        onClose={()=>setShowSettings(false)} t={t} dir={dir}/>}
      {selectedGoal&&<GoalDetail goal={selectedGoal} onClose={()=>setSelectedGoal(null)} t={t} dir={dir}/>}
      {selectedDebt&&<DebtDetail debt={selectedDebt} onClose={()=>setSelectedDebt(null)} t={t} dir={dir}/>}
      {selectedBill&&<BillDetail bill={selectedBill} onClose={()=>setSelectedBill(null)} t={t} dir={dir}
        onUpdate={status=>setBills(p=>p.map(b=>b.id===selectedBill.id?{...b,status}:b))}/>}

      {/* HEADER */}
      <div style={{background:"linear-gradient(160deg,#071a0e,#1a3a22)",padding:"22px 20px 28px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <p style={{color:"#86efac",margin:0,fontSize:12}}>{t.monthYear}</p>
            <h2 style={{color:"#fff",margin:"3px 0 0",fontSize:19,fontWeight:800}}>{t.welcome} {user.name}</h2>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <LangPicker lang={lang} setLang={setLang}/>
            <button onClick={()=>{setShowAdd(true);setAddErr("");}} style={{background:"#22c55e",color:"#fff",border:"none",borderRadius:12,padding:"9px 14px",fontSize:13,fontWeight:700,cursor:"pointer"}}>{t.addTx}</button>
            <button onClick={()=>setShowSettings(true)} style={{background:"rgba(255,255,255,0.1)",color:"#fff",border:"none",borderRadius:12,width:38,height:38,fontSize:18,cursor:"pointer"}}>{t.settings}</button>
            <button onClick={logout} title="Logout" style={{background:"rgba(255,255,255,0.1)",color:"#fca5a5",border:"none",borderRadius:12,width:38,height:38,fontSize:16,cursor:"pointer"}}>⏻</button>
          </div>
        </div>
      </div>

      <div style={{padding:"16px 14px 50px"}}>

        {/* ADD TX */}
        {showAdd&&(
          <Card style={{border:"2px solid #22c55e",marginBottom:14}}>
            <p style={{margin:"0 0 14px",fontWeight:800,fontSize:15}}>{t.addTxTitle}</p>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {["expense","income"].map(tp=>(
                <button key={tp} onClick={()=>setNewTx(p=>({...p,type:tp,cat:tp==="income"?"Salary":"Food"}))}
                  style={{flex:1,padding:"10px",borderRadius:12,border:`2px solid ${newTx.type===tp?(tp==="income"?"#16a34a":"#dc2626"):"#e5e7eb"}`,
                    background:newTx.type===tp?(tp==="income"?"#dcfce7":"#fee2e2"):"#f9fafb",cursor:"pointer",fontWeight:700,fontSize:13,
                    color:tp==="income"?"#16a34a":"#dc2626"}}>
                  {tp==="income"?`📈 ${t.income}`:`📉 ${t.expense}`}
                </button>
              ))}
            </div>
            <input placeholder={t.description} value={newTx.name} onChange={e=>setNewTx(p=>({...p,name:e.target.value}))}
              style={{width:"100%",padding:"11px 12px",borderRadius:12,border:"1px solid #e5e7eb",marginBottom:8,fontSize:14,outline:"none",boxSizing:"border-box"}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <input placeholder={t.amount} type="number" value={newTx.amount} onChange={e=>setNewTx(p=>({...p,amount:e.target.value}))}
                style={{padding:"11px 12px",borderRadius:12,border:"1px solid #e5e7eb",fontSize:14,outline:"none"}}/>
              <input placeholder={t.day} type="number" value={newTx.day} onChange={e=>setNewTx(p=>({...p,day:e.target.value}))}
                style={{padding:"11px 12px",borderRadius:12,border:"1px solid #e5e7eb",fontSize:14,outline:"none"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              <select value={newTx.month} onChange={e=>setNewTx(p=>({...p,month:+e.target.value}))}
                style={{padding:"11px 12px",borderRadius:12,border:"1px solid #e5e7eb",fontSize:13,outline:"none",background:"#fff"}}>
                {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
              </select>
              <select value={newTx.cat} onChange={e=>setNewTx(p=>({...p,cat:e.target.value}))}
                style={{padding:"11px 12px",borderRadius:12,border:"1px solid #e5e7eb",fontSize:13,outline:"none",background:"#fff"}}>
                {cats[newTx.type].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            {addErr&&<p style={{color:"#dc2626",fontSize:12,margin:"0 0 10px",fontWeight:600}}>⚠ {addErr}</p>}
            <div style={{display:"flex",gap:8}}>
              <button onClick={addTransaction} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:"#16a34a",color:"#fff",fontWeight:800,cursor:"pointer",fontSize:14}}>{t.save}</button>
              <button onClick={()=>setShowAdd(false)} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:"#f3f4f6",color:"#374151",fontWeight:600,cursor:"pointer",fontSize:14}}>{t.cancel}</button>
            </div>
          </Card>
        )}

        {/* KPI */}
        <Sec>{t.summary}</Sec>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {[
            {l:t.totalIncome,v:fmt(income),ico:"📈",color:"#16a34a",bg:"#dcfce7"},
            {l:t.totalExpenses,v:fmt(expenses),ico:"📉",color:"#dc2626",bg:"#fee2e2"},
            {l:t.netSurplus,v:fmt(surplus),ico:"💰",color:surplusNeg?"#dc2626":"#16a34a",bg:surplusNeg?"#fee2e2":"#dcfce7"},
            {l:t.savingsRate,v:`${savingsRate}%`,ico:"🎯",color:savingsRate>=20?"#16a34a":savingsRate>=10?"#d97706":"#dc2626",bg:savingsRate>=20?"#dcfce7":"#fff7ed"},
          ].map((k,i)=>(
            <Card key={i} style={{marginBottom:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <span style={{fontSize:24}}>{k.ico}</span>
                <span style={{fontSize:10,padding:"3px 8px",borderRadius:20,fontWeight:700,background:k.bg,color:k.color}}>{k.v}</span>
              </div>
              <p style={{margin:"10px 0 2px",fontSize:20,fontWeight:900,color:k.color}}>{k.v}</p>
              <p style={{margin:0,fontSize:11,color:"#9ca3af"}}>{k.l}</p>
            </Card>
          ))}
        </div>

        {/* MONTHLY BALANCE */}
        <Sec>{t.monthlyBalance}</Sec>
        <Card>
          <Gauge value={savingsRate}/>
          <div style={{background:surplusNeg?"linear-gradient(135deg,#7f1d1d,#dc2626)":"linear-gradient(135deg,#071a0e,#1a3a22)",
            borderRadius:16,padding:"16px 20px",margin:"14px 0",textAlign:"center",transition:"background 0.4s"}}>
            <p style={{color:"rgba(255,255,255,0.8)",margin:"0 0 4px",fontSize:12,fontWeight:600}}>
              {surplusNeg?t.surplusWarning:t.surplusLabel}
            </p>
            <p style={{color:"#fff",margin:"0 0 8px",fontSize:30,fontWeight:900}}>{fmt(surplus)}</p>
            <span style={{background:"rgba(255,255,255,0.15)",color:"#fff",padding:"3px 14px",borderRadius:20,fontSize:11,fontWeight:700}}>
              {surplusNeg?t.deficitBadge:t.healthyBadge}
            </span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[
              {l:t.incomeLabel,v:fmt(income),color:"#16a34a"},
              {l:t.spendingLabel,v:fmt(expenses),color:"#dc2626"},
              {l:t.savedLabel,v:`${savingsRate}%`,color:surplusNeg?"#dc2626":"#2563eb"},
            ].map((s,i)=>(
              <div key={i} style={{background:"#f8fafc",borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
                <p style={{margin:0,fontSize:14,fontWeight:900,color:s.color}}>{s.v}</p>
                <p style={{margin:"3px 0 0",fontSize:10,color:"#9ca3af"}}>{s.l}</p>
              </div>
            ))}
          </div>
          <div style={{marginTop:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:11,color:"#6b7280"}}>{t.surplusOfIncome}</span>
              <span style={{fontSize:11,fontWeight:700,color:surplusNeg?"#dc2626":"#16a34a"}}>{savingsRate}%</span>
            </div>
            <div style={{background:"#f3f4f6",borderRadius:20,height:10,overflow:"hidden"}}>
              <div style={{background:surplusNeg?"#ef4444":"linear-gradient(90deg,#22c55e,#16a34a)",
                height:"100%",width:`${Math.max(0,Math.min(100,Math.abs(savingsRate)))}%`,borderRadius:20,transition:"all 0.6s ease"}}/>
            </div>
          </div>
        </Card>

        {/* BAR CHART */}
        <Sec>{t.incomeVsExpenses}</Sec>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{display:"flex",gap:12}}>
              {[["#1a472a",t.incomeLabel],["#f59e0b",t.spendingLabel]].map(([c,l],i)=>(
                <div key={i} style={{display:"flex",gap:5,alignItems:"center"}}>
                  <div style={{width:10,height:10,borderRadius:3,background:c}}/><span style={{fontSize:11,color:"#6b7280"}}>{l}</span>
                </div>
              ))}
            </div>
            {activeBar!==null&&<button onClick={()=>setActiveBar(null)} style={{background:"#f3f4f6",border:"none",borderRadius:8,padding:"4px 10px",fontSize:11,cursor:"pointer",color:"#6b7280"}}>✕</button>}
          </div>
          <Bars data={chartData} onBarClick={i=>setActiveBar(activeBar===i?null:i)} activeBar={activeBar}/>
          {activeBar!==null&&chartData[activeBar]&&(
            <div style={{marginTop:12,background:"#f8fafc",borderRadius:14,padding:14,border:"1px solid #e5e7eb"}}>
              <p style={{margin:"0 0 10px",fontWeight:800,fontSize:13,color:"#111"}}>📊 {chartData[activeBar].label}</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[
                  {l:t.incomeLabel,v:fmt(chartData[activeBar].income),c:"#16a34a"},
                  {l:t.spendingLabel,v:fmt(chartData[activeBar].expenses),c:"#dc2626"},
                  {l:t.netSurplus,v:fmt(chartData[activeBar].income-chartData[activeBar].expenses),c:chartData[activeBar].income>=chartData[activeBar].expenses?"#16a34a":"#dc2626"},
                ].map((s,i)=>(
                  <div key={i} style={{textAlign:"center"}}>
                    <p style={{margin:0,fontSize:13,fontWeight:900,color:s.c}}>{s.v}</p>
                    <p style={{margin:"2px 0 0",fontSize:10,color:"#9ca3af"}}>{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* NET WORTH */}
        <Sec>{t.netWorth}</Sec>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div>
              <p style={{margin:0,fontSize:11,color:"#9ca3af"}}>{t.currentValue}</p>
              <p style={{margin:"3px 0 0",fontSize:26,fontWeight:900}}>${currentNW.toLocaleString()}</p>
            </div>
            <span style={{background:"#dcfce7",color:"#16a34a",padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:800}}>
              +{Math.round(((currentNW-42000)/42000)*100)}% YTD
            </span>
          </div>
          <MiniLine data={nwData.map((v,i)=>({m:MONTHS[i],v}))} color="#22c55e" height={80}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
            {MONTHS.slice(0,6).map((m,i)=>(
              <span key={i} style={{fontSize:9,color:"#9ca3af"}}>{m.slice(0,3)}</span>
            ))}
          </div>
        </Card>

        {/* SPENDING BREAKDOWN */}
        <Sec>{t.spendingBreakdown}</Sec>
        <Card>
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            {[[1,t.thisMonth],[2,t.twoMonths],[3,t.threeMonths],[6,t.sixMonths]].map(([v,l])=>(
              <button key={v} onClick={()=>setSpendFilter(v)}
                style={{padding:"6px 12px",borderRadius:20,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,
                  background:spendFilter===v?"#1a3a22":"#f3f4f6",color:spendFilter===v?"#fff":"#6b7280",transition:"all 0.2s"}}>{l}</button>
            ))}
          </div>
          {spending.length===0
            ?<p style={{textAlign:"center",color:"#9ca3af",fontSize:13}}>{t.noExpenses}</p>
            :<div style={{display:"flex",gap:16,alignItems:"center"}}>
              <Donut data={spending} total={fmt(totalSpend)}/>
              <div style={{flex:1}}>
                {spending.map((s,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                    <div style={{display:"flex",gap:7,alignItems:"center"}}>
                      <div style={{width:9,height:9,borderRadius:"50%",background:s.color,flexShrink:0}}/>
                      <span style={{fontSize:12,color:"#374151"}}>{s.label}</span>
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <div style={{width:44,background:"#f3f4f6",borderRadius:10,height:5}}>
                        <div style={{background:s.color,height:"100%",width:`${s.pct}%`,borderRadius:10}}/>
                      </div>
                      <span style={{fontSize:12,fontWeight:700,color:"#111",width:28}}>{s.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }
        </Card>

        {/* GOALS */}
        <Sec>{t.savingsGoals} — {goals.length} {t.activeGoals}</Sec>
        <Card>
          {goals.length===0?<p style={{textAlign:"center",color:"#9ca3af",fontSize:13}}>{t.noGoals}</p>:
          goals.map((g,i)=>(
            <div key={g.id} onClick={()=>setSelectedGoal(g)} style={{marginBottom:i<goals.length-1?18:0,cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:20}}>{g.icon}</span>
                  <div>
                    <p style={{margin:0,fontWeight:700,fontSize:14}}>{g.name}</p>
                    <p style={{margin:"1px 0 0",fontSize:11,color:"#9ca3af"}}>${g.current.toLocaleString()} / ${g.target.toLocaleString()}</p>
                  </div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:16,fontWeight:900,color:g.color}}>{pct(g.current,g.target)}%</span>
                  <span style={{color:"#9ca3af",fontSize:12}}>›</span>
                </div>
              </div>
              <div style={{background:"#f3f4f6",borderRadius:20,height:8,overflow:"hidden"}}>
                <div style={{background:g.color,height:"100%",width:`${pct(g.current,g.target)}%`,borderRadius:20}}/>
              </div>
            </div>
          ))}
        </Card>

        {/* DEBTS */}
        <Sec>{t.debtPayoff}</Sec>
        <Card>
          {debts.length===0?<p style={{textAlign:"center",color:"#9ca3af",fontSize:13}}>{t.noDebts}</p>:<>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
            <div>
              <p style={{margin:0,fontSize:11,color:"#9ca3af"}}>{t.totalRemaining}</p>
              <p style={{margin:"3px 0 0",fontSize:22,fontWeight:900}}>{fmt(debts.reduce((s,d)=>s+d.left,0))}</p>
            </div>
            <span style={{background:"#dcfce7",color:"#16a34a",padding:"6px 14px",borderRadius:20,fontWeight:800,fontSize:12,alignSelf:"flex-start"}}>
              {pct(debts.reduce((s,d)=>s+(d.total-d.left),0),debts.reduce((s,d)=>s+d.total,0))}% {t.paidOff}
            </span>
          </div>
          {debts.map((d,i)=>(
            <div key={d.id} onClick={()=>setSelectedDebt(d)} style={{marginBottom:i<debts.length-1?14:0,cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:13,fontWeight:600}}>{d.name}</span>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:11,color:"#6b7280"}}>{fmt(d.left)} · {d.apr}% APR</span>
                  <span style={{color:"#9ca3af",fontSize:12}}>›</span>
                </div>
              </div>
              <div style={{background:"#f3f4f6",borderRadius:20,height:8,overflow:"hidden"}}>
                <div style={{background:"#22c55e",height:"100%",width:`${100-pct(d.left,d.total)}%`,borderRadius:20}}/>
              </div>
            </div>
          ))}</>}
        </Card>

        {/* BILLS */}
        <Sec>{t.upcomingBills}</Sec>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <p style={{margin:0,fontSize:13,color:"#6b7280"}}>{t.dueThisMonth}</p>
            <span style={{background:"#fee2e2",color:"#dc2626",padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:700}}>
              {fmt(bills.filter(b=>b.status!=="paid").reduce((s,b)=>s+b.amount,0))}
            </span>
          </div>
          {bills.length===0?<p style={{textAlign:"center",color:"#9ca3af",fontSize:13}}>{t.noBills}</p>:
          [...bills].sort((a,b)=>a.day-b.day).map((b,i)=>{
            const s=stStyle(b.status);
            return (
              <div key={b.id} onClick={()=>setSelectedBill(b)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"12px 0",borderBottom:i<bills.length-1?"1px solid #f3f4f6":"none",cursor:"pointer"}}>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <div style={{width:44,height:44,borderRadius:13,background:s.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:13,fontWeight:800,color:s.color}}>{b.day}</span>
                    <span style={{fontSize:9,color:"#9ca3af"}}>{t.jun}</span>
                  </div>
                  <div>
                    <p style={{margin:0,fontWeight:600,fontSize:14}}>{b.name}</p>
                    <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:700,background:s.bg,color:s.color}}>{s.label}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:16,fontWeight:800}}>{fmt(b.amount)}</span>
                  <span style={{color:"#9ca3af",fontSize:12}}>›</span>
                </div>
              </div>
            );
          })}
        </Card>

        {/* TRANSACTIONS */}
        <Sec>{t.recentTransactions} ({txList.length})</Sec>
        <Card>
          {txList.slice(0,8).map((tx,i)=>(
            <div key={tx.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              padding:"12px 0",borderBottom:i<Math.min(txList.length,8)-1?"1px solid #f3f4f6":"none"}}>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{width:40,height:40,borderRadius:12,background:tx.type==="income"?"#dcfce7":"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>
                  {tx.type==="income"?"📈":"💸"}
                </div>
                <div>
                  <p style={{margin:0,fontSize:14,fontWeight:600,color:"#111"}}>{tx.name}</p>
                  <p style={{margin:"2px 0 0",fontSize:11,color:"#9ca3af"}}>{tx.cat} · {MONTHS[tx.month]} {tx.day}</p>
                </div>
              </div>
              <span style={{fontSize:15,fontWeight:800,color:tx.type==="income"?"#16a34a":"#111"}}>
                {tx.type==="income"?"+":"-"}{fmt(tx.amount)}
              </span>
            </div>
          ))}
        </Card>

        <p style={{textAlign:"center",fontSize:11,color:"#c4c4c4",marginTop:8}}>{t.copyright}</p>
      </div>
    </div>
  );
}
