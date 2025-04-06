"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/main-nav";
import { Search } from "@/components/search";
import { UserNav } from "@/components/user-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { Plus, Download, Eye, Edit, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    payment: "",
    document_type: "",
    docx_file: null as File | null,
    pdf_file: null as File | null,
    image: null as File | null,
  });

  const getAuthHeaders = () => ({
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      setAccessToken(token);
    }
  }, []);

  const fetchPayments = async () => {
    let allPayments: any[] = [];
    let nextUrl = "http://api.ahlan.uz/payments/";

    try {
      while (nextUrl) {
        const response = await fetch(nextUrl, {
          method: "GET",
          headers: getAuthHeaders(),
        });

        if (!response.ok) throw new Error("To‘lovlarni olishda xatolik");

        const data = await response.json();
        allPayments = [...allPayments, ...(data.results || data)];
        nextUrl = data.next;
      }
      setPayments(allPayments);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.message || "To‘lovlarni yuklashda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    let allDocuments: any[] = [];
    let nextUrl = "http://api.ahlan.uz/documents/";

    try {
      while (nextUrl) {
        const response = await fetch(nextUrl, {
          method: "GET",
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          if (response.status === 401) {
            const confirmLogout = window.confirm("Sessiya tugagan. Qayta kirishni xohlaysizmi?");
            if (confirmLogout) router.push("/login");
            throw new Error("Sessiya tugagan, qayta kirish kerak");
          }
          throw new Error("Hujjatlarni olishda xatolik");
        }

        const data = await response.json();
        const documentsList = data.results || [];

        const formattedDocuments = documentsList.map((doc: any) => {
          const relatedPayment = payments.find((payment) => payment.id === doc.payment);
          let propertyName = relatedPayment?.apartment_info?.split(" - ")[0] || "Noma'lum";
          const clientName = relatedPayment?.user_fio || "Noma'lum";
          let apartmentNumber =
            relatedPayment?.apartment_info?.split(" - ")[1]?.split(" xonali")[0] || "Noma'lum";

          return {
            id: doc.id,
            title: doc.document_type || "To'lov hujjati",
            type: doc.document_type,
            propertyName,
            clientName,
            apartmentNumber,
            date: doc.created_at || new Date().toISOString(),
            fileUrl: doc.docx_file || doc.pdf_file || doc.image || "#",
          };
        });

        allDocuments = [...allDocuments, ...formattedDocuments];
        nextUrl = data.next;
      }
      setDocuments(allDocuments);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.message || "Hujjatlarni olishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async () => {
    if (!formData.payment || !formData.document_type) {
      toast({
        title: "Xatolik",
        description: "To‘lov va hujjat turini tanlash kerak",
        variant: "destructive",
      });
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("payment", formData.payment);
    formDataToSend.append("document_type", formData.document_type);
    if (formData.docx_file) formDataToSend.append("docx_file", formData.docx_file);
    if (formData.pdf_file) formDataToSend.append("pdf_file", formData.pdf_file);
    if (formData.image) formDataToSend.append("image", formData.image);

    try {
      const response = await fetch("http://api.ahlan.uz/documents/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Hujjat qo‘shishda xatolik");
      }

      toast({
        title: "Muvaffaqiyat",
        description: "Yangi hujjat muvaffaqiyatli qo‘shildi",
      });
      fetchDocuments();
      setOpen(false);
      setFormData({
        payment: "",
        document_type: "",
        docx_file: null,
        pdf_file: null,
        image: null,
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.message || "Hujjat qo‘shishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (accessToken === null) return;
    if (!accessToken) {
      toast({ title: "Xatolik", description: "Tizimga kirish talab qilinadi", variant: "destructive" });
      router.push("/login");
      return;
    }
    fetchPayments();
    fetchDocuments();
  }, [accessToken, router]);

  useEffect(() => {
    if (payments.length > 0) fetchDocuments();
  }, [payments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, [field]: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDocument();
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      kvitansiya: "Kvitansiya",
      shartnoma: "Shartnoma",
      chek: "Chek",
      boshqa: "Boshqa",
    };
    return <Badge className="bg-green-500">{types[type] || "Noma'lum"}</Badge>;
  };

  const filteredDocuments = documents.filter((document) =>
    [document.title, document.clientName, document.propertyName].some((field) =>
      field?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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
                  <DialogDescription>Hujjat ma'lumotlarini kiriting</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment">To‘lov *</Label>
                    <Select
                      value={formData.payment}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, payment: value }))}
                    >
                      <SelectTrigger id="payment">
                        <SelectValue placeholder="To‘lovni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {payments.map((payment) => {
                          // Payment format: user_fio - apartment_info - payment_type
                          const userFio = payment.user_fio || "Noma'lum";
                          const apartmentInfo = payment.apartment_info || "Noma'lum";
                          const paymentType = payment.payment_type || "Noma'lum";
                          const displayText = `${userFio} - ${apartmentInfo} - ${paymentType}`;
                          return (
                            <SelectItem key={payment.id} value={payment.id.toString()}>
                              {displayText}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document_type">Hujjat turi *</Label>
                    <Select
                      value={formData.document_type}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, document_type: value }))}
                    >
                      <SelectTrigger id="document_type">
                        <SelectValue placeholder="Hujjat turini tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kvitansiya">Kvitansiya</SelectItem>
                        <SelectItem value="shartnoma">Shartnoma</SelectItem>
                        <SelectItem value="chek">Chek</SelectItem>
                        <SelectItem value="boshqa">Boshqa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="docx_file">Docx fayl</Label>
                    <Input
                      id="docx_file"
                      name="docx_file"
                      type="file"
                      onChange={(e) => handleFileChange(e, "docx_file")}
                      accept=".doc,.docx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pdf_file">PDF fayl</Label>
                    <Input
                      id="pdf_file"
                      name="pdf_file"
                      type="file"
                      onChange={(e) => handleFileChange(e, "pdf_file")}
                      accept=".pdf"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Rasm</Label>
                    <Input
                      id="image"
                      name="image"
                      type="file"
                      onChange={(e) => handleFileChange(e, "image")}
                      accept="image/*"
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
  );
}