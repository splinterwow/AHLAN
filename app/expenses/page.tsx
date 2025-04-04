"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/main-nav";
import { Search } from "@/components/search";
import { UserNav } from "@/components/user-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { Plus, DollarSign, Building, User, PenTool, Edit, Trash2, Loader2 } from "lucide-react"; // Loader2 qo'shildi
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// --- Interfeyslar ---
interface Expense {
  id: number;
  amount: string;
  date: string;
  supplier: number; // ID raqami
  supplier_name: string;
  comment: string;
  expense_type: number; // ID raqami
  expense_type_name: string;
  object: number; // ID raqami
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

const API_BASE_URL = "http://api.ahlan.uz"; // API manzilini konstantaga chiqaramiz

const initialFormData = {
  object: "",
  supplier: "",
  amount: "",
  expense_type: "",
  date: new Date().toISOString().split("T")[0],
  comment: "",
  status: "Kutilmoqda",
};

// --- Komponent ---
export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Yuborish jarayonini kuzatish
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false); // Qo'shish dialogi
  const [editOpen, setEditOpen] = useState(false); // Tahrirlash dialogi
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [formData, setFormData] = useState(initialFormData); // Boshlang'ich qiymat bilan
  const [filters, setFilters] = useState({
    object: "",
    expense_type: "",
    dateRange: "all",
  });
  const [isClient, setIsClient] = useState(false);

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
        if (!response.ok) throw new Error(`${errorMsg} (Status: ${response.status})`);
        const data = await response.json();
        // Pagination mavjudligini tekshirish
        setter(data.results || data);
      } catch (error: any) {
        toast({ title: "Xatolik", description: error.message || errorMsg, variant: "destructive" });
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
      if (filters.expense_type && filters.expense_type !== "all")
        queryParams.append("expense_type", filters.expense_type);
      if (filters.dateRange && filters.dateRange !== "all") {
        const today = new Date();
        let startDate = new Date();
        switch (filters.dateRange) {
          case "today": startDate.setHours(0, 0, 0, 0); break;
          case "week": startDate.setDate(today.getDate() - 7); break;
          case "month": startDate.setMonth(today.getMonth() - 1); break;
          case "quarter": startDate.setMonth(today.getMonth() - 3); break;
          case "year": startDate.setFullYear(today.getFullYear() - 1); break;
        }
        queryParams.append("date__gte", startDate.toISOString().split("T")[0]);
      }
      // Qidiruv terminini ham qo'shish (agar backend qo'llab-quvvatlasa)
      // if (searchTerm) queryParams.append("search", searchTerm); // Buni backendga qarab sozlash kerak

      if (queryParams.toString()) url += `?${queryParams.toString()}`;

      const response = await fetch(url, { method: "GET", headers: getAuthHeaders() });
      if (!response.ok) throw new Error(`Xarajatlar yuklanmadi (Status: ${response.status})`);
      const data = await response.json();
      setExpenses(data.results || data); // Paginationni hisobga olish
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message || "Xarajatlar yuklashda xatolik", variant: "destructive" });
      setExpenses([]); // Xatolik bo'lsa bo'shatish
    } finally {
      setLoading(false);
    }
  }, [accessToken, getAuthHeaders, filters]); // SearchTerm ni ham qo'shish mumkin

  // --- CRUD Operatsiyalari ---
  const createExpense = async (expenseData: any) => {
    if (!accessToken) return;
    setIsSubmitting(true); // Yuborish boshlandi
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(expenseData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Xatolik javobini olishga urinish
        if (response.status === 403) throw new Error("Ruxsat yo'q (Faqat admin qo'shishi mumkin).");
        // Backenddan kelgan xato xabarlarini ko'rsatish
        const errorMessages = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('\n');
        throw new Error(`Xarajat qo'shishda xatolik (Status: ${response.status}).\n${errorMessages || 'No details'}`);
      }
      toast({ title: "Muvaffaqiyat", description: "Xarajat muvaffaqiyatli qo'shildi" });
      fetchExpenses(); // Ro'yxatni yangilash
      setOpen(false); // Dialog oynasini yopish
      setFormData(initialFormData); // Formani tozalash
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false); // Yuborish tugadi
    }
  };

  const fetchExpenseById = async (id: number) => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/${id}/`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(`Xarajatni olishda xatolik (ID: ${id}, Status: ${response.status})`);
      const data = await response.json();
      setCurrentExpense(data);
      // Ma'lumotlarni formaga yuklash (ID larni stringga o'tkazish)
      setFormData({
        object: data.object?.toString() || "", // Agar object null bo'lsa
        supplier: data.supplier?.toString() || "", // Agar supplier null bo'lsa
        amount: data.amount?.toString() || "",
        expense_type: data.expense_type?.toString() || "", // Agar expense_type null bo'lsa
        date: data.date,
        comment: data.comment,
        status: data.status,
      });
      setEditOpen(true); // Tahrirlash dialogini ochish
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    }
  };

  const updateExpense = async (id: number, expenseData: any) => {
    if (!accessToken) return;
    setIsSubmitting(true); // Yuborish boshlandi
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/${id}/`, {
        method: "PUT", // PUT yoki PATCH (backendga qarab)
        headers: getAuthHeaders(),
        body: JSON.stringify(expenseData),
      });
      if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
        if (response.status === 403) throw new Error("Ruxsat yo'q (Faqat admin yangilashi mumkin).");
        const errorMessages = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('\n');
        throw new Error(`Xarajatni yangilashda xatolik (Status: ${response.status}).\n${errorMessages || 'No details'}`);
      }
      toast({ title: "Muvaffaqiyat", description: "Xarajat muvaffaqiyatli yangilandi" });
      fetchExpenses(); // Ro'yxatni yangilash
      setEditOpen(false); // Dialog oynasini yopish
      setCurrentExpense(null); // Joriy xarajatni tozalash
      setFormData(initialFormData); // Formani tozalash
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false); // Yuborish tugadi
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
      if (!response.ok) { // 204 No Content ham OK hisoblanadi
         if (response.status === 403) throw new Error("Ruxsat yo'q (Faqat admin o'chirishi mumkin).");
         throw new Error(`Xarajatni o'chirishda xatolik (Status: ${response.status})`);
      }
       // 204 bo'lsa response.ok true bo'lmaydi, lekin xatolik ham emas
       if (response.status === 204 || response.ok) {
         toast({ title: "Muvaffaqiyat", description: "Xarajat muvaffaqiyatli o'chirildi" });
         fetchExpenses(); // Ro'yxatni yangilash
       } else {
          throw new Error(`Xarajatni o'chirishda kutilmagan javob (Status: ${response.status})`);
       }
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    }
  };

  // --- useEffect Hooks ---
  useEffect(() => {
    setIsClient(true); // Komponent klientda yuklandi
    const token = localStorage.getItem("access_token");
    if (token) {
      setAccessToken(token);
    } else {
      toast({ title: "Kirish", description: "Iltimos tizimga kiring", variant: "destructive" });
      router.push("/login"); // Agar token bo'lmasa login sahifasiga o'tish
    }
  }, [router]);

  useEffect(() => {
    if (accessToken) {
      fetchProperties();
      fetchSuppliers();
      fetchExpenseTypes();
      fetchExpenses(); // Filtrlarga bog'liq holda chaqiriladi
    }
  }, [accessToken, filters, fetchProperties, fetchSuppliers, fetchExpenseTypes, fetchExpenses]); // filterlar o'zgarganda fetchExpenses qayta chaqiriladi

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

  // Qo'shish formasi submit bo'lganda
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validatsiya (oddiy)
    if (!formData.object || !formData.supplier || !formData.amount || !formData.expense_type || !formData.date) {
      toast({ title: "Xatolik", description: "Kerakli maydonlarni to'ldiring", variant: "destructive" });
      return;
    }
    const expenseData = {
      object: Number(formData.object), // Raqamga o'tkazish
      supplier: Number(formData.supplier), // Raqamga o'tkazish
      amount: Number(formData.amount), // Raqamga o'tkazish
      expense_type: Number(formData.expense_type), // Raqamga o'tkazish
      date: formData.date,
      comment: formData.comment,
      status: formData.status,
    };
    createExpense(expenseData);
  };

  // Tahrirlash formasi submit bo'lganda
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentExpense) return;
     // Validatsiya (oddiy)
    if (!formData.object || !formData.supplier || !formData.amount || !formData.expense_type || !formData.date) {
      toast({ title: "Xatolik", description: "Kerakli maydonlarni to'ldiring", variant: "destructive" });
      return;
    }
    const expenseData = {
      object: Number(formData.object),
      supplier: Number(formData.supplier),
      amount: Number(formData.amount),
      expense_type: Number(formData.expense_type),
      date: formData.date,
      comment: formData.comment,
      status: formData.status,
    };
    updateExpense(currentExpense.id, expenseData);
  };

  const handleOpenEditDialog = (expenseId: number) => {
    fetchExpenseById(expenseId); // Dialog ochishdan oldin ma'lumotni yuklaymiz
  };

  // --- Helper Funksiyalar ---
  const getExpenseTypeLabel = (typeId: number | undefined) => {
    if (typeId === undefined) return <Badge variant="secondary">Noma'lum</Badge>;
    const type = expenseTypes.find((et) => et.id === typeId);
    if (!type) return <Badge variant="outline">ID: {typeId}</Badge>; // Agar tur topilmasa

    // Ma'lum turlar uchun ranglar (ixtiyoriy)
    switch (type.name.toLowerCase()) {
      case "qurilish materiallari": return <Badge className="bg-blue-100 text-blue-800">{type.name}</Badge>;
      case "ishchi kuchi": return <Badge className="bg-green-100 text-green-800">{type.name}</Badge>;
      case "jihozlar": return <Badge className="bg-purple-100 text-purple-800">{type.name}</Badge>;
      case "kommunal xizmatlar": return <Badge className="bg-yellow-100 text-yellow-800">{type.name}</Badge>;
      default: return <Badge>{type.name}</Badge>;
    }
  };

  const getExpenseTypeText = (typeId: number | undefined) => {
    if (typeId === undefined) return "Noma'lum";
    const type = expenseTypes.find((et) => et.id === typeId);
    return type ? type.name : `Noma'lum tur (ID: ${typeId})`;
  };

  // Qidiruv va filtrlash natijasi
  const filteredExpenses = expenses.filter((expense) =>
    [expense.comment, expense.supplier_name, expense.expense_type_name, expense.amount.toString()] // Summani ham qo'shamiz
      .some((field) => field?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Jami summa hisoblash
  const getTotalAmount = (expensesList: Expense[]) => {
    return expensesList.reduce((total, expense) => total + Number(expense.amount || 0), 0);
  };

  // Turlar bo'yicha xarajatlar
  const getExpensesByType = (expensesList: Expense[]) => {
    const totalAmountOverall = getTotalAmount(expensesList);
    if (totalAmountOverall === 0) return []; // Agar jami summa 0 bo'lsa, bo'sh array qaytaramiz

    const expensesByTypeMap = new Map<number, { total: number }>();

    expensesList.forEach((expense) => {
      const current = expensesByTypeMap.get(expense.expense_type) || { total: 0 };
      current.total += Number(expense.amount || 0);
      expensesByTypeMap.set(expense.expense_type, current);
    });

    return Array.from(expensesByTypeMap.entries()).map(([typeId, data]) => ({
      type: typeId,
      label: getExpenseTypeText(typeId),
      total: data.total,
      percentage: (data.total / totalAmountOverall) * 100,
    }));
  };

  const expensesByType = getExpensesByType(filteredExpenses);

  // Valyutani formatlash
  const formatCurrency = (amount: number) => {
    if (!isClient) return `${amount} UZS`; // Serverda oddiy ko'rinish
    return amount.toLocaleString("uz-UZ", { style: "currency", currency: "UZS", minimumFractionDigits: 0 });
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
    if (expensesToRender.length === 0) {
      return (
        <div className="flex items-center justify-center h-[200px] border rounded-md">
          <p className="text-muted-foreground">Filtrga mos xarajatlar topilmadi</p>
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
                <TableCell>{expense.date ? new Date(expense.date).toLocaleDateString() : "-"}</TableCell>
                <TableCell>
                  {properties.find((p) => p.id === expense.object)?.name || `ID: ${expense.object}` || "Noma'lum"}
                </TableCell>
                <TableCell>{expense.supplier_name || `ID: ${expense.supplier}` || "Noma'lum"}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={expense.comment}>{expense.comment || "-"}</TableCell>
                <TableCell>{getExpenseTypeLabel(expense.expense_type)}</TableCell>
                <TableCell>
                  <Badge variant={expense.status === 'To‘langan' ? 'success' : 'warning'}>
                    {expense.status}
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
             {/* Jami qator */}
             <TableRow className="bg-muted hover:bg-muted font-bold">
                 <TableCell colSpan={7} className="text-right">Jami:</TableCell>
                 <TableCell className="text-right">{formatCurrency(getTotalAmount(expensesToRender))}</TableCell>
                 <TableCell></TableCell>
            </TableRow>
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
            {/* <Search /> Qo'shimcha search komponenti, hozircha o'chirilgan */}
            <UserNav />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 container mx-auto">
        {/* Sarlavha va Qo'shish tugmasi */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
          <h2 className="text-3xl font-bold tracking-tight">Xarajatlar</h2>
          <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) setFormData(initialFormData); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Yangi xarajat
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Yangi xarajat qo'shish</DialogTitle>
                  <DialogDescription>Yangi xarajat ma'lumotlarini kiriting. * bilan belgilangan maydonlar majburiy.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Chap ustun */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label htmlFor="object">Obyekt *</Label>
                        <Select required value={formData.object} onValueChange={(value) => handleSelectChange("object", value)}>
                          <SelectTrigger id="object"><SelectValue placeholder="Obyektni tanlang" /></SelectTrigger>
                          <SelectContent>
                            {properties.map((p) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                       <div className="space-y-1">
                        <Label htmlFor="supplier">Yetkazib beruvchi *</Label>
                        <Select required value={formData.supplier} onValueChange={(value) => handleSelectChange("supplier", value)}>
                          <SelectTrigger id="supplier"><SelectValue placeholder="Yetkazib beruvchini tanlang" /></SelectTrigger>
                          <SelectContent>
                            {suppliers.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.company_name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                       <div className="space-y-1">
                        <Label htmlFor="amount">Summa (UZS) *</Label>
                        <Input required id="amount" name="amount" type="number" step="0.01" min="0" value={formData.amount} onChange={handleChange} placeholder="Masalan: 1500000.50"/>
                      </div>
                    </div>
                    {/* O'ng ustun */}
                    <div className="space-y-4">
                       <div className="space-y-1">
                        <Label htmlFor="expense_type">Xarajat turi *</Label>
                        <Select required value={formData.expense_type} onValueChange={(value) => handleSelectChange("expense_type", value)}>
                          <SelectTrigger id="expense_type"><SelectValue placeholder="Xarajat turini tanlang" /></SelectTrigger>
                          <SelectContent>
                            {expenseTypes.map((t) => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                       <div className="space-y-1">
                        <Label htmlFor="date">Xarajat sanasi *</Label>
                        <Input required id="date" name="date" type="date" value={formData.date} onChange={handleChange} />
                      </div>
                       <div className="space-y-1">
                        <Label htmlFor="status">Status *</Label>
                        <Select required value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                          <SelectTrigger id="status"><SelectValue placeholder="Statusni tanlang" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="To‘langan">To‘langan</SelectItem>
                            <SelectItem value="Kutilmoqda">Kutilmoqda</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* To'liq kenglik */}
                     <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="comment">Tavsif / Izoh</Label>
                        <Textarea id="comment" name="comment" value={formData.comment} onChange={handleChange} rows={3} placeholder="Xarajat haqida qo'shimcha ma'lumot..."/>
                      </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Bekor qilish</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Saqlash
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tahrirlash Dialogi */}
        <Dialog open={editOpen} onOpenChange={(isOpen) => { setEditOpen(isOpen); if (!isOpen) { setCurrentExpense(null); setFormData(initialFormData); } }}>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Xarajatni tahrirlash (ID: {currentExpense?.id})</DialogTitle>
                 <DialogDescription>Xarajat ma'lumotlarini yangilang. * bilan belgilangan maydonlar majburiy.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Chap ustun */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label htmlFor="edit-object">Obyekt *</Label>
                        <Select required value={formData.object} onValueChange={(value) => handleSelectChange("object", value)}>
                          <SelectTrigger id="edit-object"><SelectValue placeholder="Obyektni tanlang" /></SelectTrigger>
                          <SelectContent>
                            {properties.map((p) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                       <div className="space-y-1">
                        <Label htmlFor="edit-supplier">Yetkazib beruvchi *</Label>
                        <Select required value={formData.supplier} onValueChange={(value) => handleSelectChange("supplier", value)}>
                          <SelectTrigger id="edit-supplier"><SelectValue placeholder="Yetkazib beruvchini tanlang" /></SelectTrigger>
                          <SelectContent>
                            {suppliers.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.company_name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                       <div className="space-y-1">
                        <Label htmlFor="edit-amount">Summa (UZS) *</Label>
                        <Input required id="edit-amount" name="amount" type="number" step="0.01" min="0" value={formData.amount} onChange={handleChange} placeholder="Masalan: 1500000.50"/>
                      </div>
                    </div>
                    {/* O'ng ustun */}
                    <div className="space-y-4">
                       <div className="space-y-1">
                        <Label htmlFor="edit-expense_type">Xarajat turi *</Label>
                        <Select required value={formData.expense_type} onValueChange={(value) => handleSelectChange("expense_type", value)}>
                          <SelectTrigger id="edit-expense_type"><SelectValue placeholder="Xarajat turini tanlang" /></SelectTrigger>
                          <SelectContent>
                            {expenseTypes.map((t) => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                       <div className="space-y-1">
                        <Label htmlFor="edit-date">Xarajat sanasi *</Label>
                        <Input required id="edit-date" name="date" type="date" value={formData.date} onChange={handleChange} />
                      </div>
                       <div className="space-y-1">
                        <Label htmlFor="edit-status">Status *</Label>
                        <Select required value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                          <SelectTrigger id="edit-status"><SelectValue placeholder="Statusni tanlang" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="To‘langan">To‘langan</SelectItem>
                            <SelectItem value="Kutilmoqda">Kutilmoqda</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* To'liq kenglik */}
                     <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="edit-comment">Tavsif / Izoh</Label>
                        <Textarea id="edit-comment" name="comment" value={formData.comment} onChange={handleChange} rows={3} placeholder="Xarajat haqida qo'shimcha ma'lumot..."/>
                      </div>
                  </div>
              </div>
              <DialogFooter>
                 <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={isSubmitting}>Bekor qilish</Button>
                  <Button type="submit" disabled={isSubmitting}>
                     {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Yangilash
                  </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Statistik Kartalar */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           {/* Jami xarajatlar */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jami xarajatlar</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(getTotalAmount(filteredExpenses))}</div>
                 <p className="text-xs text-muted-foreground">Barcha topilgan xarajatlar</p>
              </CardContent>
            </Card>
            {/* Dinamik ravishda top 3 tur */}
            {expensesByType
              .sort((a, b) => b.total - a.total) // Kamayish tartibida saralash
              .slice(0, 3) // Eng ko'p 3 tasini olish
              .map((expenseInfo) => (
                <Card key={expenseInfo.type}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium truncate" title={expenseInfo.label}>{expenseInfo.label}</CardTitle>
                     {/* Turga qarab ikonka (ixtiyoriy) */}
                    {expenseInfo.label.toLowerCase().includes('material') && <Building className="h-4 w-4 text-muted-foreground" />}
                    {expenseInfo.label.toLowerCase().includes('ishchi') && <User className="h-4 w-4 text-muted-foreground" />}
                    {expenseInfo.label.toLowerCase().includes('jihoz') && <PenTool className="h-4 w-4 text-muted-foreground" />}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(expenseInfo.total)}</div>
                    <p className="text-xs text-muted-foreground">
                      {expenseInfo.percentage.toFixed(1)}% jami xarajatlardan
                    </p>
                  </CardContent>
                </Card>
            ))}
             {/* Agar 3 tadan kam tur bo'lsa, bo'sh joylarni to'ldirish */}
             {Array.from({ length: Math.max(0, 3 - expensesByType.length) }).map((_, index) => (
                 <Card key={`placeholder-${index}`} className="opacity-50">
                     <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">...</CardTitle></CardHeader>
                     <CardContent><div className="text-2xl font-bold">-</div></CardContent>
                 </Card>
             ))}
        </div>

        {/* Asosiy Kontent (Jadval va Filtrlar) */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              {/* Filtr va Qidiruv paneli */}
               <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                   {/* Qidiruv */}
                    <Input
                      placeholder="Tavsif, Yetkazib beruvchi, Turi yoki Summa bo'yicha qidirish..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-xs md:max-w-sm w-full"
                    />
                   {/* Filtrlar */}
                    <div className="flex flex-wrap justify-start md:justify-end gap-2 w-full md:w-auto">
                       <Select value={filters.object} onValueChange={(value) => handleFilterChange("object", value)}>
                          <SelectTrigger className="w-full sm:w-[160px]"> <SelectValue placeholder="Obyekt bo'yicha" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Barcha obyektlar</SelectItem>
                            {properties.map((p) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                       <Select value={filters.expense_type} onValueChange={(value) => handleFilterChange("expense_type", value)}>
                          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Turi bo'yicha" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Barcha turlar</SelectItem>
                            {expenseTypes.map((t) => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                       <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange("dateRange", value)}>
                          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Sana oralig'i" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Barcha vaqt</SelectItem>
                            <SelectItem value="today">Bugun</SelectItem>
                            <SelectItem value="week">Hafta</SelectItem>
                            <SelectItem value="month">Oy</SelectItem>
                            <SelectItem value="quarter">Chorak</SelectItem>
                            <SelectItem value="year">Yil</SelectItem>
                          </SelectContent>
                        </Select>
                       <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFilters({ object: "", expense_type: "", dateRange: "all" });
                            setSearchTerm("");
                          }}
                        >
                          Tozalash
                        </Button>
                    </div>
               </div>

              {/* Tabs (ixtiyoriy, hozircha yashirilgan, chunki filtrlar mavjud) */}
               {/* <Tabs defaultValue="all" className="space-y-4">
                 <TabsList>
                   <TabsTrigger value="all">Barcha xarajatlar</TabsTrigger>
                   {expenseTypes.map((type) => (
                     <TabsTrigger key={type.id} value={type.id.toString()}>
                       {type.name}
                     </TabsTrigger>
                   ))}
                 </TabsList>
                 <TabsContent value="all">{renderExpensesTable(filteredExpenses)}</TabsContent>
                 {expenseTypes.map((type) => (
                   <TabsContent key={type.id} value={type.id.toString()}>
                     {renderExpensesTable(filteredExpenses.filter((e) => e.expense_type === type.id))}
                   </TabsContent>
                 ))}
               </Tabs> */}

               {/* Jadvalni render qilish */}
               {renderExpensesTable(filteredExpenses)}

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}