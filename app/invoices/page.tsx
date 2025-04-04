"use client"

import type React from "react"

// Importlarni to'g'rilash
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
import { Plus, FileText, Download, Eye, Calendar, DollarSign } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [open, setOpen] = useState(false)
  const [properties, setProperties] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [formData, setFormData] = useState({
    propertyId: "",
    supplierId: "",
    amount: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0],
    description: "",
    invoiceNumber: "",
  })
  const [filters, setFilters] = useState({
    status: "",
    propertyId: "",
    supplierId: "",
    dateRange: "all",
  })

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      // Generate mock properties data
      const mockProperties = [
        { id: 1, name: "Navoiy 108K" },
        { id: 2, name: "Navoiy 108L" },
        { id: 3, name: "Baqachorsu" },
      ]

      // Generate mock suppliers data
      const mockSuppliers = Array.from({ length: 5 }, (_, i) => {
        return {
          id: i + 1,
          name: `Yetkazib beruvchi ${i + 1}`,
        }
      })

      // Generate mock invoices data
      const mockInvoices = Array.from({ length: 30 }, (_, i) => {
        const statuses = ["paid", "pending", "overdue"]
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        const propertyId = Math.floor(Math.random() * 3) + 1
        const supplierId = Math.floor(Math.random() * 5) + 1
        const date = new Date()
        date.setDate(date.getDate() - Math.floor(Math.random() * 30))
        const dueDate = new Date(date)
        dueDate.setDate(date.getDate() + 30)

        return {
          id: i + 1,
          invoiceNumber: `INV-${2023}${String(i + 1).padStart(4, "0")}`,
          propertyId,
          propertyName: mockProperties.find((p) => p.id === propertyId)?.name || "",
          supplierId,
          supplierName: mockSuppliers.find((s) => s.id === supplierId)?.name || "",
          amount: Math.floor(Math.random() * 10000) + 1000,
          status,
          invoiceDate: date.toISOString(),
          dueDate: dueDate.toISOString(),
          description: "Hisob-faktura tavsifi",
        }
      })

      setProperties(mockProperties)
      setSuppliers(mockSuppliers)
      setInvoices(mockInvoices)
      setLoading(false)
    }, 1000)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Simulate API call
    setTimeout(() => {
      const propertyName = properties.find((p) => p.id === Number.parseInt(formData.propertyId))?.name || ""
      const supplierName = suppliers.find((s) => s.id === Number.parseInt(formData.supplierId))?.name || ""

      const newInvoice = {
        id: invoices.length + 1,
        invoiceNumber: formData.invoiceNumber || `INV-${2023}${String(invoices.length + 1).padStart(4, "0")}`,
        propertyId: Number.parseInt(formData.propertyId),
        propertyName,
        supplierId: Number.parseInt(formData.supplierId),
        supplierName,
        amount: Number.parseFloat(formData.amount),
        status: "pending",
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate,
        description: formData.description,
      }

      setInvoices([newInvoice, ...invoices])
      setFormData({
        propertyId: "",
        supplierId: "",
        amount: "",
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0],
        description: "",
        invoiceNumber: "",
      })
      setOpen(false)

      toast({
        title: "Hisob-faktura qo'shildi",
        description: "Yangi hisob-faktura muvaffaqiyatli qo'shildi",
      })
    }, 500)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">To'langan</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Kutilmoqda</Badge>
      case "overdue":
        return <Badge className="bg-red-500">Muddati o'tgan</Badge>
      default:
        return null
    }
  }

  const filterInvoicesByDate = (invoices: any[], dateRange: string) => {
    if (dateRange === "all") return invoices

    const today = new Date()
    const startDate = new Date()

    switch (dateRange) {
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
      default:
        return invoices
    }

    return invoices.filter((invoice) => new Date(invoice.invoiceDate) >= startDate)
  }

  const filteredInvoices = invoices.filter((invoice) => {
    if (
      searchTerm &&
      !invoice.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !invoice.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !invoice.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !invoice.invoiceNumber.includes(searchTerm)
    ) {
      return false
    }
    if (filters.status && invoice.status !== filters.status) return false
    if (filters.propertyId && invoice.propertyId !== Number.parseInt(filters.propertyId)) return false
    if (filters.supplierId && invoice.supplierId !== Number.parseInt(filters.supplierId)) return false
    return true
  })

  const dateFilteredInvoices = filterInvoicesByDate(filteredInvoices, filters.dateRange)

  const getTotalAmount = (invoices: any[]) => {
    return invoices.reduce((total, invoice) => total + invoice.amount, 0)
  }

  const getInvoicesByStatus = (invoices: any[]) => {
    const statuses = ["paid", "pending", "overdue"]

    return statuses.map((status) => {
      const filteredInvoices = invoices.filter((invoice) => invoice.status === status)
      const total = getTotalAmount(filteredInvoices)
      const percentage = invoices.length > 0 ? (total / getTotalAmount(invoices)) * 100 : 0

      return {
        status,
        total,
        count: filteredInvoices.length,
        percentage,
      }
    })
  }

  const invoicesByStatus = getInvoicesByStatus(dateFilteredInvoices)

  function renderInvoicesTable(invoicesToRender: any[]) {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">Hisob-fakturalar ma'lumotlari yuklanmoqda...</p>
        </div>
      )
    }

    if (invoicesToRender.length === 0) {
      return (
        <div className="flex items-center justify-center h-[200px] border rounded-md">
          <p className="text-muted-foreground">Hisob-fakturalar mavjud emas</p>
        </div>
      )
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hisob-faktura №</TableHead>
              <TableHead>Obyekt</TableHead>
              <TableHead>Yetkazib beruvchi</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead>To'lov muddati</TableHead>
              <TableHead>Summa</TableHead>
              <TableHead>Holati</TableHead>
              <TableHead className="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoicesToRender.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.propertyName}</TableCell>
                <TableCell>{invoice.supplierName}</TableCell>
                <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                <TableCell>${invoice.amount.toLocaleString()}</TableCell>
                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled={invoice.status === "paid"}>
                      <DollarSign className="h-4 w-4" />
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
          <h2 className="text-3xl font-bold tracking-tight">Hisob-fakturalar</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Yangi hisob-faktura qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Yangi hisob-faktura qo'shish</DialogTitle>
                  <DialogDescription>Yangi hisob-faktura ma'lumotlarini kiriting</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="invoiceNumber">Hisob-faktura raqami</Label>
                      <Input
                        id="invoiceNumber"
                        name="invoiceNumber"
                        value={formData.invoiceNumber}
                        onChange={handleChange}
                        placeholder="Avtomatik yaratiladi"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Summa</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        value={formData.amount}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="propertyId">Obyekt</Label>
                      <Select
                        value={formData.propertyId}
                        onValueChange={(value) => handleSelectChange("propertyId", value)}
                        required
                      >
                        <SelectTrigger id="propertyId">
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
                      <Label htmlFor="supplierId">Yetkazib beruvchi</Label>
                      <Select
                        value={formData.supplierId}
                        onValueChange={(value) => handleSelectChange("supplierId", value)}
                        required
                      >
                        <SelectTrigger id="supplierId">
                          <SelectValue placeholder="Yetkazib beruvchini tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invoiceDate">Hisob-faktura sanasi</Label>
                      <Input
                        id="invoiceDate"
                        name="invoiceDate"
                        type="date"
                        value={formData.invoiceDate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">To'lov muddati</Label>
                      <Input
                        id="dueDate"
                        name="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="description">Tavsif</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami hisob-fakturalar</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${getTotalAmount(dateFilteredInvoices).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{dateFilteredInvoices.length} ta hisob-faktura</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">To'langan</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${invoicesByStatus.find((i) => i.status === "paid")?.total.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {invoicesByStatus.find((i) => i.status === "paid")?.count} ta hisob-faktura
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Muddati o'tgan</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${invoicesByStatus.find((i) => i.status === "overdue")?.total.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {invoicesByStatus.find((i) => i.status === "overdue")?.count} ta hisob-faktura
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
                    <TabsTrigger value="all">Barcha hisob-fakturalar</TabsTrigger>
                    <TabsTrigger value="paid">To'langan</TabsTrigger>
                    <TabsTrigger value="pending">Kutilmoqda</TabsTrigger>
                    <TabsTrigger value="overdue">Muddati o'tgan</TabsTrigger>
                  </TabsList>

                  <div className="flex flex-wrap gap-2">
                    <Input
                      placeholder="Hisob-fakturalarni qidirish..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />

                    <Select
                      value={filters.propertyId}
                      onValueChange={(value) => handleFilterChange("propertyId", value)}
                    >
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

                    <Select
                      value={filters.supplierId}
                      onValueChange={(value) => handleFilterChange("supplierId", value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Yetkazib beruvchi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Barcha yetkazib beruvchilar</SelectItem>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
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
                        <SelectItem value="week">So'nggi hafta</SelectItem>
                        <SelectItem value="month">So'nggi oy</SelectItem>
                        <SelectItem value="quarter">So'nggi chorak</SelectItem>
                        <SelectItem value="year">So'nggi yil</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilters({ status: "", propertyId: "", supplierId: "", dateRange: "all" })
                        setSearchTerm("")
                      }}
                    >
                      Tozalash
                    </Button>
                  </div>
                </div>

                <TabsContent value="all">{renderInvoicesTable(dateFilteredInvoices)}</TabsContent>

                <TabsContent value="paid">
                  {renderInvoicesTable(dateFilteredInvoices.filter((i) => i.status === "paid"))}
                </TabsContent>

                <TabsContent value="pending">
                  {renderInvoicesTable(dateFilteredInvoices.filter((i) => i.status === "pending"))}
                </TabsContent>

                <TabsContent value="overdue">
                  {renderInvoicesTable(dateFilteredInvoices.filter((i) => i.status === "overdue"))}
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

