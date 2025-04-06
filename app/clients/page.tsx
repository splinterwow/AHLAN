"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/main-nav"
import { Search } from "@/components/search"
import { UserNav } from "@/components/user-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { Plus, Eye, Edit, Trash } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // State'dan keraksiz maydonlar olib tashlandi
  const [formData, setFormData] = useState({
    fio: "",
    phone_number: "",
    password: "",
    user_type: "mijoz", // Hardcoded
    address: "",
    balance: "0.0",
    kafil_fio: "",
    kafil_address: "",
    kafil_phone_number: "",
  })

  // Edit State'dan ham keraksiz maydonlar olib tashlandi
  const [editFormData, setEditFormData] = useState({
    fio: "",
    phone_number: "",
    password: "",
    user_type: "mijoz", // Hardcoded
    address: "",
    balance: "0.0",
    kafil_fio: "",
    kafil_address: "",
    kafil_phone_number: "",
  })

  // API so‘rovlar uchun umumiy header
  const getAuthHeaders = () => ({
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`,
  })

  // Tokenni faqat client-side’da olish
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token")
      setAccessToken(token)
    }
  }, [])

  // Faqat "mijoz"larni olish (keraksiz maydonlarsiz)
  const fetchClients = async () => {
    if (!accessToken) {
      console.warn("Access token not yet available for fetching clients.")
      return;
    }

    setLoading(true);
    let allFilteredClients: any[] = [];
    let nextUrl: string | null = "http://api.ahlan.uz/users/";

    try {
      while (nextUrl) {
        const response = await fetch(nextUrl, {
          method: "GET",
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          if (response.status === 401) {
            const confirmLogout = window.confirm("Sessiya tugagan. Qayta kirishni xohlaysizmi?");
            if (confirmLogout) {
              router.push("/login");
            }
            throw new Error("Sessiya tugagan, qayta kirish kerak");
          }
          throw new Error(`Mijozlarni olishda xatolik: ${response.statusText}`);
        }

        const data = await response.json();
        const clientsList = data.results || [];

        const mijozClientsList = clientsList.filter(
          (client: any) => client.user_type === "mijoz"
        );

        // Formatlashda keraksiz maydonlar olib tashlandi
        const formattedClients = mijozClientsList.map((client: any) => ({
          id: client.id,
          name: client.fio,
          phone: client.phone_number,
          address: client.address,
          balance: client.balance || 0,
          // object_id: yo'q
          // apartment_id: yo'q
          // telegram_chat_id: yo'q
          kafil_fio: client.kafil_fio || "",
          kafil_address: client.kafil_address || "",
          kafil_phone_number: client.kafil_phone_number || "",
        }));

        allFilteredClients = [...allFilteredClients, ...formattedClients];
        nextUrl = data.next;
      }
      setClients(allFilteredClients);
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message || "Mijozlarni olishda noma'lum xatolik yuz berdi",
        variant: "destructive",
      });
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Yangi mijoz qo‘shish (keraksiz maydonlarsiz)
  const createClient = async (clientData: any) => {
    if (!accessToken) {
        toast({ title: "Xatolik", description: "Avtorizatsiya tokeni topilmadi", variant: "destructive" });
        return;
    }
    // Yuboriladigan ma'lumotlardan keraksizlarni olib tashlash (garchi clientData'da bo'lmasa ham)
    const { object_id, apartment_id, telegram_chat_id, ...dataToSend } = clientData;

    try {
      const response = await fetch("http://api.ahlan.uz/users/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({...dataToSend, user_type: "mijoz"}), // Yana bir bor user_type ni tekshirish
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = Object.values(errorData).flat().join(', ') || "Mijoz qo‘shishda xatolik";
        throw new Error(errorMessage);
      }
      toast({ title: "Muvaffaqiyat", description: "Yangi mijoz muvaffaqiyatli qo‘shildi" });
      fetchClients();
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message || "Mijoz qo‘shishda noma'lum xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  // Mijozni yangilash (keraksiz maydonlarsiz)
  const updateClient = async (id: number, clientData: any) => {
    if (!accessToken) {
        toast({ title: "Xatolik", description: "Avtorizatsiya tokeni topilmadi", variant: "destructive" });
        return;
    }

    // Yuboriladigan ma'lumotlardan keraksizlarni olib tashlash
    const { object_id, apartment_id, telegram_chat_id, ...baseData } = clientData;
    const dataToSend = { ...baseData, user_type: "mijoz" };

    // Parol bo'sh bo'lsa, uni jo'natmaslik
    if (!dataToSend.password) {
      delete dataToSend.password;
    } else if (dataToSend.password === "") { // Agar aniq bo'sh string bo'lsa ham o'chiramiz
      delete dataToSend.password;
    }


    try {
      const response = await fetch(`http://api.ahlan.uz/users/${id}/`, {
        method: "PUT", // Yoki PATCH
        headers: getAuthHeaders(),
        body: JSON.stringify(dataToSend),
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = Object.values(errorData).flat().join(', ') || "Mijozni yangilashda xatolik";
        throw new Error(errorMessage);
      }
      toast({ title: "Muvaffaqiyat", description: "Mijoz muvaffaqiyatli yangilandi" });
      fetchClients();
      setEditOpen(false);
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message || "Mijozni yangilashda noma'lum xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  // Mijozni o‘chirish (o'zgarishsiz)
  const deleteClient = async (id: number) => {
    if (!accessToken) {
        toast({ title: "Xatolik", description: "Avtorizatsiya tokeni topilmadi", variant: "destructive" });
        return;
    }
    if (!window.confirm("Haqiqatan ham bu mijozni o'chirmoqchimisiz?")) {
        return;
    }

    try {
      const response = await fetch(`http://api.ahlan.uz/users/${id}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (response.status === 204) {
        toast({ title: "Muvaffaqiyat", description: "Mijoz muvaffaqiyatli o‘chirildi" });
        fetchClients();
      } else if (!response.ok) {
          let errorMessage = `Mijozni o‘chirishda xatolik: ${response.statusText}`;
          try {
              const errorData = await response.json();
              errorMessage = Object.values(errorData).flat().join(', ') || errorMessage;
          } catch (e) { console.error("Could not parse error response:", e); }
          throw new Error(errorMessage);
      } else {
          toast({ title: "Muvaffaqiyat", description: "Mijoz muvaffaqiyatli o‘chirildi (kutilmagan javob)" });
          fetchClients();
      }
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message || "Mijozni o‘chirishda noma'lum xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  // Dastlabki yuklanish (o'zgarishsiz)
  useEffect(() => {
    if (accessToken === null) return;
    if (!accessToken) {
      toast({ title: "Xatolik", description: "Tizimga kirish talab qilinadi", variant: "destructive" });
      router.push("/login");
      return;
    }
    fetchClients();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, router]);

  // Formadagi o'zgarishlarni qabul qilish (o'zgarishsiz)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Tahrirlash formasidagi o'zgarishlarni qabul qilish (o'zgarishsiz)
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Yangi mijoz formasini yuborish (keraksiz maydonlarsiz)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Formatlashda keraksiz maydonlar yo'q
    const newClient = {
      fio: formData.fio,
      phone_number: formData.phone_number,
      password: formData.password,
      // user_type: "mijoz", // createClient da qo'shiladi
      address: formData.address || null,
      // object_id: yo'q
      // apartment_id: yo'q
      // telegram_chat_id: yo'q
      balance: parseFloat(formData.balance) || 0.0,
      kafil_fio: formData.kafil_fio || null,
      kafil_address: formData.kafil_address || null,
      kafil_phone_number: formData.kafil_phone_number || null,
    };
    createClient(newClient);
    // Formani tozalash (keraksiz maydonlarsiz)
    setFormData({
      fio: "", phone_number: "", password: "", user_type: "mijoz",
      address: "", balance: "0.0", kafil_fio: "", kafil_address: "", kafil_phone_number: "",
    });
  };

  // Tahrirlash formasini yuborish (keraksiz maydonlarsiz)
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    // Formatlashda keraksiz maydonlar yo'q
    const updatedClient = {
      fio: editFormData.fio,
      phone_number: editFormData.phone_number,
      password: editFormData.password || undefined, // Bo'sh bo'lsa undefined
      // user_type: "mijoz", // updateClient da qo'shiladi
      address: editFormData.address || null,
      // object_id: yo'q
      // apartment_id: yo'q
      // telegram_chat_id: yo'q
      balance: parseFloat(editFormData.balance) || 0.0,
      kafil_fio: editFormData.kafil_fio || null,
      kafil_address: editFormData.kafil_address || null,
      kafil_phone_number: editFormData.kafil_phone_number || null,
    };
    updateClient(selectedClient.id, updatedClient);
  };

  // Tahrirlash dialogini ochish (keraksiz maydonlarsiz)
  const openEditDialog = (client: any) => {
    setSelectedClient(client);
    // Formani to'ldirishda keraksiz maydonlar yo'q
    setEditFormData({
      fio: client.name || "",
      phone_number: client.phone || "",
      password: "", // Parolni ko'rsatmaslik
      user_type: "mijoz",
      address: client.address || "",
      // object_id: yo'q
      // apartment_id: yo'q
      // telegram_chat_id: yo'q
      balance: client.balance?.toString() || "0.0",
      kafil_fio: client.kafil_fio || "",
      kafil_address: client.kafil_address || "",
      kafil_phone_number: client.kafil_phone_number || "",
    });
    setEditOpen(true);
  };

  // Qidiruv bo'yicha filtrlash (o'zgarishsiz)
  const filteredClients = clients.filter((client) => {
    const searchTermLower = searchTerm.toLowerCase();
    const nameMatch = client.name?.toLowerCase().includes(searchTermLower);
    const phoneMatch = client.phone?.includes(searchTerm);
    return !searchTerm || nameMatch || phoneMatch;
  });

  // --- JSX QISMI ---
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header (o'zgarishsiz) */}
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4">
            <Search />
            <UserNav />
          </div>
        </div>
      </div>

      {/* Asosiy kontent */}
      <div className="flex-1 space-y-4 p-8 pt-6">
        {/* Sahifa sarlavhasi va Yangi mijoz qo'shish tugmasi (o'zgarishsiz) */}
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Mijozlar</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Yangi mijoz qo'shish
              </Button>
            </DialogTrigger>
            {/* Yangi mijoz qo'shish dialogi kontenti */}
            <DialogContent className="sm:max-w-[600px]"> {/* O'lchamni ozroq kichraytirish mumkin */}
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Yangi mijoz qo'shish</DialogTitle>
                  <DialogDescription>Yangi mijoz ma'lumotlarini kiriting</DialogDescription>
                </DialogHeader>
                {/* Tablar: Umumiy, Qo'shimcha, Kafil */}
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general">Umumiy</TabsTrigger>
                    <TabsTrigger value="additional">Qo'shimcha</TabsTrigger>
                    <TabsTrigger value="guarantor">Kafil</TabsTrigger>
                  </TabsList>
                  {/* Umumiy ma'lumotlar tabi (o'zgarishsiz) */}
                  <TabsContent value="general">
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone_number">Telefon raqami *</Label>
                          <Input id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="fio">F.I.O. *</Label>
                          <Input id="fio" name="fio" value={formData.fio} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Parol *</Label>
                          <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="user_type">Foydalanuvchi turi *</Label>
                          <Input id="user_type" name="user_type" value="Mijoz" disabled />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  {/* Qo'shimcha ma'lumotlar tabi (KERAKSIZ MAYDONLAR OLIB TASHLANDI) */}
                  <TabsContent value="additional">
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="address">Manzil</Label>
                          <Input id="address" name="address" value={formData.address} onChange={handleChange} />
                        </div>
                        {/* object_id inputi olib tashlandi */}
                        {/* apartment_id inputi olib tashlandi */}
                        {/* telegram_chat_id inputi olib tashlandi */}
                        <div className="space-y-2"> {/* Balans alohida qatorga o'tdi */}
                          <Label htmlFor="balance">Balans</Label>
                          <Input id="balance" name="balance" type="number" step="0.01" value={formData.balance} onChange={handleChange} />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  {/* Kafil ma'lumotlari tabi (o'zgarishsiz) */}
                  <TabsContent value="guarantor">
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="kafil_fio">Kafil F.I.O.</Label>
                          <Input id="kafil_fio" name="kafil_fio" value={formData.kafil_fio} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="kafil_phone_number">Kafil telefon raqami</Label>
                          <Input id="kafil_phone_number" name="kafil_phone_number" value={formData.kafil_phone_number} onChange={handleChange} />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="kafil_address">Kafil manzili</Label>
                          <Input id="kafil_address" name="kafil_address" value={formData.kafil_address} onChange={handleChange} />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                <DialogFooter>
                  <Button type="submit">Saqlash</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Mijozlar jadvali va qidiruv (o'zgarishsiz) */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <Input
                  placeholder="Mijozlarni qidirish (FIO yoki telefon)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-muted-foreground">Mijozlar ma'lumotlari yuklanmoqda...</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>F.I.O.</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Manzil</TableHead>
                        <TableHead>Balans</TableHead>
                        <TableHead className="text-right">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.length === 0 && !loading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                Mijozlar topilmadi {searchTerm && `"${searchTerm}" uchun`}.
                            </TableCell>
                        </TableRow>
                      ) : (
                        filteredClients.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.name || "Noma'lum"}</TableCell>
                            <TableCell>{client.phone || "Noma'lum"}</TableCell>
                            <TableCell>{client.address || "Noma'lum"}</TableCell>
                            <TableCell>
                              {client.balance != null ? (
                                <span className={client.balance >= 0 ? "text-green-600" : "text-red-600"}>
                                  {client.balance.toLocaleString('us-US', { style: 'currency', currency: 'USD' , minimumFractionDigits: 0})}
                                </span>
                              ) : ( "Noma'lum" )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-1 md:space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => router.push(`/clients/${client.id}`)} title="Ko'rish">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(client)} title="Tahrirlash">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteClient(client.id)} title="O'chirish" className="text-red-600 hover:text-red-700">
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mijozni tahrirlash dialogi */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[600px]"> {/* O'lchamni ozroq kichraytirish mumkin */}
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Mijozni tahrirlash</DialogTitle>
                <DialogDescription>Mijoz ma'lumotlarini yangilang</DialogDescription>
              </DialogHeader>
              {/* Tablar: Umumiy, Qo'shimcha, Kafil */}
              <Tabs defaultValue="general" className="w-full">
                 <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general">Umumiy</TabsTrigger>
                    <TabsTrigger value="additional">Qo'shimcha</TabsTrigger>
                    <TabsTrigger value="guarantor">Kafil</TabsTrigger>
                  </TabsList>
                {/* Umumiy ma'lumotlar tabi (Tahrirlash) (o'zgarishsiz) */}
                <TabsContent value="general">
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone_number">Telefon raqami *</Label>
                        <Input id="edit-phone_number" name="phone_number" value={editFormData.phone_number} onChange={handleEditChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-fio">F.I.O. *</Label>
                        <Input id="edit-fio" name="fio" value={editFormData.fio} onChange={handleEditChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-password">Yangi parol</Label>
                        <Input id="edit-password" name="password" type="password" value={editFormData.password} onChange={handleEditChange} placeholder="O'zgartirish uchun kiriting" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-user_type">Foydalanuvchi turi *</Label>
                        <Input id="edit-user_type" name="user_type" value="Mijoz" disabled />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                {/* Qo'shimcha ma'lumotlar tabi (Tahrirlash) (KERAKSIZ MAYDONLAR OLIB TASHLANDI) */}
                <TabsContent value="additional">
                   <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="edit-address">Manzil</Label>
                          <Input id="edit-address" name="address" value={editFormData.address} onChange={handleEditChange} />
                        </div>
                        {/* edit-object_id inputi olib tashlandi */}
                        {/* edit-apartment_id inputi olib tashlandi */}
                        {/* edit-telegram_chat_id inputi olib tashlandi */}
                        <div className="space-y-2"> {/* Balans alohida qatorga o'tdi */}
                          <Label htmlFor="edit-balance">Balans</Label>
                          <Input id="edit-balance" name="balance" type="number" step="0.01" value={editFormData.balance} onChange={handleEditChange} />
                        </div>
                      </div>
                    </div>
                </TabsContent>
                 {/* Kafil ma'lumotlari tabi (Tahrirlash) (o'zgarishsiz) */}
                <TabsContent value="guarantor">
                   <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-kafil_fio">Kafil F.I.O.</Label>
                          <Input id="edit-kafil_fio" name="kafil_fio" value={editFormData.kafil_fio} onChange={handleEditChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-kafil_phone_number">Kafil telefon raqami</Label>
                          <Input id="edit-kafil_phone_number" name="kafil_phone_number" value={editFormData.kafil_phone_number} onChange={handleEditChange} />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="edit-kafil_address">Kafil manzili</Label>
                          <Input id="edit-kafil_address" name="kafil_address" value={editFormData.kafil_address} onChange={handleEditChange} />
                        </div>
                      </div>
                    </div>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button type="submit">O'zgarishlarni saqlash</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}