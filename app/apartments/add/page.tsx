"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MainNav } from "@/components/main-nav"
import { Search } from "@/components/search"
import { UserNav } from "@/components/user-nav"
import { Textarea } from "@/components/ui/textarea"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"

export default function AddApartmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const propertyIdParam = searchParams.get("propertyId")

  const [loading, setLoading] = useState(false)
  const [properties, setProperties] = useState<any[]>([])
  const [formData, setFormData] = useState({
    object: propertyIdParam || "",
    room_number: "",
    floor: "",
    rooms: "",
    area: "",
    price: "",
    description: "",
    status: "bosh", // Default status
  })

  // Tokenni localStorage yoki boshqa joydan olish (masalan, login sahifasidan saqlangan deb faraz qilamiz)
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

  // Obyektlar ro‘yxatini API’dan olish
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch("http://api.ahlan.uz/objects/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) {
          throw new Error("Obyektlarni yuklashda xatolik yuz berdi")
        }
        const data = await response.json()
        setProperties(data.results || data) // Pagination ishlatilgan bo‘lsa 'results' ishlatiladi
      } catch (error) {
        toast({
          title: "Xatolik",
          description: error.message || "Obyektlarni yuklashda xatolik",
          variant: "destructive",
        })
      }
    }

    if (token) {
      fetchProperties()
    } else {
      toast({
        title: "Xatolik",
        description: "Foydalanuvchi autentifikatsiyadan o‘tmagan",
        variant: "destructive",
      })
      router.push("/login") // Login sahifasiga yo‘naltirish
    }
  }, [token, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // API’ga yuborish uchun ma'lumotlarni tayyorlash
    const payload = {
      object: Number(formData.object), // ForeignKey sifatida raqam
      room_number: Number(formData.room_number), // PositiveIntegerField
      rooms: Number(formData.rooms), // PositiveIntegerField
      area: Number(formData.area), // FloatField
      floor: Number(formData.floor), // PositiveIntegerField
      price: Number(formData.price), // DecimalField, raqam sifatida yuboriladi
      status: formData.status, // Choices bilan cheklangan
      description: formData.description || "", // TextField, bo‘sh bo‘lishi mumkin
    }

    try {
      const response = await fetch("http://api.ahlan.uz/apartments/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // JWT token qo‘shildi
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Xonadon qo'shishda xatolik yuz berdi")
      }

      const data = await response.json()
      setLoading(false)
      toast({
        title: "Xonadon qo'shildi",
        description: "Yangi xonadon muvaffaqiyatli qo'shildi",
      })
      router.push("/apartments")
    } catch (error) {
      setLoading(false)
      toast({
        title: "Xatolik",
        description: error.message || "Xonadon qo'shishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
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
          <h2 className="text-3xl font-bold tracking-tight">Yangi xonadon qo'shish</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Xonadon ma'lumotlari</CardTitle>
            <CardDescription>Yangi xonadon haqida asosiy ma'lumotlarni kiriting</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="object">Obyekt</Label>
                  <Select
                    value={formData.object}
                    onValueChange={(value) => handleSelectChange("object", value)}
                    required
                  >
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
                  <Label htmlFor="room_number">Xonadon raqami</Label>
                  <Input
                    id="room_number"
                    name="room_number"
                    type="number"
                    placeholder="Masalan: 1001"
                    value={formData.room_number}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="floor">Qavat</Label>
                  <Input
                    id="floor"
                    name="floor"
                    type="number"
                    placeholder="Masalan: 10"
                    value={formData.floor}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rooms">Xonalar soni</Label>
                  <Input
                    id="rooms"
                    name="rooms"
                    type="number"
                    placeholder="Masalan: 3"
                    value={formData.rooms}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">Maydon (m²)</Label>
                  <Input
                    id="area"
                    name="area"
                    type="number"
                    step="0.01"
                    placeholder="Masalan: 75.5"
                    value={formData.area}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Narx (so‘m)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    placeholder="Masalan: 50000000.00"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Tavsif</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Xonadon haqida qo'shimcha ma'lumot"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.push("/apartments")}>
                Bekor qilish
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}