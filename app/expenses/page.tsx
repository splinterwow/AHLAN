"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/main-nav"
import { Search } from "@/components/search"
import { UserNav } from "@/components/user-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { Plus, DollarSign, Building, FileText, Eye, Edit, User, PenTool, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

export default function ExpensesPage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [currentExpense, setCurrentExpense] = useState(null)
  const [properties, setProperties] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [expenseTypes, setExpenseTypes] = useState([])
  const [formData, setFormData] = useState({
    object: "",
    supplier: "",
    amount: "",
    expense_type: "",
    date: new Date().toISOString().split("T")[0],
    comment: "",
    status: "Kutilmoqda",
  })
  const [filters, setFilters] = useState({
    object: "",
    expense_type: "",
    dateRange: "all",
  })

  const getAuthHeaders = () => ({
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`,
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token")
      setAccessToken(token)
    }
  }, [])

  const fetchProperties = async () => {
    try {
      const response = await fetch("http://api.ahlan.uz/objects/", {
        method: "GET",
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Obyektlarni yuklashda xatolik yuz berdi")
      const data = await response.json()
      setProperties(data.results || data)
    } catch (error) {
      toast({ title: "Xatolik", description: error.message || "Obyektlarni yuklashda xatolik", variant: "destructive" })
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("http://api.ahlan.uz/suppliers/", {
        method: "GET",
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Yetkazib beruvchilarni yuklashda xatolik yuz berdi")
      const data = await response.json()
      setSuppliers(data.results || data)
    } catch (error) {
      toast({ title: "Xatolik", description: error.message || "Yetkazib beruvchilarni yuklashda xatolik", variant: "destructive" })
    }
  }

  const fetchExpenseTypes = async () => {
    try {
      const response = await fetch("http://api.ahlan.uz/expense-types/", {
        method: "GET",
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Xarajat turlarini yuklashda xatolik yuz berdi")
      const data = await response.json()
      setExpenseTypes(data.results || data)
    } catch (error) {
      toast({ title: "Xatolik", description: error.message || "Xarajat turlarini yuklashda xatolik", variant: "destructive" })
    }
  }

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      let url = "http://api.ahlan.uz/expenses/"
      const queryParams = new URLSearchParams()
      if (filters.object && filters.object !== "all") queryParams.append("object", filters.object)
      if (filters.expense_type && filters.expense_type !== "all") queryParams.append("expense_type", filters.expense_type)
      if (filters.dateRange && filters.dateRange !== "all") {
        const today = new Date()
        let startDate = new Date()
        switch (filters.dateRange) {
          case "today":
            startDate.setHours(0, 0, 0, 0)
            break
          case "week":
            startDate.setDate(today.getDate() - 7)
            break
          case "month":
            startDate.setMonth(today.getMonth() - 1)
            break
          case "quarter":
            startDate.setMonth(today.getMonth() - 3)
            break
          case "year":
            startDate.setFullYear(today.getFullYear() - 1)
            break
        }
        queryParams.append("date__gte", startDate.toISOString().split("T")[0])
      }
      if (queryParams.toString()) url += `?${queryParams.toString()}`
      const response = await fetch(url, { method: "GET", headers: getAuthHeaders() })
      const data = await response.json()
      setExpenses(data.results || data)
      setLoading(false)
    } catch (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" })
      setLoading(false)
    }
  }

  const createExpense = async (expenseData) => {
    try {
      const response = await fetch("http://api.ahlan.uz/expenses/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(expenseData),
      })
      if (!response.ok) {
        if (response.status === 403) throw new Error("Faqat admin xarajat qo‘shishi mumkin")
        throw new Error("Xarajat qo‘shishda xatolik")
      }
      toast({ title: "Muvaffaqiyat", description: "Xarajat muvaffaqiyatli qo‘shildi" })
      fetchExpenses()
      setOpen(false)
    } catch (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" })
    }
  }

  const fetchExpenseById = async (id) => {
    try {
      const response = await fetch(`http://api.ahlan.uz/expenses/${id}/`, {
        method: "GET",
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Xarajatni olishda xatolik yuz berdi")
      const data = await response.json()
      setCurrentExpense(data)
      setFormData({
        object: data.object.toString(),
        supplier: data.supplier.toString(),
        amount: data.amount.toString(),
        expense_type: data.expense_type.toString(),
        date: data.date,
        comment: data.comment,
        status: data.status,
      })
    } catch (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" })
    }
  }

  const updateExpense = async (id, expenseData) => {
    try {
      const response = await fetch(`http://api.ahlan.uz/expenses/${id}/`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(expenseData),
      })
      if (!response.ok) {
        if (response.status === 403) throw new Error("Faqat admin xarajatni yangilashi mumkin")
        throw new Error("Xarajatni yangilashda xatolik")
      }
      toast({ title: "Muvaffaqiyat", description: "Xarajat muvaffaqiyatli yangilandi" })
      fetchExpenses()
      setEditOpen(false)
    } catch (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" })
    }
  }

  const partialUpdateExpense = async (id, expenseData) => {
    try {
      const response = await fetch(`http://api.ahlan.uz/expenses/${id}/`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(expenseData),
      })
      if (!response.ok) {
        if (response.status === 403) throw new Error("Faqat admin xarajatni yangilashi mumkin")
        throw new Error("Xarajatni qisman yangilashda xatolik")
      }
      toast({ title: "Muvaffaqiyat", description: "Xarajat qisman yangilandi" })
      fetchExpenses()
    } catch (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" })
    }
  }

  const deleteExpense = async (id) => {
    if (!window.confirm("Bu xarajatni o‘chirishni tasdiqlaysizmi?")) return
    try {
      const response = await fetch(`http://api.ahlan.uz/expenses/${id}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        if (response.status === 403) throw new Error("Faqat admin xarajatni o‘chirishi mumkin")
        throw new Error("Xarajatni o‘chirishda xatolik")
      }
      toast({ title: "Muvaffaqiyat", description: "Xarajat muvaffaqiyatli o‘chirildi" })
      fetchExpenses()
    } catch (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" })
    }
  }

  useEffect(() => {
    if (accessToken === null) return
    if (!accessToken) {
      toast({ title: "Xatolik", description: "Tizimga kirish talab qilinadi", variant: "destructive" })
      router.push("/login")
      return
    }
    fetchProperties()
    fetchSuppliers()
    fetchExpenseTypes()
    fetchExpenses()
  }, [accessToken, filters])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const expenseData = {
      object: Number(formData.object),
      supplier: Number(formData.supplier),
      amount: Number(formData.amount),
      expense_type: Number(formData.expense_type),
      date: formData.date,
      comment: formData.comment,
      status: formData.status,
    }
    createExpense(expenseData)
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    const expenseData = {
      object: Number(formData.object),
      supplier: Number(formData.supplier),
      amount: Number(formData.amount),
      expense_type: Number(formData.expense_type),
      date: formData.date,
      comment: formData.comment,
      status: formData.status,
    }
    updateExpense(currentExpense.id, expenseData)
  }

  const handleOpenEditDialog = (expenseId) => {
    fetchExpenseById(expenseId)
    setEditOpen(true)
  }

  const getExpenseTypeLabel = (typeId) => {
    const type = expenseTypes.find((et) => et.id === typeId)
    if (!type) return <Badge>Boshqa</Badge>
    switch (type.name.toLowerCase()) {
      case "qurilish materiallari":
        return <Badge className="bg-blue-500">Qurilish materiallari</Badge>
      case "ishchi kuchi":
        return <Badge className="bg-green-500">Ishchi kuchi</Badge>
      case "jihozlar":
        return <Badge className="bg-purple-500">Jihozlar</Badge>
      case "kommunal xizmatlar":
        return <Badge className="bg-yellow-500">Kommunal xizmatlar</Badge>
      default:
        return <Badge>{type.name}</Badge>
    }
  }

  const getExpenseTypeText = (typeId) => {
    const type = expenseTypes.find((et) => et.id === typeId)
    return type ? type.name : "Boshqa"
  }

  const filteredExpenses = expenses.filter((expense) => {
    if (
      searchTerm &&
      !expense.comment.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !expense.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !expense.expense_type_name.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false
    }
    return true
  })

  const getTotalAmount = (expenses) => {
    return expenses.reduce((total, expense) => total + Number(expense.amount), 0)
  }

  const getExpensesByType = (expenses) => {
    const uniqueExpenseTypes = Array.from(new Set(expenseTypes.map((et) => et.id)))
    return uniqueExpenseTypes.map((typeId) => {
      const filteredExpenses = expenses.filter((expense) => expense.expense_type === typeId)
      const total = getTotalAmount(filteredExpenses)
      const percentage = expenses.length > 0 ? (total / getTotalAmount(expenses)) * 100 : 0
      return { type: typeId, label: getExpenseTypeText(typeId), total, percentage }
    })
  }

  const expensesByType = getExpensesByType(filteredExpenses)

  function renderExpensesTable(expensesToRender) {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">Xarajatlar ma'lumotlari yuklanmoqda...</p>
        </div>
      )
    }
    if (expensesToRender.length === 0) {
      return (
        <div className="flex items-center justify-center h-[200px] border rounded-md">
          <p className="text-muted-foreground">Xarajatlar mavjud emas</p>
        </div>
      )
    }
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sana</TableHead>
              <TableHead>Obyekt</TableHead>
              <TableHead>Yetkazib beruvchi</TableHead>
              <TableHead>Tavsif</TableHead>
              <TableHead>Turi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Summa</TableHead>
              <TableHead className="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expensesToRender.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                <TableCell>{expense.object_name || "Noma'lum"}</TableCell>
                <TableCell>{expense.supplier_name}</TableCell>
                <TableCell>{expense.comment}</TableCell>
                <TableCell>{getExpenseTypeLabel(expense.expense_type)}</TableCell>
                <TableCell>{expense.status}</TableCell>
                <TableCell>{Number(expense.amount).toLocaleString("uz-UZ", { style: "currency", currency: "UZS" })}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(expense.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteExpense(expense.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
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
          <h2 className="text-3xl font-bold tracking-tight">Xarajatlar</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Yangi xarajat qo&apos;shish
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Yangi xarajat qo&apos;shish</DialogTitle>
                  <DialogDescription>Yangi xarajat ma&apos;lumotlarini kiriting</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="object">Obyekt</Label>
                      <Select value={formData.object} onValueChange={(value) => handleSelectChange("object", value)}>
                        <SelectTrigger id="object">
                          <SelectValue placeholder="Obyektni tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {properties.map((property) => (
                            <SelectItem key={property.id} value={property.id.toString()}>
                              {property.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplier">Yetkazib beruvchi</Label>
                      <Select value={formData.supplier} onValueChange={(value) => handleSelectChange("supplier", value)}>
                        <SelectTrigger id="supplier">
                          <SelectValue placeholder="Yetkazib beruvchini tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.company_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Summa</Label>
                      <Input id="amount" name="amount" type="number" value={formData.amount} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expense_type">Xarajat turi</Label>
                      <Select value={formData.expense_type} onValueChange={(value) => handleSelectChange("expense_type", value)}>
                        <SelectTrigger id="expense_type">
                          <SelectValue placeholder="Xarajat turini tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Xarajat sanasi</Label>
                      <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Statusni tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="To‘langan">To‘langan</SelectItem>
                          <SelectItem value="Kutilmoqda">Kutilmoqda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="comment">Tavsif</Label>
                      <Textarea id="comment" name="comment" value={formData.comment} onChange={handleChange} rows={3} />
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
                <DialogTitle>Xarajatni tahrirlash</DialogTitle>
                <DialogDescription>Xarajat ma&apos;lumotlarini yangilang</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="object">Obyekt</Label>
                    <Select value={formData.object} onValueChange={(value) => handleSelectChange("object", value)}>
                      <SelectTrigger id="object">
                        <SelectValue placeholder="Obyektni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id.toString()}>
                            {property.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Yetkazib beruvchi</Label>
                    <Select value={formData.supplier} onValueChange={(value) => handleSelectChange("supplier", value)}>
                      <SelectTrigger id="supplier">
                        <SelectValue placeholder="Yetkazib beruvchini tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Summa</Label>
                    <Input id="amount" name="amount" type="number" value={formData.amount} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense_type">Xarajat turi</Label>
                    <Select value={formData.expense_type} onValueChange={(value) => handleSelectChange("expense_type", value)}>
                      <SelectTrigger id="expense_type">
                        <SelectValue placeholder="Xarajat turini tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Xarajat sanasi</Label>
                    <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Statusni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="To‘langan">To‘langan</SelectItem>
                        <SelectItem value="Kutilmoqda">Kutilmoqda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="comment">Tavsif</Label>
                    <Textarea id="comment" name="comment" value={formData.comment} onChange={handleChange} rows={3} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Yangilash</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami xarajatlar</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalAmount(filteredExpenses).toLocaleString("uz-UZ", { style: "currency", currency: "UZS" })}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Qurilish materiallari</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {expensesByType.find((e) => getExpenseTypeText(e.type).toLowerCase() === "qurilish materiallari")?.total.toLocaleString("uz-UZ", { style: "currency", currency: "UZS" }) || "0 UZS"}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round(expensesByType.find((e) => getExpenseTypeText(e.type).toLowerCase() === "qurilish materiallari")?.percentage || 0)}% jami xarajatlardan
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ishchi kuchi</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {expensesByType.find((e) => getExpenseTypeText(e.type).toLowerCase() === "ishchi kuchi")?.total.toLocaleString("uz-UZ", { style: "currency", currency: "UZS" }) || "0 UZS"}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round(expensesByType.find((e) => getExpenseTypeText(e.type).toLowerCase() === "ishchi kuchi")?.percentage || 0)}% jami xarajatlardan
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jihozlar</CardTitle>
              <PenTool className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {expensesByType.find((e) => getExpenseTypeText(e.type).toLowerCase() === "jihozlar")?.total.toLocaleString("uz-UZ", { style: "currency", currency: "UZS" }) || "0 UZS"}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round(expensesByType.find((e) => getExpenseTypeText(e.type).toLowerCase() === "jihozlar")?.percentage || 0)}% jami xarajatlardan
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
                    <TabsTrigger value="all">Barcha xarajatlar</TabsTrigger>
                    {expenseTypes.map((type) => (
                      <TabsTrigger key={type.id} value={type.id.toString()}>
                        {type.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      placeholder="Xarajatlarni qidirish..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                    <Select value={filters.object} onValueChange={(value) => handleFilterChange("object", value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Obyekt" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Barcha obyektlar</SelectItem>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id.toString()}>
                            {property.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange("dateRange", value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sana oralig'i" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Barcha vaqt</SelectItem>
                        <SelectItem value="today">Bugun</SelectItem>
                        <SelectItem value="week">So&apos;nggi hafta</SelectItem>
                        <SelectItem value="month">So&apos;nggi oy</SelectItem>
                        <SelectItem value="quarter">So&apos;nggi chorak</SelectItem>
                        <SelectItem value="year">So&apos;nggi yil</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilters({ object: "", expense_type: "", dateRange: "all" })
                        setSearchTerm("")
                      }}
                    >
                      Tozalash
                    </Button>
                  </div>
                </div>
                <TabsContent value="all">{renderExpensesTable(filteredExpenses)}</TabsContent>
                {expenseTypes.map((type) => (
                  <TabsContent key={type.id} value={type.id.toString()}>
                    {renderExpensesTable(filteredExpenses.filter((e) => e.expense_type === type.id))}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}