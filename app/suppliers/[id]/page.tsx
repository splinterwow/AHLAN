"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/main-nav"
import { Search } from "@/components/search"
import { UserNav } from "@/components/user-nav"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { User, Phone, Mail, MapPin, Building, DollarSign, FileText, Plus } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"

export default function SupplierDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [supplier, setSupplier] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    type: "payment",
    invoiceNumber: "",
  })

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const supplierId = Number(params.id)

      // Mock data
      const mockSupplier = {
        id: supplierId,
        name: `Yetkazib beruvchi ${supplierId}`,
        contactPerson: `Aloqa shaxsi ${supplierId}`,
        phone: `+998 9${supplierId % 10} ${100 + supplierId} ${10 + supplierId} ${20 + supplierId}`,
        email: `supplier${supplierId}@example.com`,
        address: "Toshkent sh., Chilonzor tumani",
        description: "Qurilish materiallari yetkazib beruvchi",
        totalPurchases: Math.floor(Math.random() * 50000) + 10000,
        balance: Math.floor(Math.random() * 10000) - 5000,
        transactions: Array.from({ length: 10 }, (_, i) => {
          const types = ["purchase", "payment"]
          const type = types[Math.floor(Math.random() * types.length)]
          const date = new Date()
          date.setDate(date.getDate() - Math.floor(Math.random() * 30))

          return {
            id: i + 1,
            date: date.toISOString(),
            amount:
              type === "purchase"
                ? -(Math.floor(Math.random() * 5000) + 1000)
                : Math.floor(Math.random() * 5000) + 1000,
            description: type === "purchase" ? "Qurilish materiallari xaridi" : "To'lov",
            type,
            invoiceNumber: type === "purchase" ? `INV-${2023}${String(i + 1).padStart(4, "0")}` : "",
          }
        }),
        invoices: Array.from({ length: 5 }, (_, i) => {
          const statuses = ["paid", "pending", "overdue"]
          const status = statuses[Math.floor(Math.random() * statuses.length)]
          const date = new Date()
          date.setDate(date.getDate() - Math.floor(Math.random() * 30))

          return {
            id: i + 1,
            invoiceNumber: `INV-${2023}${String(i + 1).padStart(4, "0")}`,
            date: date.toISOString(),
            amount: Math.floor(Math.random() * 5000) + 1000,
            status,
            description: "Qurilish materiallari xaridi",
          }
        }),
      }

      setSupplier(mockSupplier)
      setLoading(false)
    }, 1000)
  }, [params.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Simulate API call
    setTimeout(() => {
      const newTransaction = {
        id: supplier.transactions.length + 1,
        date: formData.date,
        amount: formData.type === "purchase" ? -Number.parseFloat(formData.amount) : Number.parseFloat(formData.amount),
        description: formData.description,
        type: formData.type,
        invoiceNumber: formData.invoiceNumber,
      }

      const updatedSupplier = {
        ...supplier,
        transactions: [newTransaction, ...supplier.transactions],
        balance:
          supplier.balance +
          (formData.type === "purchase" ? -Number.parseFloat(formData.amount) : Number.parseFloat(formData.amount)),
      }

      setSupplier(updatedSupplier)
      setFormData({
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        type: "payment",
        invoiceNumber: "",
      })
      setOpen(false)

      toast({
        title: "Tranzaksiya qo'shildi",
        description: "Yangi tranzaksiya muvaffaqiyatli qo'shildi",
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

  if (loading) {
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
          <div className="flex items-center justify-center h-[80vh]">
            <p className="text-muted-foreground">Ma'lumotlar yuklanmoqda...</p>
          </div>
        </div>
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
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{supplier.name}</h2>
            <p className="text-muted-foreground">Yetkazib beruvchi ma'lumotlari</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/suppliers")}>
              <Building className="mr-2 h-4 w-4" />
              Barcha yetkazib beruvchilar
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Yangi tranzaksiya
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Yangi tranzaksiya qo'shish</DialogTitle>
                    <DialogDescription>Yangi tranzaksiya ma'lumotlarini kiriting</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Tranzaksiya turi</Label>
                      <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Tranzaksiya turini tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="payment">To'lov</SelectItem>
                          <SelectItem value="purchase">Xarid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                        <Label htmlFor="date">Sana</Label>
                        <Input
                          id="date"
                          name="date"
                          type="date"
                          value={formData.date}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    {formData.type === "purchase" && (
                      <div className="space-y-2">
                        <Label htmlFor="invoiceNumber">Hisob-faktura raqami</Label>
                        <Input
                          id="invoiceNumber"
                          name="invoiceNumber"
                          value={formData.invoiceNumber}
                          onChange={handleChange}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="description">Tavsif</Label>
                      <Input
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Saqlash</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Yetkazib beruvchi ma'lumotlari</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <User className="mr-2 h-5 w-5 text-muted-foreground" />
                    <span>{supplier.contactPerson}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="mr-2 h-5 w-5 text-muted-foreground" />
                    <span>{supplier.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="mr-2 h-5 w-5 text-muted-foreground" />
                    <span>{supplier.email}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5 text-muted-foreground" />
                    <span>{supplier.address}</span>
                  </div>
                  <div className="flex items-center">
                    <Building className="mr-2 h-5 w-5 text-muted-foreground" />
                    <span>{supplier.description}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Umumiy ma'lumotlar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Balans</p>
                    {supplier.balance >= 0 ? (
                      <p className="text-2xl font-bold text-green-600">${supplier.balance.toLocaleString()}</p>
                    ) : (
                      <p className="text-2xl font-bold text-red-600">-${Math.abs(supplier.balance).toLocaleString()}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Jami xaridlar</p>
                    <p className="text-2xl font-bold">${supplier.totalPurchases.toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">So'nggi tranzaksiya</p>
                    <p className="text-2xl font-bold">{new Date(supplier.transactions[0].date).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">Tranzaksiyalar</TabsTrigger>
            <TabsTrigger value="invoices">Hisob-fakturalar</TabsTrigger>
          </TabsList>
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tranzaksiyalar tarixi</CardTitle>
                <CardDescription>Yetkazib beruvchi bilan barcha tranzaksiyalar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sana</TableHead>
                        <TableHead>Tavsif</TableHead>
                        <TableHead>Hisob-faktura</TableHead>
                        <TableHead>Turi</TableHead>
                        <TableHead className="text-right">Summa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplier.transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>{transaction.invoiceNumber || "-"}</TableCell>
                          <TableCell>
                            {transaction.type === "purchase" ? (
                              <Badge variant="outline" className="text-red-500 border-red-500">
                                Xarid
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-500 border-green-500">
                                To'lov
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.amount >= 0 ? (
                              <span className="text-green-600">${transaction.amount.toLocaleString()}</span>
                            ) : (
                              <span className="text-red-600">-${Math.abs(transaction.amount).toLocaleString()}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hisob-fakturalar</CardTitle>
                <CardDescription>Yetkazib beruvchi bilan bog'liq barcha hisob-fakturalar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hisob-faktura №</TableHead>
                        <TableHead>Sana</TableHead>
                        <TableHead>Tavsif</TableHead>
                        <TableHead>Summa</TableHead>
                        <TableHead>Holati</TableHead>
                        <TableHead className="text-right">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplier.invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                          <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                          <TableCell>{invoice.description}</TableCell>
                          <TableCell>${invoice.amount.toLocaleString()}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" disabled={invoice.status === "paid"}>
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

