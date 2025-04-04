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
  const [formData, setFormData] = useState({
    fio: "",
    phone_number: "",
    password: "",
    user_type: "mijoz", // To'g'ri qiymat: "mijoz"
    address: "",
    object_id: "",
    apartment_id: "",
    telegram_chat_id: "",
    balance: "0.0",
    kafil_fio: "",
    kafil_address: "",
    kafil_phone_number: "",
  })
  const [editFormData, setEditFormData] = useState({
    fio: "",
    phone_number: "",
    password: "",
    user_type: "mijoz", // To'g'ri qiymat: "mijoz"
    address: "",
    object_id: "",
    apartment_id: "",
    telegram_chat_id: "",
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

  // Barcha mijozlarni olish (paginatsiya bilan)
  const fetchClients = async () => {
    setLoading(true)
    let allClients: any[] = []
    let nextUrl = "http://api.ahlan.uz/users/"

    try {
      while (nextUrl) {
        const response = await fetch(nextUrl, {
          method: "GET",
          headers: getAuthHeaders(),
        })

        if (!response.ok) {
          if (response.status === 401) {
            const confirmLogout = window.confirm("Sessiya tugagan. Qayta kirishni xohlaysizmi?")
            if (confirmLogout) {
              router.push("/login")
            }
            throw new Error("Sessiya tugagan, qayta kirish kerak")
          }
          throw new Error("Mijozlarni olishda xatolik")
        }

        const data = await response.json()
        const clientsList = data.results || []
        const formattedClients = clientsList.map((client: any) => ({
          id: client.id,
          name: client.fio,
          phone: client.phone_number,
          address: client.address,
          balance: client.balance || 0,
          object_id: client.object_id || "",
          apartment_id: client.apartment_id || "",
          telegram_chat_id: client.telegram_chat_id || "",
          kafil_fio: client.kafil_fio || "",
          kafil_address: client.kafil_address || "",
          kafil_phone_number: client.kafil_phone_number || "",
        }))
        allClients = [...allClients, ...formattedClients]
        nextUrl = data.next // Keyingi sahifa URL’si
      }
      setClients(allClients)
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.message || "Mijozlarni olishda xatolik yuz berdi",
        variant: "destructive",
      })
      // Fallback sifatida mock ma'lumotlar
      const mockClients = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `Mijoz ${i + 1}`,
        phone: `+998 9${i % 10} ${100 + i} ${10 + i} ${20 + i}`,
        address: "Toshkent sh., Chilonzor tumani",
        balance: Math.floor(Math.random() * 10000) - 5000,
        object_id: "",
        apartment_id: "",
        telegram_chat_id: "",
        kafil_fio: "",
        kafil_address: "",
        kafil_phone_number: "",
      }))
      setClients(mockClients)
    } finally {
      setLoading(false)
    }
  }

  // Yangi mijoz qo‘shish
  const createClient = async (clientData: any) => {
    try {
      const response = await fetch("http://api.ahlan.uz/users/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(clientData),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.user_type?.[0] || "Mijoz qo‘shishda xatolik")
      }
      toast({ title: "Muvaffaqiyat", description: "Yangi mijoz muvaffaqiyatli qo‘shildi" })
      fetchClients()
      setOpen(false)
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.message || "Mijoz qo‘shishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  // Mijozni yangilash
  const updateClient = async (id: number, clientData: any) => {
    try {
      const response = await fetch(`http://api.ahlan.uz/users/${id}/`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(clientData),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.user_type?.[0] || "Mijozni yangilashda xatolik")
      }
      toast({ title: "Muvaffaqiyat", description: "Mijoz muvaffaqiyatli yangilandi" })
      fetchClients()
      setEditOpen(false)
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.message || "Mijozni yangilashda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  // Mijozni o‘chirish
  const deleteClient = async (id: number) => {
    try {
      const response = await fetch(`http://api.ahlan.uz/users/${id}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Mijozni o‘chirishda xatolik")
      toast({ title: "Muvaffaqiyat", description: "Mijoz muvaffaqiyatli o‘chirildi" })
      fetchClients()
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.message || "Mijozni o‘chirishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  // Dastlabki yuklanish
  useEffect(() => {
    if (accessToken === null) return
    if (!accessToken) {
      toast({ title: "Xatolik", description: "Tizimga kirish talab qilinadi", variant: "destructive" })
      router.push("/login")
      return
    }
    fetchClients()
  }, [accessToken, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newClient = {
      fio: formData.fio,
      phone_number: formData.phone_number,
      password: formData.password,
      user_type: "mijoz", // Faqat "mijoz" sifatida qattiq belgilandi
      address: formData.address || null,
      object_id: formData.object_id ? parseInt(formData.object_id) : null,
      apartment_id: formData.apartment_id ? parseInt(formData.apartment_id) : null,
      telegram_chat_id: formData.telegram_chat_id || null,
      balance: parseFloat(formData.balance) || 0.0,
      kafil_fio: formData.kafil_fio || null,
      kafil_address: formData.kafil_address || null,
      kafil_phone_number: formData.kafil_phone_number || null,
    }
    createClient(newClient)
    setFormData({
      fio: "",
      phone_number: "",
      password: "",
      user_type: "mijoz",
      address: "",
      object_id: "",
      apartment_id: "",
      telegram_chat_id: "",
      balance: "0.0",
      kafil_fio: "",
      kafil_address: "",
      kafil_phone_number: "",
    })
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient) return
    const updatedClient = {
      fio: editFormData.fio,
      phone_number: editFormData.phone_number,
      password: editFormData.password || undefined, // Parolni bo'sh qoldirsa, o'zgartirilmaydi
      user_type: "mijoz", // Faqat "mijoz" sifatida qattiq belgilandi
      address: editFormData.address || null,
      object_id: editFormData.object_id ? parseInt(editFormData.object_id) : null,
      apartment_id: editFormData.apartment_id ? parseInt(editFormData.apartment_id) : null,
      telegram_chat_id: editFormData.telegram_chat_id || null,
      balance: parseFloat(editFormData.balance) || 0.0,
      kafil_fio: editFormData.kafil_fio || null,
      kafil_address: editFormData.kafil_address || null,
      kafil_phone_number: editFormData.kafil_phone_number || null,
    }
    updateClient(selectedClient.id, updatedClient)
  }

  const openEditDialog = (client: any) => {
    setSelectedClient(client)
    setEditFormData({
      fio: client.name || "",
      phone_number: client.phone || "",
      password: "", // Tahrirlashda parol bo'sh qoldiriladi
      user_type: "mijoz", // Faqat "mijoz" sifatida qattiq belgilandi
      address: client.address || "",
      object_id: client.object_id?.toString() || "",
      apartment_id: client.apartment_id?.toString() || "",
      telegram_chat_id: client.telegram_chat_id || "",
      balance: client.balance?.toString() || "0.0",
      kafil_fio: client.kafil_fio || "",
      kafil_address: client.kafil_address || "",
      kafil_phone_number: client.kafil_phone_number || "",
    })
    setEditOpen(true)
  }

  const filteredClients = clients.filter((client) => {
    if (
      searchTerm &&
      !client.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !client.phone?.includes(searchTerm)
    ) {
      return false
    }
    return true
  })

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
          <h2 className="text-3xl font-bold tracking-tight">Mijozlar</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Yangi mijoz qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Yangi mijoz qo'shish</DialogTitle>
                  <DialogDescription>Yangi mijoz ma'lumotlarini kiriting</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general">Umumiy</TabsTrigger>
                    <TabsTrigger value="additional">Qo'shimcha</TabsTrigger>
                    <TabsTrigger value="guarantor">Kafil</TabsTrigger>
                  </TabsList>
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
                  <TabsContent value="additional">
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="address">Manzil</Label>
                          <Input id="address" name="address" value={formData.address} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="object_id">Obyekt ID</Label>
                          <Input id="object_id" name="object_id" type="number" value={formData.object_id} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apartment_id">Xonadon ID</Label>
                          <Input id="apartment_id" name="apartment_id" type="number" value={formData.apartment_id} onChange={handleChange} />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="telegram_chat_id">Telegram chat ID</Label>
                          <Input id="telegram_chat_id" name="telegram_chat_id" value={formData.telegram_chat_id} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="balance">Balans</Label>
                          <Input id="balance" name="balance" type="number" step="0.01" value={formData.balance} onChange={handleChange} />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
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

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <Input
                  placeholder="Mijozlarni qidirish..."
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
                      {filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.name || "Noma'lum"}</TableCell>
                          <TableCell>{client.phone || "Noma'lum"}</TableCell>
                          <TableCell>{client.address || "Noma'lum"}</TableCell>
                          <TableCell>
                            {client.balance >= 0 ? (
                              <span className="text-green-600">${client.balance?.toLocaleString() || "0"}</span>
                            ) : (
                              <span className="text-red-600">-${Math.abs(client.balance)?.toLocaleString() || "0"}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button variant="ghost" size="icon" onClick={() => router.push(`/clients/${client.id}`)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(client)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteClient(client.id)}>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Mijozni tahrirlash</DialogTitle>
                <DialogDescription>Mijoz ma'lumotlarini yangilang</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="general">Umumiy</TabsTrigger>
                  <TabsTrigger value="additional">Qo'shimcha</TabsTrigger>
                  <TabsTrigger value="guarantor">Kafil</TabsTrigger>
                </TabsList>
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
                        <Label htmlFor="edit-password">Parol</Label>
                        <Input id="edit-password" name="password" type="password" value={editFormData.password} onChange={handleEditChange} placeholder="Agar o'zgartirmoqchi bo'lmasangiz bo'sh qoldiring" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-user_type">Foydalanuvchi turi *</Label>
                        <Input id="edit-user_type" name="user_type" value="Mijoz" disabled />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="additional">
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="edit-address">Manzil</Label>
                        <Input id="edit-address" name="address" value={editFormData.address} onChange={handleEditChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-object_id">Obyekt ID</Label>
                        <Input id="edit-object_id" name="object_id" type="number" value={editFormData.object_id} onChange={handleEditChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-apartment_id">Xonadon ID</Label>
                        <Input id="edit-apartment_id" name="apartment_id" type="number" value={editFormData.apartment_id} onChange={handleEditChange} />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="edit-telegram_chat_id">Telegram chat ID</Label>
                        <Input id="edit-telegram_chat_id" name="telegram_chat_id" value={editFormData.telegram_chat_id} onChange={handleEditChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-balance">Balans</Label>
                        <Input id="edit-balance" name="balance" type="number" step="0.01" value={editFormData.balance} onChange={handleEditChange} />
                      </div>
                    </div>
                  </div>
                </TabsContent>
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
                <Button type="submit">Saqlash</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}