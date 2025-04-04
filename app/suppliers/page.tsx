"use client"

import type React from "react"

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
import { Plus, Eye, Edit, Trash } from "lucide-react"
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

export default function SuppliersPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    description: "",
  })

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      // Generate mock suppliers data
      const mockSuppliers = Array.from({ length: 10 }, (_, i) => {
        return {
          id: i + 1,
          name: `Yetkazib beruvchi ${i + 1}`,
          contactPerson: `Aloqa shaxsi ${i + 1}`,
          phone: `+998 9${i % 10} ${100 + i} ${10 + i} ${20 + i}`,
          email: `supplier${i + 1}@example.com`,
          address: "Toshkent sh., Chilonzor tumani",
          description: "Qurilish materiallari yetkazib beruvchi",
          totalPurchases: Math.floor(Math.random() * 50000) + 10000,
          balance: Math.floor(Math.random() * 10000) - 5000,
        }
      })

      setSuppliers(mockSuppliers)
      setLoading(false)
    }, 1000)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Simulate API call
    setTimeout(() => {
      const newSupplier = {
        id: suppliers.length + 1,
        ...formData,
        totalPurchases: 0,
        balance: 0,
      }

      setSuppliers([newSupplier, ...suppliers])
      setFormData({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        description: "",
      })
      setOpen(false)

      toast({
        title: "Yetkazib beruvchi qo'shildi",
        description: "Yangi yetkazib beruvchi muvaffaqiyatli qo'shildi",
      })
    }, 500)
  }

  const filteredSuppliers = suppliers.filter((supplier) => {
    if (
      searchTerm &&
      !supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !supplier.phone.includes(searchTerm)
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
          <h2 className="text-3xl font-bold tracking-tight">Yetkazib beruvchilar</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Yangi yetkazib beruvchi qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Yangi yetkazib beruvchi qo'shish</DialogTitle>
                  <DialogDescription>Yangi yetkazib beruvchi ma'lumotlarini kiriting</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Kompaniya nomi</Label>
                      <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson">Aloqa shaxsi</Label>
                      <Input
                        id="contactPerson"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="address">Manzil</Label>
                      <Input id="address" name="address" value={formData.address} onChange={handleChange} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="description">Tavsif</Label>
                      <Input id="description" name="description" value={formData.description} onChange={handleChange} />
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

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Yetkazib beruvchilarni qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Tozalash
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-muted-foreground">Yetkazib beruvchilar ma'lumotlari yuklanmoqda...</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kompaniya nomi</TableHead>
                        <TableHead>Aloqa shaxsi</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Balans</TableHead>
                        <TableHead>Jami xaridlar</TableHead>
                        <TableHead className="text-right">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSuppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell>{supplier.contactPerson}</TableCell>
                          <TableCell>{supplier.phone}</TableCell>
                          <TableCell>{supplier.email}</TableCell>
                          <TableCell>
                            {supplier.balance >= 0 ? (
                              <span className="text-green-600">${supplier.balance.toLocaleString()}</span>
                            ) : (
                              <span className="text-red-600">-${Math.abs(supplier.balance).toLocaleString()}</span>
                            )}
                          </TableCell>
                          <TableCell>${supplier.totalPurchases.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/suppliers/${supplier.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
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
      </div>
    </div>
  )
}

