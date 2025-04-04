"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/main-nav";
import { Search } from "@/components/search";
import { UserNav } from "@/components/user-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { CreditCard, Edit, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<any>(null);

  const [formData, setFormData] = useState({
    user: "",
    apartment: "",
    payment_type: "naqd",
    total_amount: "",
    initial_payment: "0",
    interest_rate: "0",
    duration_months: "0",
    due_date: "1",
    paid_amount: "0",
    status: "pending",
    additional_info: "",
  });
  const [filters, setFilters] = useState({
    status: "",
    payment_type: "all",
  });
  const [totalAmount, setTotalAmount] = useState("0");
  const [totalPaid, setTotalPaid] = useState("0");
  const [totalOverdue, setTotalOverdue] = useState("0");
  const [formattedPayments, setFormattedPayments] = useState<any[]>([]);

  const API_BASE_URL = "http://api.ahlan.uz"; // API bazaviy URL (prefiksiz)

  const getAuthHeaders = () => ({
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      setAccessToken(token);
    }
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/payments/`;
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.payment_type && filters.payment_type !== "all")
        queryParams.append("payment_type", filters.payment_type);
      if (queryParams.toString()) url += `?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(
          `To‘lovlarni yuklashda xatolik: ${response.status} - ${response.statusText}`
        );
      }
      const data = await response.json();
      setPayments(data.results || data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description:
          (error as Error).message ||
          "API bilan bog‘lanishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const total = getTotalAmount();
      const paid = getTotalAmount("paid");
      const overdue = getTotalAmount("overdue");

      setTotalAmount(
        total.toLocaleString("uz-UZ", {
          style: "currency",
          currency: "UZS",
        })
      );
      setTotalPaid(
        paid.toLocaleString("uz-UZ", {
          style: "currency",
          currency: "UZS",
        })
      );
      setTotalOverdue(
        overdue.toLocaleString("uz-UZ", {
          style: "currency",
          currency: "UZS",
        })
      );
    }
  }, [payments]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const formatted = payments.map((payment: any) => ({
        ...payment,
        formattedAmount: Number(payment.total_amount || 0).toLocaleString(
          "uz-UZ",
          {
            style: "currency",
            currency: "UZS",
          }
        ),
        formattedDate: payment.created_at
          ? new Date(payment.created_at).toLocaleDateString()
          : "Noma‘lum",
      }));
      setFormattedPayments(formatted);
    }
  }, [payments]);

  const createPayment = async (paymentData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(paymentData),
      });
      if (!response.ok) throw new Error("To‘lov qo‘shishda xatolik");
      toast({
        title: "Muvaffaqiyat",
        description: "To‘lov muvaffaqiyatli qo‘shildi",
      });
      fetchPayments();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const fetchPaymentById = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${id}/`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("To‘lovni olishda xatolik");
      const data = await response.json();
      setCurrentPayment(data);
      setFormData({
        user: data.user?.toString() || "",
        apartment: data.apartment?.toString() || "",
        payment_type: data.payment_type || "naqd",
        total_amount: data.total_amount?.toString() || "",
        initial_payment: data.initial_payment?.toString() || "0",
        interest_rate: data.interest_rate?.toString() || "0",
        duration_months: data.duration_months?.toString() || "0",
        due_date: data.due_date?.toString() || "1",
        paid_amount: data.paid_amount?.toString() || "0",
        status: data.status || "pending",
        additional_info: data.additional_info || "",
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const updatePayment = async (id: number, paymentData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${id}/`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(paymentData),
      });
      if (!response.ok) throw new Error("To‘lovni yangilashda xatolik");
      toast({
        title: "Muvaffaqiyat",
        description: "To‘lov muvaffaqiyatli yangilandi",
      });
      fetchPayments();
      setEditOpen(false);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const deletePayment = async (id: number) => {
    if (!window.confirm("Bu to‘lovni o‘chirishni tasdiqlaysizmi?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${id}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("To‘lovni o‘chirishda xatolik");
      toast({
        title: "Muvaffaqiyat",
        description: "To‘lov muvaffaqiyatli o‘chirildi",
      });
      fetchPayments();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (accessToken === null) return;
    if (!accessToken) {
      toast({
        title: "Xatolik",
        description: "Tizimga kirish talab qilinadi",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }
    fetchPayments();
  }, [accessToken, filters]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user || !formData.apartment || !formData.total_amount) {
      toast({
        title: "Xatolik",
        description: "Barcha zarur maydonlarni to‘ldiring",
        variant: "destructive",
      });
      return;
    }
    const paymentData = {
      user: Number(formData.user),
      apartment: Number(formData.apartment),
      payment_type: formData.payment_type,
      total_amount: Number(formData.total_amount),
      initial_payment: Number(formData.initial_payment),
      interest_rate: Number(formData.interest_rate),
      duration_months: Number(formData.duration_months),
      due_date: Number(formData.due_date),
      paid_amount: Number(formData.paid_amount),
      status: formData.status,
      additional_info: formData.additional_info,
    };
    createPayment(paymentData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paymentData = {
      user: Number(formData.user),
      apartment: Number(formData.apartment),
      payment_type: formData.payment_type,
      total_amount: Number(formData.total_amount),
      initial_payment: Number(formData.initial_payment),
      interest_rate: Number(formData.interest_rate),
      duration_months: Number(formData.duration_months),
      due_date: Number(formData.due_date),
      paid_amount: Number(formData.paid_amount),
      status: formData.status,
      additional_info: formData.additional_info,
    };
    if (currentPayment) updatePayment(currentPayment.id, paymentData);
  };

  const handleOpenEditDialog = (paymentId: number) => {
    fetchPaymentById(paymentId);
    setEditOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">To‘langan</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Kutilmoqda</Badge>;
      case "overdue":
        return <Badge className="bg-red-500">Muddati o‘tgan</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentTypeLabel = (paymentType: string) => {
    switch (paymentType) {
      case "naqd":
        return "Naqd pul";
      case "muddatli":
        return "Muddatli to‘lov";
      case "ipoteka":
        return "Ipoteka";
      default:
        return paymentType;
    }
  };

  const filteredPayments = formattedPayments.filter((payment: any) => {
    if (
      searchTerm &&
      !payment.user_fio?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !payment.apartment_info?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getTotalAmount = (status = "") => {
    return payments
      .filter((p: any) => (status ? p.status === status : true))
      .reduce(
        (total: number, payment: any) =>
          total + Number(payment.total_amount || 0),
        0
      );
  };

  function renderPaymentsTable(paymentsToRender: any[]) {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">
            To‘lovlar ma‘lumotlari yuklanmoqda...
          </p>
        </div>
      );
    }
    if (paymentsToRender.length === 0) {
      return (
        <div className="flex items-center justify-center h-[200px] border rounded-md">
          <p className="text-muted-foreground">To‘lovlar mavjud emas</p>
        </div>
      );
    }
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mijoz</TableHead>
              <TableHead>Xonadon</TableHead>
              <TableHead>Summa</TableHead>
              <TableHead>To‘lov turi</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead>Holati</TableHead>
              <TableHead className="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentsToRender.map((payment: any) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.user_fio || "Noma‘lum"}</TableCell>
                <TableCell>{payment.apartment_info || "Noma‘lum"}</TableCell>
                <TableCell>{payment.formattedAmount}</TableCell>
                <TableCell>
                  {getPaymentTypeLabel(payment.payment_type)}
                </TableCell>
                <TableCell>{payment.formattedDate}</TableCell>
                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEditDialog(payment.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deletePayment(payment.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4">
            <Search />
            <UserNav />
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">To‘lovlar</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            {/* <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Yangi to‘lov qo‘shish
              </Button>
            </DialogTrigger> */}
            <DialogContent className="sm:max-w-[600px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Yangi to‘lov qo‘shish</DialogTitle>
                  <DialogDescription>
                    Yangi to‘lov ma‘lumotlarini kiriting
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="user">Mijoz ID</Label>
                      <Input
                        id="user"
                        name="user"
                        type="number"
                        value={formData.user}
                        onChange={handleChange}
                        placeholder="Mijoz ID sini kiriting"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apartment">Xonadon ID</Label>
                      <Input
                        id="apartment"
                        name="apartment"
                        type="number"
                        value={formData.apartment}
                        onChange={handleChange}
                        placeholder="Xonadon ID sini kiriting"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total_amount">Umumiy summa</Label>
                      <Input
                        id="total_amount"
                        name="total_amount"
                        type="number"
                        value={formData.total_amount}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="initial_payment">
                        Boshlang‘ich to‘lov
                      </Label>
                      <Input
                        id="initial_payment"
                        name="initial_payment"
                        type="number"
                        value={formData.initial_payment}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment_type">To‘lov turi</Label>
                      <Select
                        value={formData.payment_type}
                        onValueChange={(value) =>
                          handleSelectChange("payment_type", value)
                        }
                      >
                        <SelectTrigger id="payment_type">
                          <SelectValue placeholder="To‘lov turini tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="naqd">Naqd pul</SelectItem>
                          <SelectItem value="muddatli">
                            Muddatli to‘lov
                          </SelectItem>
                          <SelectItem value="ipoteka">Ipoteka</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="interest_rate">Foiz stavkasi (%)</Label>
                      <Input
                        id="interest_rate"
                        name="interest_rate"
                        type="number"
                        value={formData.interest_rate}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration_months">Muddat (oy)</Label>
                      <Input
                        id="duration_months"
                        name="duration_months"
                        type="number"
                        value={formData.duration_months}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="due_date">To‘lov sanasi (kuni)</Label>
                      <Input
                        id="due_date"
                        name="due_date"
                        type="number"
                        min="1"
                        max="31"
                        value={formData.due_date}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paid_amount">To‘langan summa</Label>
                      <Input
                        id="paid_amount"
                        name="paid_amount"
                        type="number"
                        value={formData.paid_amount}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Holati</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          handleSelectChange("status", value)
                        }
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Statusni tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">To‘langan</SelectItem>
                          <SelectItem value="pending">Kutilmoqda</SelectItem>
                          <SelectItem value="overdue">
                            Muddati o‘tgan
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="additional_info">
                        Qo‘shimcha ma‘lumot
                      </Label>
                      <Input
                        id="additional_info"
                        name="additional_info"
                        value={formData.additional_info}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Saqlash</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>To‘lovni tahrirlash</DialogTitle>
                <DialogDescription>
                  To‘lov ma‘lumotlarini yangilang
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="user">Mijoz ID</Label>
                    <Input
                      id="user"
                      name="user"
                      type="number"
                      value={formData.user}
                      onChange={handleChange}
                      placeholder="Mijoz ID sini kiriting"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apartment">Xonadon ID</Label>
                    <Input
                      id="apartment"
                      name="apartment"
                      type="number"
                      value={formData.apartment}
                      onChange={handleChange}
                      placeholder="Xonadon ID sini kiriting"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total_amount">Umumiy summa</Label>
                    <Input
                      id="total_amount"
                      name="total_amount"
                      type="number"
                      value={formData.total_amount}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="initial_payment">Boshlang‘ich to‘lov</Label>
                    <Input
                      id="initial_payment"
                      name="initial_payment"
                      type="number"
                      value={formData.initial_payment}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_type">To‘lov turi</Label>
                    <Select
                      value={formData.payment_type}
                      onValueChange={(value) =>
                        handleSelectChange("payment_type", value)
                      }
                    >
                      <SelectTrigger id="payment_type">
                        <SelectValue placeholder="To‘lov turini tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="naqd">Naqd pul</SelectItem>
                        <SelectItem value="muddatli">
                          Muddatli to‘lov
                        </SelectItem>
                        <SelectItem value="ipoteka">Ipoteka</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interest_rate">Foiz stavkasi (%)</Label>
                    <Input
                      id="interest_rate"
                      name="interest_rate"
                      type="number"
                      value={formData.interest_rate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration_months">Muddat (oy)</Label>
                    <Input
                      id="duration_months"
                      name="duration_months"
                      type="number"
                      value={formData.duration_months}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">To‘lov sanasi (kuni)</Label>
                    <Input
                      id="due_date"
                      name="due_date"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.due_date}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paid_amount">To‘langan summa</Label>
                    <Input
                      id="paid_amount"
                      name="paid_amount"
                      type="number"
                      value={formData.paid_amount}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Holati</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        handleSelectChange("status", value)
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Statusni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">To‘langan</SelectItem>
                        <SelectItem value="pending">Kutilmoqda</SelectItem>
                        <SelectItem value="overdue">Muddati o‘tgan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="additional_info">Qo‘shimcha ma‘lumot</Label>
                    <Input
                      id="additional_info"
                      name="additional_info"
                      value={formData.additional_info}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Yangilash</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Jami to‘lovlar
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAmount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">To‘langan</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalPaid}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalAmount !== "0"
                  ? Math.round(
                    (getTotalAmount("paid") / getTotalAmount()) * 100
                  )
                  : 0}
                % to‘langan
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Muddati o‘tgan
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {totalOverdue}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalAmount !== "0"
                  ? Math.round(
                    (getTotalAmount("overdue") / getTotalAmount()) * 100
                  )
                  : 0}
                % muddati o‘tgan
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Tabs defaultValue="all" className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <TabsList>
                    <TabsTrigger value="all">Barcha to‘lovlar</TabsTrigger>
                    <TabsTrigger value="paid">To‘langan</TabsTrigger>
                    <TabsTrigger value="pending">Kutilmoqda</TabsTrigger>
                    <TabsTrigger value="overdue">Muddati o‘tgan</TabsTrigger>
                  </TabsList>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      placeholder="To‘lovlarni qidirish..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                    <Select
                      value={filters.payment_type}
                      onValueChange={(value) =>
                        handleFilterChange("payment_type", value)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="To‘lov turi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Barcha turlar</SelectItem>
                        <SelectItem value="naqd">Naqd pul</SelectItem>
                        <SelectItem value="muddatli">
                          Muddatli to‘lov
                        </SelectItem>
                        <SelectItem value="ipoteka">Ipoteka</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilters({
                          status: "",
                          payment_type: "all",
                        });
                        setSearchTerm("");
                      }}
                    >
                      Tozalash
                    </Button>
                  </div>
                </div>
                <TabsContent value="all">
                  {renderPaymentsTable(filteredPayments)}
                </TabsContent>
                <TabsContent value="paid">
                  {renderPaymentsTable(
                    filteredPayments.filter((p: any) => p.status === "paid")
                  )}
                </TabsContent>
                <TabsContent value="pending">
                  {renderPaymentsTable(
                    filteredPayments.filter((p: any) => p.status === "pending")
                  )}
                </TabsContent>
                <TabsContent value="overdue">
                  {renderPaymentsTable(
                    filteredPayments.filter((p: any) => p.status === "overdue")
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
