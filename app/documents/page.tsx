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
import { Plus, Download, Eye, Edit, Trash } from "lucide-react"
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

export default function DocumentsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [open, setOpen] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    docFile: null as File | null,
    pdfFile: null as File | null,
  })

  // API so‘rovlar uchun umumiy header
  const getAuthHeaders = () => ({
    "Accept": "application/json",
    "Authorization": `Bearer ${accessToken}`,
  })

  // Tokenni faqat client-side’da olish
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token")
      setAccessToken(token)
    }
  }, [])

  // Hujjatlarni olish (paginatsiya bilan)
  const fetchDocuments = async () => {
    setLoading(true)
    let allDocuments: any[] = []
    let nextUrl = "http://api.ahlan.uz/documents/" // Bu yerda haqiqiy API endpoint kiritilishi kerak

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
          throw new Error("Hujjatlarni olishda xatolik")
        }

        const data = await response.json()
        const documentsList = data.results || []
        const formattedDocuments = documentsList.map((doc: any) => ({
          id: doc.id,
          title: doc.title || "To'lov hujjati",
          type: doc.type || "payment",
          propertyName: doc.property_name || "Noma'lum",
          clientName: doc.client_name || "Noma'lum",
          apartmentNumber: doc.apartment_number || "Noma'lum",
          date: doc.created_at || new Date().toISOString(),
          fileUrl: doc.file_url || "#",
        }))
        allDocuments = [...allDocuments, ...formattedDocuments]
        nextUrl = data.next // Keyingi sahifa URL’si
      }
      setDocuments(allDocuments)
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.message || "Hujjatlarni olishda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Hujjat qo‘shish
  const createDocument = async () => {
    if (!formData.docFile && !formData.pdfFile) {
      toast({
        title: "Xatolik",
        description: "Kamida bitta fayl yuklash kerak",
        variant: "destructive",
      })
      return
    }

    const formDataToSend = new FormData()
    formDataToSend.append("title", "To'lov hujjati")
    formDataToSend.append("type", "payment")
    if (formData.docFile) formDataToSend.append("doc_file", formData.docFile)
    if (formData.pdfFile) formDataToSend.append("pdf_file", formData.pdfFile)

    try {
      const response = await fetch("http://api.ahlan.uz/documents/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
        body: formDataToSend,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Hujjat qo‘shishda xatolik")
      }

      toast({
        title: "Muvaffaqiyat",
        description: "Yangi hujjat muvaffaqiyatli qo‘shildi",
      })
      fetchDocuments()
      setOpen(false)
      setFormData({
        docFile: null,
        pdfFile: null,
      })
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.message || "Hujjat qo‘shishda xatolik yuz berdi",
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
    fetchDocuments()
  }, [accessToken, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, [field]: e.target.files![0] }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createDocument()
  }

  const getDocumentTypeLabel = (type: string) => {
    return <Badge className="bg-green-500">To'lov hujjati</Badge>
  }

  const filteredDocuments = documents.filter((document) => {
    if (
      searchTerm &&
      !document.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !document.clientName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !document.propertyName.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="text-3xl font-bold tracking-tight">Hujjatlar</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Yangi hujjat qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Yangi hujjat qo'shish</DialogTitle>
                  <DialogDescription>To'lov hujjati ma'lumotlarini kiriting</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="docFile">Doc file *</Label>
                    <Input
                      id="docFile"
                      name="docFile"
                      type="file"
                      onChange={(e) => handleFileChange(e, "docFile")}
                      accept=".doc,.docx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pdfFile">Pdf file *</Label>
                    <Input
                      id="pdfFile"
                      name="pdfFile"
                      type="file"
                      onChange={(e) => handleFileChange(e, "pdfFile")}
                      accept=".pdf"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-green-500 hover:bg-green-600">
                    Saqlash
                  </Button>
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
                  placeholder="Hujjatlarni qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-muted-foreground">Hujjatlar ma'lumotlari yuklanmoqda...</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hujjat nomi</TableHead>
                        <TableHead>Turi</TableHead>
                        <TableHead>Obyekt</TableHead>
                        <TableHead>Mijoz</TableHead>
                        <TableHead>Xonadon</TableHead>
                        <TableHead>Sana</TableHead>
                        <TableHead className="text-right">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.map((document) => (
                        <TableRow key={document.id}>
                          <TableCell className="font-medium">{document.title}</TableCell>
                          <TableCell>{getDocumentTypeLabel(document.type)}</TableCell>
                          <TableCell>{document.propertyName}</TableCell>
                          <TableCell>{document.clientName}</TableCell>
                          <TableCell>{document.apartmentNumber}</TableCell>
                          <TableCell>{new Date(document.date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Download className="h-4 w-4" />
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