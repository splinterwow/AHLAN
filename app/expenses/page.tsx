"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { Plus, DollarSign, Building, User, PenTool, Edit, Trash2, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

// --- Interfeyslar ---
interface Expense {
  id: number;
  amount: string;
  date: string;
  supplier: number;
  supplier_name: string;
  comment: string;
  expense_type: number;
  expense_type_name: string;
  object: number;
  object_name?: string;
  status: string;
}

interface Property {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  company_name: string;
}

interface ExpenseType {
  id: number;
  name: string;
}

const API_BASE_URL = "http://api.ahlan.uz";

// Boshlang'ich formData ni aniq belgilash
const initialFormData = {
  object: "",
  supplier: "",
  amount: "",
  expense_type: "",
  date: new Date().toISOString().split("T")[0],
  comment: "",
  status: "",
};

// --- Komponent ---
export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [formData, setFormData] = useState(initialFormData);
  const [filters, setFilters] = useState({
    object: "",
    expense_type: "",
    dateRange: "all",
  });
  const [isClient, setIsClient] = useState(false);
  const [addExpenseTypeOpen, setAddExpenseTypeOpen] = useState(false);
  const [newExpenseTypeName, setNewExpenseTypeName] = useState("");

  // --- API So'rovlari uchun Headerlar ---
  const getAuthHeaders = useCallback(() => {
    if (!accessToken) return {};
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
  }, [accessToken]);

  // --- Ma'lumotlarni yuklash funksiyalari ---
  const fetchApiData = useCallback(
    async (endpoint: string, setter: Function, errorMsg: string) => {
      if (!accessToken) return;
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "GET",
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: `Serverdan javob o'qilmadi (Status: ${response.status})` }));
          throw new Error(`${errorMsg} (Status: ${response.status}): ${errorData.detail || JSON.stringify(errorData)}`);
        }
        const data = await response.json();
        setter(data.results || data);
      } catch (error: any) {
        toast({ title: "Xatolik", description: error.message || errorMsg, variant: "destructive" });
        setter([]);
      }
    },
    [accessToken, getAuthHeaders]
  );

  const fetchProperties = useCallback(() => fetchApiData("/objects/", setProperties, "Obyektlarni yuklashda xatolik"), [fetchApiData]);
  const fetchSuppliers = useCallback(() => fetchApiData("/suppliers/", setSuppliers, "Yetkazib beruvchilarni yuklashda xatolik"), [fetchApiData]);
  const fetchExpenseTypes = useCallback(() => fetchApiData("/expense-types/", setExpenseTypes, "Xarajat turlarini yuklashda xatolik"), [fetchApiData]);

  const fetchExpenses = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/expenses/`;
      const queryParams = new URLSearchParams();
      if (filters.object && filters.object !== "all") queryParams.append("object", filters.object);
      if (filters.expense_type && filters.expense_type !== "all") queryParams.append("expense_type", filters.expense_type);
      if (filters.dateRange && filters.dateRange !== "all") {
        const today = new Date();
        let startDate = new Date(today);
        switch (filters.dateRange) {
          case "today": startDate.setHours(0, 0, 0, 0); break;
          case "week": startDate.setDate(today.getDate() - 7); break;
          case "month": startDate.setMonth(today.getMonth() - 1); break;
          case "quarter": startDate.setMonth(today.getMonth() - 3); break;
          case "year": startDate.setFullYear(today.getFullYear() - 1); break;
        }
        queryParams.append("date__gte", startDate.toISOString().split("T")[0]);
        if (filters.dateRange === "today") {
          queryParams.append("date__lte", today.toISOString().split("T")[0]);
        }
      }
      if (queryParams.toString()) url += `?${queryParams.toString()}`;

      const response = await fetch(url, { method: "GET", headers: getAuthHeaders() });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Serverdan javob o'qilmadi (Status: ${response.status})` }));
        throw new Error(`Xarajatlar yuklanmadi (Status: ${response.status}): ${errorData.detail || JSON.stringify(errorData)}`);
      }
      const data = await response.json();
      setExpenses(data.results || data);
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message || "Xarajatlar yuklashda xatolik", variant: "destructive" });
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, getAuthHeaders, filters]);

  // --- CRUD Operatsiyalari ---
  const createExpense = async (expenseData: any, action: "save" | "saveAndAdd" | "saveAndContinue") => {
    if (!accessToken) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(expenseData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403) throw new Error("Ruxsat yo'q (Faqat admin qo'shishi mumkin).");
        const errorMessages = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('\n');
        throw new Error(`Xarajat qo'shishda xatolik (Status: ${response.status}).\n${errorMessages || 'Serverdan javob olinmadi'}`);
      }
      const newExpense: Expense = await response.json();
      toast({ title: "Muvaffaqiyat", description: "Xarajat muvaffaqiyatli qo'shildi" });
      fetchExpenses();

      if (action === "save") {
        setOpen(false);
        setFormData(initialFormData);
      } else if (action === "saveAndAdd") {
        setFormData(initialFormData);
      } else if (action === "saveAndContinue") {
        setFormData(initialFormData);
      }
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchExpenseById = async (id: number) => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/${id}/`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Serverdan javob o'qilmadi (Status: ${response.status})` }));
        throw new Error(`Xarajatni olishda xatolik (ID: ${id}, Status: ${response.status}): ${errorData.detail || JSON.stringify(errorData)}`);
      }
      const data: Expense = await response.json();
      setCurrentExpense(data);
      setFormData({
        object: data.object?.toString() || "",
        supplier: data.supplier?.toString() || "",
        amount: data.amount?.toString() || "0",
        expense_type: data.expense_type?.toString() || "",
        date: data.date ? data.date.split("T")[0] : new Date().toISOString().split("T")[0],
        comment: data.comment || "",
        status: data.status || "",
      });
      setEditOpen(true);
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    }
  };

  const updateExpense = async (id: number, expenseData: any, action: "save" | "saveAndAdd" | "saveAndContinue") => {
    if (!accessToken) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/${id}/`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(expenseData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403) throw new Error("Ruxsat yo'q (Faqat admin yangilashi mumkin).");
        const errorMessages = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('\n');
        throw new Error(`Xarajatni yangilashda xatolik (Status: ${response.status}).\n${errorMessages || 'Serverdan javob olinmadi'}`);
      }
      const updatedExpense: Expense = await response.json();
      toast({ title: "Muvaffaqiyat", description: "Xarajat muvaffaqiyatli yangilandi" });
      fetchExpenses();

      if (action === "save") {
        setEditOpen(false);
        setCurrentExpense(null);
        setFormData(initialFormData);
      } else if (action === "saveAndAdd") {
        setEditOpen(false);
        setCurrentExpense(null);
        setFormData(initialFormData);
        setOpen(true);
      } else if (action === "saveAndContinue") {
        setCurrentExpense(updatedExpense);
        setFormData({
          object: updatedExpense.object?.toString() || "",
          supplier: updatedExpense.supplier?.toString() || "",
          amount: updatedExpense.amount?.toString() || "0",
          expense_type: updatedExpense.expense_type?.toString() || "",
          date: updatedExpense.date ? updatedExpense.date.split("T")[0] : new Date().toISOString().split("T")[0],
          comment: updatedExpense.comment || "",
          status: updatedExpense.status || "",
        });
      }
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteExpense = async (id: number) => {
    if (!accessToken) return;
    if (!window.confirm(`${id}-ID'li xarajatni o'chirishni tasdiqlaysizmi?`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/${id}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (response.status === 204) {
        toast({ title: "Muvaffaqiyat", description: "Xarajat muvaffaqiyatli o'chirildi" });
        fetchExpenses();
      } else if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403) throw new Error("Ruxsat yo'q (Faqat admin o'chirishi mumkin).");
        throw new Error(`Xarajatni o'chirishda xatolik (Status: ${response.status}): ${errorData.detail || JSON.stringify(errorData)}`);
      } else {
        toast({ title: "Muvaffaqiyat", description: "Xarajat muvaffaqiyatli o'chirildi" });
        fetchExpenses();
      }
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    }
  };

  const createExpenseType = async () => {
    if (!accessToken || !newExpenseTypeName.trim()) {
      toast({ title: "Xatolik", description: "Xarajat turi nomini kiriting", variant: "destructive" });
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/expense-types/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newExpenseTypeName.trim() }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Xarajat turi qo'shilmadi: ${errorData.detail || "Server xatosi"}`);
      }
      const newType = await response.json();
      setExpenseTypes((prev) => [...prev, newType]);
      setFormData((prev) => ({ ...prev, expense_type: newType.id.toString() }));
      setNewExpenseTypeName("");
      setAddExpenseTypeOpen(false);
      toast({ title: "Muvaffaqiyat", description: `${newType.name} xarajat turi qo'shildi` });
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    }
  };

  // --- useEffect Hooks ---
  useEffect(() => {
    setIsClient(true);
    const token = localStorage.getItem("access_token");
    if (token) {
      setAccessToken(token);
    } else {
      toast({ title: "Kirish", description: "Iltimos tizimga kiring", variant: "destructive" });
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (accessToken) {
      fetchProperties();
      fetchSuppliers();
      fetchExpenseTypes();
      fetchExpenses();
    }
  }, [accessToken, filters, fetchProperties, fetchSuppliers, fetchExpenseTypes, fetchExpenses]);

  // --- Event Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const validateFormData = () => {
    const requiredFields: (keyof typeof initialFormData)[] = ['object', 'supplier', 'amount', 'expense_type', 'date', 'comment', 'status'];
    for (const field of requiredFields) {
      if (field === 'amount') {
        if (formData[field] === "" || isNaN(Number(formData[field])) || Number(formData[field]) < 0) {
          toast({ title: "Xatolik", description: `"Summa" to'g'ri musbat raqam bo'lishi kerak.`, variant: "destructive" });
          return false;
        }
      } else if (!formData[field]) {
        toast({ title: "Xatolik", description: `"${field}" maydoni to'ldirilishi shart.`, variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent, action: "save" | "saveAndAdd" | "saveAndContinue") => {
    e.preventDefault();
    if (!validateFormData()) return;

    const expenseData = {
      object: Number(formData.object),
      supplier: Number(formData.supplier),
      amount: formData.amount,
      expense_type: Number(formData.expense_type),
      date: formData.date,
      comment: formData.comment,
      status: formData.status,
    };
    createExpense(expenseData, action);
  };

  const handleEditSubmit = (e: React.FormEvent, action: "save" | "saveAndAdd" | "saveAndContinue") => {
    e.preventDefault();
    if (!currentExpense) return;
    if (!validateFormData()) return;

    const expenseData = {
      object: Number(formData.object),
      supplier: Number(formData.supplier),
      amount: formData.amount,
      expense_type: Number(formData.expense_type),
      date: formData.date,
      comment: formData.comment,
      status: formData.status,
    };
    updateExpense(currentExpense.id, expenseData, action);
  };

  const handleOpenEditDialog = (expenseId: number) => {
    fetchExpenseById(expenseId);
  };

  // --- Helper Funksiyalar ---
  const getExpenseTypeStyle = (typeName: string | undefined): string => {
    if (!typeName) return "bg-gray-100 text-gray-800";
    switch (typeName.toLowerCase()) {
      case "qurilish materiallari": return "bg-blue-100 text-blue-800";
      case "ishchi kuchi": return "bg-green-100 text-green-800";
      case "jihozlar": return "bg-purple-100 text-purple-800";
      case "kommunal xizmatlar": return "bg-yellow-100 text-yellow-800";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const filteredExpenses = expenses.filter((expense) => {
    const searchTermLower = searchTerm.toLowerCase();
    const objectMatch = !filters.object || filters.object === "all" || expense.object?.toString() === filters.object;
    const typeMatch = !filters.expense_type || filters.expense_type === "all" || expense.expense_type?.toString() === filters.expense_type;

    if (!objectMatch || !typeMatch) return false;

    return [
      expense.comment?.toLowerCase(),
      expense.supplier_name?.toLowerCase(),
      expense.expense_type_name?.toLowerCase(),
      expense.amount?.toString().toLowerCase(),
      properties.find(p => p.id === expense.object)?.name?.toLowerCase(),
      expense.status?.toLowerCase()
    ].some(field => field?.includes(searchTermLower));
  });

  const getTotalAmount = (expensesList: Expense[]) => {
    return expensesList.reduce((total, expense) => total + Number(expense.amount || 0), 0);
  };

  const getExpensesByType = (expensesList: Expense[]) => {
    const totalAmountOverall = getTotalAmount(expensesList);
    if (totalAmountOverall === 0) return [];

    const expensesByTypeMap = new Map<string, { total: number, typeId: number }>();
    expensesList.forEach((expense) => {
      const typeName = expense.expense_type_name || "Noma'lum";
      const current = expensesByTypeMap.get(typeName) || { total: 0, typeId: expense.expense_type };
      current.total += Number(expense.amount || 0);
      expensesByTypeMap.set(typeName, current);
    });

    return Array.from(expensesByTypeMap.entries()).map(([typeName, data]) => ({
      type: data.typeId,
      label: typeName,
      total: data.total,
      percentage: (data.total / totalAmountOverall) * 100,
    }));
  };

  const expensesByType = getExpensesByType(filteredExpenses);

  const formatCurrency = (amount: number) => {
    if (!isClient) return `${amount} UZS`;
    return amount.toLocaleString("uz-UZ", { style: "currency", currency: "UZS", minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const getObjectName = (objectId: number | undefined) => {
    if (objectId === undefined) return "Noma'lum";
    return properties.find(p => p.id === objectId)?.name || `ID: ${objectId}`;
  };

  // --- Jadvalni Render qilish ---
  function renderExpensesTable(expensesToRender: Expense[]) {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[200px] border rounded-md">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="ml-2 text-muted-foreground">Yuklanmoqda...</p>
        </div>
      );
    }
    if (expensesToRender.length === 0 && (expenses.length > 0 || searchTerm || filters.object || filters.expense_type || filters.dateRange !== 'all')) {
      return (
        <div className="flex items-center justify-center h-[200px] border rounded-md">
          <p className="text-muted-foreground text-center">Filtr yoki qidiruvga mos xarajatlar topilmadi.<br/>Filtrlarni tozalab ko'ring.</p>
        </div>
      );
    }
    if (expensesToRender.length === 0 && expenses.length === 0) {
      return (
        <div className="flex items-center justify-center h-[200px] border rounded-md">
          <p className="text-muted-foreground">Hozircha xarajatlar mavjud emas. Yangi xarajat qo'shing.</p>
        </div>
      );
    }

    return (
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead>Obyekt</TableHead>
              <TableHead>Yetkazib beruvchi</TableHead>
              <TableHead>Tavsif</TableHead>
              <TableHead>Turi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Summa</TableHead>
              <TableHead className="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expensesToRender.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{expense.id}</TableCell>
                <TableCell>{expense.date ? new Date(expense.date).toLocaleDateString('uz-UZ') : "-"}</TableCell>
                <TableCell>{getObjectName(expense.object)}</TableCell>
                <TableCell>{expense.supplier_name || `ID: ${expense.supplier}` || "Noma'lum"}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={expense.comment}>{expense.comment || "-"}</TableCell>
                <TableCell>
                  {expense.expense_type_name ? (
                    <Badge variant="outline" className={getExpenseTypeStyle(expense.expense_type_name)}>
                      {expense.expense_type_name}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Noma'lum (ID: {expense.expense_type})</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={expense.status === 'To‘langan' ? 'success' : (expense.status === 'Kutilmoqda' ? 'warning' : 'secondary')}>
                    {expense.status || "Noma'lum"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(Number(expense.amount || 0))}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(expense.id)} title="Tahrirlash">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteExpense(expense.id)} title="O'chirish">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {expensesToRender.length > 0 && (
              <TableRow className="bg-muted hover:bg-muted font-bold">
                <TableCell colSpan={7} className="text-right">Jami:</TableCell>
                <TableCell className="text-right">{formatCurrency(getTotalAmount(expensesToRender))}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  }

  // --- JSX ---
  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Header */}
      <div className="border-b sticky top-0 bg-background z-10">
        <div className="flex h-16 items-center px-4 container mx-auto">
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </div>

      {/* Asosiy kontent */}
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 container mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
          <h2 className="text-3xl font-bold tracking-tight">Xarajatlar</h2>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (isOpen) {
              setFormData(initialFormData);
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={!accessToken}>
                <Plus className="mr-2 h-4 w-4" />
                Yangi xarajat
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Yangi xarajat qo'shish</DialogTitle>
                <DialogDescription>Xarajat ma'lumotlarini kiriting. * bilan belgilangan maydonlar majburiy.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[65vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="amount">Summa (UZS) *</Label>
                      <Input
                        required
                        id="amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="Masalan: 1500000.50"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="date">Xarajat sanasi *</Label>
                      <Input
                        required
                        id="date"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="supplier">Yetkazib beruvchi *</Label>
                      <Select
                        required
                        value={formData.supplier}
                        onValueChange={(value) => handleSelectChange("supplier", value)}
                      >
                        <SelectTrigger id="supplier">
                          <SelectValue placeholder="Yetkazib beruvchini tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.length === 0 && <p className="p-2 text-sm text-muted-foreground">Yuklanmoqda...</p>}
                          {suppliers.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.company_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="expense_type">Xarajat turi *</Label>
                      <div className="flex items-center space-x-2">
                        <Select
                          required
                          value={formData.expense_type}
                          onValueChange={(value) => handleSelectChange("expense_type", value)}
                        >
                          <SelectTrigger id="expense_type">
                            <SelectValue placeholder="Xarajat turini tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            {expenseTypes.length === 0 && <p className="p-2 text-sm text-muted-foreground">Yuklanmoqda...</p>}
                            {expenseTypes.map((t) => (
                              <SelectItem key={t.id} value={t.id.toString()}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Dialog open={addExpenseTypeOpen} onOpenChange={setAddExpenseTypeOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              title="Yangi xarajat turi qo'shish"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Yangi xarajat turi qo'shish</DialogTitle>
                              <DialogDescription>
                                Yangi xarajat turi nomini kiriting.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="space-y-1">
                                <Label htmlFor="new_expense_type_name">Nomi *</Label>
                                <Input
                                  id="new_expense_type_name"
                                  value={newExpenseTypeName}
                                  onChange={(e) => setNewExpenseTypeName(e.target.value)}
                                  placeholder="Masalan: Transport xarajatlari"
                                  required
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="button" onClick={createExpenseType} disabled={!newExpenseTypeName.trim() || isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Qo'shish
                              </Button>
                              <Button type="button" variant="outline" onClick={() => { setAddExpenseTypeOpen(false); setNewExpenseTypeName(""); }}>
                                Bekor qilish
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="object">Obyekt *</Label>
                      <Select
                        required
                        value={formData.object}
                        onValueChange={(value) => handleSelectChange("object", value)}
                      >
                        <SelectTrigger id="object">
                          <SelectValue placeholder="Obyektni tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {properties.length === 0 && <p className="p-2 text-sm text-muted-foreground">Yuklanmoqda...</p>}
                          {properties.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="status">Status *</Label>
                      <Select
                        required
                        value={formData.status}
                        onValueChange={(value) => handleSelectChange("status", value)}
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Statusni tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="To‘langan">To‘langan</SelectItem>
                          <SelectItem value="Kutilmoqda">Kutilmoqda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="comment">Tavsif / Izoh *</Label>
                    <Textarea
                      required
                      id="comment"
                      name="comment"
                      value={formData.comment}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Xarajat haqida qo'shimcha ma'lumot..."
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row sm:justify-end sm:space-x-2 space-y-2 sm:space-y-0 pt-4">
                <Button
                  type="button"
                  className="bg-green-500 hover:bg-green-600 w-full sm:w-auto"
                  onClick={(e) => handleSubmit(e, "save")}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Saqlash
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  Bekor qilish
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tahrirlash modali */}
        <Dialog open={editOpen} onOpenChange={(isOpen) => {
          setEditOpen(isOpen);
          if (!isOpen) {
            setCurrentExpense(null);
            setFormData(initialFormData);
          }
        }}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Xarajatni tahrirlash (ID: {currentExpense?.id})</DialogTitle>
              <DialogDescription>Xarajat ma'lumotlarini yangilang. * bilan belgilangan maydonlar majburiy.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto py-4 pr-2">
              {!currentExpense ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="edit-amount">Summa (UZS) *</Label>
                      <Input
                        required
                        id="edit-amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="Masalan: 1500000.50"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-date">Xarajat sanasi *</Label>
                      <Input
                        required
                        id="edit-date"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-supplier">Yetkazib beruvchi *</Label>
                      <Select
                        required
                        value={formData.supplier}
                        onValueChange={(value) => handleSelectChange("supplier", value)}
                      >
                        <SelectTrigger id="edit-supplier">
                          <SelectValue placeholder="Yetkazib beruvchini tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.length === 0 && <p className="p-2 text-sm text-muted-foreground">Yuklanmoqda...</p>}
                          {suppliers.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.company_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="edit-expense_type">Xarajat turi *</Label>
                      <div className="flex items-center space-x-2">
                        <Select
                          required
                          value={formData.expense_type}
                          onValueChange={(value) => handleSelectChange("expense_type", value)}
                        >
                          <SelectTrigger id="edit-expense_type">
                            <SelectValue placeholder="Xarajat turini tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            {expenseTypes.length === 0 && <p className="p-2 text-sm text-muted-foreground">Yuklanmoqda...</p>}
                            {expenseTypes.map((t) => (
                              <SelectItem key={t.id} value={t.id.toString()}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Dialog open={addExpenseTypeOpen} onOpenChange={setAddExpenseTypeOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon" title="Yangi xarajat turi qo‘shish">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Yangi xarajat turi qo‘shish</DialogTitle>
                              <DialogDescription>Yangi xarajat turi nomini kiriting.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="space-y-1">
                                <Label htmlFor="new_expense_type_name_edit">Nomi *</Label>
                                <Input
                                  id="new_expense_type_name_edit"
                                  value={newExpenseTypeName}
                                  onChange={(e) => setNewExpenseTypeName(e.target.value)}
                                  placeholder="Masalan: Boshqa xarajatlar"
                                  required
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="button" onClick={createExpenseType} disabled={!newExpenseTypeName.trim() || isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Qo‘shish
                              </Button>
                              <Button type="button" variant="outline" onClick={() => { setAddExpenseTypeOpen(false); setNewExpenseTypeName(""); }}>
                                Bekor qilish
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-object">Obyekt *</Label>
                      <Select
                        required
                        value={formData.object}
                        onValueChange={(value) => handleSelectChange("object", value)}
                      >
                        <SelectTrigger id="edit-object">
                          <SelectValue placeholder="Obyektni tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {properties.length === 0 && <p className="p-2 text-sm text-muted-foreground">Yuklanmoqda...</p>}
                          {properties.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-status">Status *</Label>
                      <Select
                        required
                        value={formData.status}
                        onValueChange={(value) => handleSelectChange("status", value)}
                      >
                        <SelectTrigger id="edit-status">
                          <SelectValue placeholder="Statusni tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="To‘langan">To‘langan</SelectItem>
                          <SelectItem value="Kutilmoqda">Kutilmoqda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="edit-comment">Tavsif / Izoh *</Label>
                    <Textarea
                      required
                      id="edit-comment"
                      name="comment"
                      value={formData.comment}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Xarajat haqida qo‘shimcha ma‘lumot..."
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex flex-col sm:flex-row sm:justify-end sm:space-x-2 space-y-2 sm:space-y-0 pt-4 border-t">
              <Button
                type="button"
                className="bg-green-500 hover:bg-green-600 w-full sm:w-auto"
                onClick={(e) => handleEditSubmit(e, "save")}
                disabled={isSubmitting || !currentExpense}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Saqlash
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={(e) => handleEditSubmit(e, "saveAndAdd")}
                disabled={isSubmitting || !currentExpense}
              >
                Saqlash va Yangi qo‘shish
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={(e) => handleEditSubmit(e, "saveAndContinue")}
                disabled={isSubmitting || !currentExpense}
              >
                Saqlash va Tahrirda qolish
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setEditOpen(false)}
                disabled={isSubmitting}
              >
                Bekor qilish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Statistik Kartalar */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami xarajatlar</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatCurrency(getTotalAmount(filteredExpenses))}</div>
              <p className="text-xs text-muted-foreground">Filtrlangan/qidirilgan xarajatlar</p>
            </CardContent>
          </Card>
          {loading ? (
            <>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Yuklanmoqda...</CardTitle></CardHeader><CardContent><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Yuklanmoqda...</CardTitle></CardHeader><CardContent><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Yuklanmoqda...</CardTitle></CardHeader><CardContent><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>
            </>
          ) : (
            <>
              {expensesByType.sort((a, b) => b.total - a.total).slice(0, 3).map((expenseInfo) => (
                <Card key={expenseInfo.label}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium truncate" title={expenseInfo.label}>{expenseInfo.label}</CardTitle>
                    {expenseInfo.label.toLowerCase().includes('material') && <Building className="h-4 w-4 text-muted-foreground" />}
                    {expenseInfo.label.toLowerCase().includes('ishchi') && <User className="h-4 w-4 text-muted-foreground" />}
                    {expenseInfo.label.toLowerCase().includes('jihoz') && <PenTool className="h-4 w-4 text-muted-foreground" />}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(expenseInfo.total)}</div>
                    <p className="text-xs text-muted-foreground">{expenseInfo.percentage.toFixed(1)}% jami xarajatlardan</p>
                  </CardContent>
                </Card>
              ))}
              {Array.from({ length: Math.max(0, 3 - expensesByType.length) }).map((_, index) => (
                <Card key={`placeholder-${index}`} className="opacity-50">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Xarajat turi</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold">-</div></CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        {/* Xarajatlar Jadvali va Filtrlar */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <Input
                  placeholder="Tavsif, Yetkazib beruvchi, Turi, Summa yoki Status bo'yicha qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs md:max-w-sm w-full"
                  disabled={loading}
                />
                <div className="flex flex-wrap justify-start md:justify-end gap-2 w-full md:w-auto">
                  <Select value={filters.object} onValueChange={(value) => handleFilterChange("object", value)} disabled={loading}>
                    <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Obyekt bo'yicha" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha obyektlar</SelectItem>
                      {properties.map((p) => (<SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Select value={filters.expense_type} onValueChange={(value) => handleFilterChange("expense_type", value)} disabled={loading}>
                    <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Turi bo'yicha" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha turlar</SelectItem>
                      {expenseTypes.map((t) => (<SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange("dateRange", value)} disabled={loading}>
                    <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Sana oralig'i" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha vaqt</SelectItem>
                      <SelectItem value="today">Bugun</SelectItem>
                      <SelectItem value="week">Oxirgi 7 kun</SelectItem>
                      <SelectItem value="month">Oxirgi 30 kun</SelectItem>
                      <SelectItem value="quarter">Oxirgi 3 oy</SelectItem>
                      <SelectItem value="year">Oxirgi 1 yil</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => { setFilters({ object: "", expense_type: "", dateRange: "all" }); setSearchTerm(""); }} disabled={loading}>
                    Tozalash
                  </Button>
                </div>
              </div>
              {renderExpensesTable(filteredExpenses)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}