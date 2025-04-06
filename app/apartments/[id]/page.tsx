"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/main-nav";
import { Search } from "@/components/search";
import { UserNav } from "@/components/user-nav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Building, Home, User, FileText, CreditCard, Edit, CalendarIcon, Download } from "lucide-react"; // Download icon qo'shildi
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { uz } from 'date-fns/locale'; // O'zbek tili uchun locale
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";

// Backend URL ni sozlang
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function ApartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [apartment, setApartment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentType: "naqd", // UserPayment uchun default
    description: "",
  });

  const [editForm, setEditForm] = useState({
    room_number: "",
    floor: "",
    rooms: "",
    area: "",
    price: "",
    description: "",
    status: "", // Boshlang'ich status
    object: "", // Obyekt ID sini saqlash uchun
  });

  const getAuthHeaders = (token: string | null = accessToken) => ({
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
      } else {
        setAccessToken(token);
      }
    }
  }, [router]);

  const fetchApartmentDetails = async (token: string) => {
    setLoading(true);
    try {
      const apartmentId = params.id;
      const apartmentResponse = await fetch(`${API_BASE_URL}/apartments/${apartmentId}/`, {
        method: "GET",
        headers: getAuthHeaders(token),
      });

      if (!apartmentResponse.ok) {
        if (apartmentResponse.status === 401) {
          localStorage.removeItem("access_token");
          router.push("/login");
          throw new Error("Sessiya muddati tugagan. Iltimos, qayta kiring.");
        }
        if (apartmentResponse.status === 404) {
          throw new Error(`Xonadon (ID: ${apartmentId}) topilmadi.`);
        }
        const errorData = await apartmentResponse.json().catch(() => ({}));
        throw new Error(`Xonadon ma'lumotlarini olishda xatolik (${apartmentResponse.status}): ${errorData.detail || apartmentResponse.statusText}`);
      }
      const apartmentData = await apartmentResponse.json();

      let payments = [];
      let documents = [];
      let client = null;
      let userPayments = [];
      let mainPaymentId = null;
      let clientId = null;

      // Asosiy Payment (shartnoma) ni topish uchun
      const allPaymentsResponse = await fetch(
        `${API_BASE_URL}/payments/?apartment=${apartmentId}&page_size=1`, // Eng oxirgi yoki asosiy shartnomani olish (logikaga qarab)
        { method: "GET", headers: getAuthHeaders(token) }
      );

      if (allPaymentsResponse.ok) {
        const paymentsData = await allPaymentsResponse.json();
        payments = paymentsData.results || [];
        if (payments.length > 0) {
            mainPaymentId = payments[0].id;
            clientId = payments[0].user;
        }
      }

      // Agar Payment topilsa va mijoz IDsi bo'lsa, mijoz va hujjatlarni yuklaymiz
      if (mainPaymentId && clientId) {
         // Parallel so'rovlar
         const [docsResponse, clientResponse, userPaymentsResponse] = await Promise.all([
            // Hujjatlarni olish
            fetch(`${API_BASE_URL}/documents/?payment=${mainPaymentId}&page_size=50`, { // Limitni oshirish mumkin
                 method: "GET", headers: getAuthHeaders(token)
            }),
            // Mijoz ma'lumotlarini olish
            fetch(`${API_BASE_URL}/users/${clientId}/`, {
                 method: "GET", headers: getAuthHeaders(token)
            }),
            // Foydalanuvchi To'lovlarini olish (UserPayment) - E'tibor bering: bu asosiy shartnoma to'lovlari emas
            fetch(`${API_BASE_URL}/user-payments/?user=${clientId}&page_size=100`, { // Foydalanuvchi bo'yicha filtr
                 method: "GET", headers: getAuthHeaders(token)
            })
         ]);

         if (docsResponse.ok) documents = (await docsResponse.json()).results || [];
         if (clientResponse.ok) client = await clientResponse.json();
         if (userPaymentsResponse.ok) userPayments = (await userPaymentsResponse.json()).results || [];

      } else if (apartmentData.owners && apartmentData.owners.length > 0) {
         // Agar Payment topilmasa lekin owners bo'lsa (eski data yoki boshqa logika)
         clientId = apartmentData.owners[0]; // Faraz qilamiz, birinchi owner asosiy
         const clientResponse = await fetch(`${API_BASE_URL}/users/${clientId}/`, {
            method: "GET", headers: getAuthHeaders(token)
         });
         if (clientResponse.ok) client = await clientResponse.json();
         // Bu holatda userPayments ham yuklanishi mumkin
         const userPaymentsResponse = await fetch(`${API_BASE_URL}/user-payments/?user=${clientId}&page_size=100`, {
            method: "GET", headers: getAuthHeaders(token)
         });
         if (userPaymentsResponse.ok) userPayments = (await userPaymentsResponse.json()).results || [];
      }


      setApartment({
        ...apartmentData,
        payments, // Asosiy shartnoma(lar)
        documents,
        client,
        userPayments, // User modeliga bog'liq alohida to'lovlar
      });

      // Edit form uchun ma'lumotlarni o'rnatish
      setEditForm({
        room_number: apartmentData.room_number || "",
        floor: apartmentData.floor?.toString() || "", // string ga o'tkazish
        rooms: apartmentData.rooms?.toString() || "", // string ga o'tkazish
        area: apartmentData.area?.toString() || "", // string ga o'tkazish
        price: apartmentData.price || "",
        description: apartmentData.description || "",
        status: apartmentData.status || "",
        object: apartmentData.object?.toString() || "", // ID ni string sifatida saqlash
      });

    } catch (error) {
      console.error("Ma'lumotlarni olish xatosi:", error);
      toast({
        title: "Xatolik",
        description: (error as Error).message || "Ma'lumotlarni olishda noma'lum xatolik.",
        variant: "destructive",
      });
      setApartment(null); // Xatolik bo'lsa, apartmentni null qilish
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchApartmentDetails(accessToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, params.id]); // params.id o'zgarganda ham qayta yuklash

  const handleOpenPaymentModal = () => {
     if (!apartment?.client?.id) {
        toast({ title: "Xatolik", description: "To'lov qo'shish uchun mijoz biriktirilmagan.", variant: "destructive" });
        return;
     }
    setSelectedDate(new Date());
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setPaymentForm({ amount: "", paymentType: "naqd", description: "" });
    setSelectedDate(new Date()); // Sanani reset qilish
  };

  const handleOpenEditModal = () => setIsEditModalOpen(true);
  const handleCloseEditModal = () => setIsEditModalOpen(false);

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentTypeChange = (value: string) => {
    setPaymentForm((prev) => ({ ...prev, paymentType: value }));
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditStatusChange = (value: string) => {
    setEditForm((prev) => ({ ...prev, status: value }));
  };

  // To'lov turi nomlarini olish (UserPayment uchun)
  const getUserPaymentTypeLabel = (paymentType: string) => {
    switch (paymentType) {
      case "naqd": return "Naqd pul";
      case "muddatli": return "Muddatli to‘lov (Balans)"; // Tushunmovchilik bo'lmasligi uchun
      case "ipoteka": return "Ipoteka (Balans)"; // Tushunmovchilik bo'lmasligi uchun
      default: return paymentType || "Noma'lum";
    }
  };
  // Asosiy Shartnoma To'lov turi nomlarini olish (Payment uchun)
    const getMainPaymentTypeLabel = (paymentType: string) => {
        switch (paymentType) {
            case 'naqd': return 'Naqd pul (To‘liq)';
            case 'muddatli': return 'Muddatli to‘lov';
            case 'ipoteka': return 'Ipoteka';
            case 'subsidiya': return 'Subsidiya';
            case 'band': return 'Band qilish';
            default: return paymentType || "Noma'lum";
        }
    };


  const generateReceiptPDF = (paymentData: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const lineHeight = 8; // Shrft kichikroq bo'lgani uchun
    let yPosition = margin;

    // Font sozlamalari (agar o'zbekcha shrift kerak bo'lsa, qo'shimcha sozlash kerak)
    // doc.addFont('path/to/your/font.ttf', 'CustomFont', 'normal');
    // doc.setFont('CustomFont');

    doc.setFontSize(16);
    doc.text("TO'LOV KVITANSIYASI", pageWidth / 2, yPosition, { align: "center" });
    yPosition += lineHeight * 2;

    doc.setFontSize(11);
    doc.text(`Xonadon: ${apartment?.room_number || "N/A"} (${apartment?.object?.name || "N/A"})`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Mijoz: ${apartment?.client?.fio || "Noma'lum"}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Telefon: ${apartment?.client?.phone_number || "-"}`, margin, yPosition);
    yPosition += lineHeight * 1.5;

    doc.line(margin, yPosition, pageWidth - margin, yPosition); // Chiziq
    yPosition += lineHeight * 1.5;

    doc.text(`To'lov Summasi: ${formatCurrency(paymentData.amount)}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`To'lov Sanasi: ${paymentData.payment_date ? format(new Date(paymentData.payment_date), "dd.MM.yyyy", { locale: uz }) : "-"}`, margin, yPosition);
    yPosition += lineHeight;
    // Bu UserPayment turi, shartnoma turi emasligini eslatish muhim
    doc.text(`To'lov Usuli (Balans uchun): ${getUserPaymentTypeLabel(paymentData.payment_type)}`, margin, yPosition);
    yPosition += lineHeight;

    if (paymentData.description) {
        // Uzun izohlarni bo'lish
        const splitDescription = doc.splitTextToSize(`Izoh: ${paymentData.description}`, pageWidth - margin * 2);
        doc.text(splitDescription, margin, yPosition);
        yPosition += lineHeight * splitDescription.length;
    }

    yPosition += lineHeight * 0.5;
    doc.line(margin, yPosition, pageWidth - margin, yPosition); // Chiziq
    yPosition += lineHeight * 1.5;

    doc.setFontSize(9);
    doc.text(`Kvitansiya ${format(new Date(), "dd.MM.yyyy HH:mm")} da yaratildi.`, margin, yPosition);
    yPosition += lineHeight;
    doc.text("Imzo: _________________", pageWidth - margin - 60, yPosition);

    doc.save(`Kvitansiya-X${apartment?.room_number}-${format(new Date(), "yyyyMMddHHmm")}.pdf`);
  };

  // UserPayment qo'shish funksiyasi (Mijoz balansiga)
  const handleAddUserPayment = async () => {
    setPaymentLoading(true);
    if (!accessToken || !apartment?.client?.id || !selectedDate) {
      toast({ title: "Xatolik", description: "Yetarli ma'lumot mavjud emas (Mijoz ID, sana).", variant: "destructive" });
      setPaymentLoading(false);
      return;
    }

    const clientId = apartment.client.id;
    const paymentAmount = Number(paymentForm.amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast({ title: "Xatolik", description: "Summa to'g'ri musbat son bo'lishi kerak.", variant: "destructive" });
      setPaymentLoading(false);
      return;
    }

    const newUserPaymentData = {
      amount: paymentAmount.toFixed(2), // 2 kasr qism bilan yuborish
      payment_type: paymentForm.paymentType,
      description: paymentForm.description,
      user: clientId,
      // Backend date qabul qilmasa, bu yerda formatlab yuborish kerak bo'lishi mumkin
      // date: format(selectedDate, "yyyy-MM-dd'T'HH:mm:ssxxx") // Masalan
    };

    try {
      const response = await fetch(`${API_BASE_URL}/user-payments/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newUserPaymentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("UserPayment qo'shish xatosi:", errorData);
        throw new Error(`To‘lov (balansga) qo‘shishda xatolik (${response.status}): ${errorData.detail || JSON.stringify(errorData) || response.statusText}`);
      }

      const newPaymentResponse = await response.json();
      toast({ title: "Muvaffaqiyat", description: "Mijoz balansiga to‘lov muvaffaqiyatli qo‘shildi" });

      // PDF generatsiya qilish
      generateReceiptPDF({
        ...newUserPaymentData,
        payment_date: format(selectedDate, "yyyy-MM-dd"), // PDF uchun sana
      });

      handleClosePaymentModal();
      // Ma'lumotlarni yangilash (faqat userPayments qismini yangilash optimallashtirish bo'lishi mumkin)
      if (accessToken) fetchApartmentDetails(accessToken);

    } catch (error) {
      console.error("UserPayment qo'shishda yakuniy xatolik:", error);
      toast({
        title: "Xatolik",
        description: (error as Error).message || "Balansga to‘lov qo‘shishda noma'lum xatolik.",
        variant: "destructive",
      });
    } finally {
      setPaymentLoading(false);
    }
  };


  const handleUpdateApartment = async () => {
    setEditLoading(true);
    if (!accessToken || !params.id || !editForm.object) {
      toast({ title: "Xatolik", description: "Xonadon ID yoki Obyekt ID topilmadi.", variant: "destructive" });
      setEditLoading(false);
      return;
    }

    const apartmentData = {
      room_number: editForm.room_number,
      floor: Number(editForm.floor),
      rooms: Number(editForm.rooms),
      area: parseFloat(editForm.area),
      price: parseFloat(editForm.price),
      description: editForm.description,
      status: editForm.status,
      object: parseInt(editForm.object, 10), // Backendga integer sifatida yuborish
    };

    // Validatsiya
    if (!apartmentData.room_number || isNaN(apartmentData.floor) || apartmentData.floor <= 0 || isNaN(apartmentData.rooms) || apartmentData.rooms <= 0 || isNaN(apartmentData.area) || apartmentData.area <= 0 || isNaN(apartmentData.price) || apartmentData.price < 0 || !apartmentData.status || isNaN(apartmentData.object)) {
      toast({ title: "Xatolik", description: "Barcha (*) belgili maydonlar to'g'ri to'ldirilishi kerak.", variant: "destructive" });
      setEditLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/apartments/${params.id}/`, {
        method: "PUT", // Yoki PATCH, agar qisman yangilash bo'lsa
        headers: getAuthHeaders(),
        body: JSON.stringify(apartmentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Xonadonni yangilash xatosi:", errorData);
        throw new Error(`Xonadonni yangilashda xatolik (${response.status}): ${errorData.detail || JSON.stringify(errorData) || response.statusText}`);
      }

      toast({ title: "Muvaffaqiyat", description: "Xonadon muvaffaqiyatli yangilandi" });
      handleCloseEditModal();
      if (accessToken) fetchApartmentDetails(accessToken); // Ma'lumotlarni yangilash

    } catch (error) {
      console.error("Xonadonni yangilashda yakuniy xatolik:", error);
      toast({
        title: "Xatolik",
        description: (error as Error).message || "Xonadonni yangilashda noma'lum xatolik.",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  // Status uchun Badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "bosh": return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Bo‘sh</Badge>;
            case "band": return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Band</Badge>;
            case "muddatli": return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">Muddatli</Badge>;
            case "sotilgan": return <Badge className="bg-green-500 hover:bg-green-600 text-white">Sotilgan</Badge>;
            case "ipoteka": return <Badge className="bg-purple-500 hover:bg-purple-600 text-white">Ipoteka</Badge>;
            case "subsidiya": return <Badge className="bg-teal-500 hover:bg-teal-600 text-white">Subsidiya</Badge>;
            default: return <Badge variant="secondary">{status || "Noma'lum"}</Badge>;
        }
    };

   // Payment Statusi uchun Badge
    const getPaymentStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid': return <Badge className="bg-green-600 hover:bg-green-700 text-white">To‘langan</Badge>;
            case 'pending': return <Badge variant="outline" className="text-yellow-600 border-yellow-500">Kutilmoqda</Badge>;
            case 'overdue': return <Badge variant="destructive">Muddati o‘tgan</Badge>;
            default: return <Badge variant="secondary">{status || "Noma'lum"}</Badge>;
        }
    };

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined || amount === "" || isNaN(Number(amount))) return "$0.00";
    // AQSH dollari formatida ko'rsatish
    return Number(amount).toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      // O'zbekiston vaqti bilan to'g'ri ko'rsatish uchun sozlash kerak bo'lishi mumkin
      return format(new Date(dateString), "dd.MM.yyyy", { locale: uz });
    } catch (e) {
      console.error("Sanani formatlash xatosi:", dateString, e);
      return dateString.split('T')[0] || "-"; // Xatolik bo'lsa, hech bo'lmasa sanani ko'rsatish
    }
  };

    // Shartnoma yuklash funksiyasi
    const handleDownloadContract = async (paymentId: number) => {
        if (!accessToken) return;
        toast({ title: "Boshlanmoqda...", description: "Shartnoma generatsiya qilinmoqda..." });
        try {
            const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/download_contract/`, {
                method: 'GET', // GET yoki POST bo'lishi mumkin (backendga qarab)
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    // 'Content-Type': 'application/json' // Agar POST bo'lsa va body bo'lsa
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                 throw new Error(`Shartnoma yuklashda xatolik (${response.status}): ${errorData.detail || JSON.stringify(errorData) || response.statusText}`);
            }

            // Faylni olish
            const blob = await response.blob();
            const contentDisposition = response.headers.get('content-disposition');
            let filename = `shartnoma_${paymentId}.docx`; // Default nom
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                if (filenameMatch && filenameMatch.length > 1) {
                    filename = filenameMatch[1];
                }
            }

            // Faylni yuklab olish uchun havola yaratish
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url); // Xotirani tozalash

            toast({ title: "Muvaffaqiyat", description: "Shartnoma yuklab olindi." });
            // Hujjatlar ro'yxatini yangilash
             if (accessToken) fetchApartmentDetails(accessToken);

        } catch (error) {
            console.error("Shartnoma yuklash xatosi:", error);
            toast({ title: "Xatolik", description: (error as Error).message || "Shartnomani yuklashda noma'lum xatolik.", variant: "destructive" });
        }
    };


  // ----- Render -----

  if (loading && !apartment) {
    // Skeleton loader yoki oddiy matn ko'rsatish
    return (
      <div className="flex min-h-screen flex-col">
        {/* Header qismi */}
        <div className="border-b sticky top-0 bg-background z-10">
          <div className="flex h-16 items-center px-4">
            <MainNav className="mx-6" />
            <div className="ml-auto flex items-center space-x-4"> <Search /> <UserNav /> </div>
          </div>
        </div>
        {/* Loading state */}
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!apartment) {
    // Xonadon topilmagan holat
    return (
      <div className="flex min-h-screen flex-col">
         {/* Header qismi */}
         <div className="border-b sticky top-0 bg-background z-10">
           <div className="flex h-16 items-center px-4">
             <MainNav className="mx-6" />
             <div className="ml-auto flex items-center space-x-4"> <Search /> <UserNav /> </div>
           </div>
         </div>
        {/* Content */}
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-red-600">Xonadon topilmadi</h2>
            <Button variant="outline" onClick={() => router.push("/apartments")}>
              <Home className="mr-2 h-4 w-4" /> Barcha xonadonlar
            </Button>
          </div>
          <p className="text-muted-foreground">Ushbu ID ({params.id}) ga ega xonadon mavjud emas yoki o'chirilgan.</p>
        </div>
      </div>
    );
  }

  // Asosiy shartnomani topish (odatda birinchi yoki oxirgisi)
  const mainPayment = apartment.payments?.[0];
  // User balance to'lovlari
  const userPayments = apartment.userPayments || [];
  // Hujjatlar
  const documents = apartment.documents || [];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="border-b sticky top-0 bg-background z-10">
        <div className="flex h-16 items-center px-4">
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4">
            <Search />
            <UserNav />
          </div>
        </div>
      </div>

      {/* Asosiy Kontent */}
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* Sarlavha va Harakatlar */}
        <div className="flex items-center justify-between space-y-2 flex-wrap gap-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Xonadon № {apartment.room_number}</h2>
            <p className="text-muted-foreground">{apartment.object_name || apartment.object?.name || "Noma'lum obyekt"}</p>
          </div>
          <div className="flex space-x-2 flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/apartments")}>
              <Home className="mr-2 h-4 w-4" /> Barcha xonadonlar
            </Button>
            {apartment.object && ( // object ID si mavjud bo'lsa
              <Link href={`/properties/${apartment.object}`} passHref>
                <Button variant="outline" size="sm">
                  <Building className="mr-2 h-4 w-4" /> Obyektga qaytish
                </Button>
              </Link>
            )}
            {/* Sotish/Band qilish tugmasi */}
            {(apartment.status === "bosh") && (
              <Button
                size="sm"
                onClick={() => router.push(`/apartments/${apartment.id}/reserve`)}
              >
                <User className="mr-2 h-4 w-4" /> Band qilish / Sotish
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleOpenEditModal}>
              <Edit className="mr-2 h-4 w-4" /> Tahrirlash
            </Button>
             {/* Shartnoma yuklash tugmasi (agar shartnoma mavjud bo'lsa) */}
             {mainPayment && (
                <Button variant="outline" size="sm" onClick={() => handleDownloadContract(mainPayment.id)}>
                    <Download className="mr-2 h-4 w-4" /> Shartnoma
                </Button>
            )}
          </div>
        </div>

        {/* Xonadon Ma'lumotlari va Umumiy Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chap Tomon: Rasm va Tavsif */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                {/* Rasm */}
                <div className="relative h-[250px] md:h-[350px] bg-gray-200 dark:bg-gray-700">
                  <img
                    // Backend obyekt rasmini yubormasa, xonadon rasmini ishlatish (agar bo'lsa)
                    src={apartment.object?.image || apartment.image || "/placeholder.svg?h=350&w=600"}
                    alt={`Xonadon ${apartment.room_number}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { // Rasm yuklanmasa placeholder ko'rsatish
                      e.currentTarget.src = "/placeholder.svg?h=350&w=600";
                      e.currentTarget.onerror = null;
                    }}
                  />
                  <div className="absolute top-4 right-4">{getStatusBadge(apartment.status)}</div>
                </div>
                {/* Asosiy Xususiyatlar va Tavsif */}
                <div className="p-4 md:p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 border-b pb-4 dark:border-gray-700">
                    {/* Qavat, Xonalar, Maydon, Narx */}
                    <InfoItem label="Qavat" value={apartment.floor || "-"} />
                    <InfoItem label="Xonalar" value={`${apartment.rooms || "-"} xona`} />
                    <InfoItem label="Maydon" value={`${apartment.area || "-"} m²`} />
                    <InfoItem label="Narx" value={formatCurrency(apartment.price)} className="text-green-600 dark:text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Tavsif</h3>
                  <p className="text-sm text-muted-foreground break-words">
                    {apartment.description || <span className="italic">Tavsif mavjud emas</span>}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* O'ng Tomon: Umumiy Ma'lumot, Mijoz, Shartnoma */}
          <div className="sticky top-20 self-start"> {/* Sticky qilish */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Umumiy ma'lumot</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <InfoItem label="Holati:" value={getStatusBadge(apartment.status)} alignRight />

                  {/* Mijoz Ma'lumotlari (agar mavjud bo'lsa) */}
                  {apartment.client ? (
                    <div className="border-t pt-3 space-y-1 dark:border-gray-700">
                      <h4 className="text-sm font-semibold text-muted-foreground mb-1">Mijoz</h4>
                      <InfoItem label="F.I.O:" value={apartment.client.fio || "Noma'lum"} alignRight boldValue/>
                      <InfoItem label="Telefon:" value={apartment.client.phone_number || "-"} alignRight />
                      {/* Kafillik ma'lumotlarini ham qo'shish mumkin */}
                       {apartment.client.kafil_fio && (
                           <>
                            <div className="border-t pt-2 mt-2 dark:border-gray-600">
                               <h5 className="text-xs font-semibold text-muted-foreground mb-0.5">Kafil</h5>
                                <InfoItem label="Kafil FIO:" value={apartment.client.kafil_fio} alignRight />
                                <InfoItem label="Kafil Tel:" value={apartment.client.kafil_phone_number || "-"} alignRight />
                            </div>
                           </>
                       )}
                    </div>
                  ) : (apartment.status !== 'bosh') ? ( // Agar sotilgan/band bo'lsa lekin mijoz yo'q bo'lsa
                    <p className="text-xs text-muted-foreground italic border-t pt-3 dark:border-gray-700">
                      Mijoz ma'lumotlari topilmadi yoki biriktirilmagan.
                    </p>
                  ): null}

                  {/* Shartnoma Ma'lumotlari (agar mavjud bo'lsa) */}
                  {mainPayment ? (
                    <div className="border-t pt-3 space-y-1 dark:border-gray-700">
                      <h4 className="text-sm font-semibold text-muted-foreground mb-1">Shartnoma (#{mainPayment.id})</h4>
                      <InfoItem label="Shartnoma turi:" value={getMainPaymentTypeLabel(mainPayment.payment_type)} alignRight capitalizeValue />
                      <InfoItem label="Shartnoma sanasi:" value={formatDate(mainPayment.created_at)} alignRight />
                      {/* Muddatli/Ipoteka uchun qo'shimcha info */}
                      {(mainPayment.payment_type === 'muddatli' || mainPayment.payment_type === 'ipoteka') && (
                        <>
                          <InfoItem label="Boshlang'ich:" value={formatCurrency(mainPayment.initial_payment)} alignRight boldValue />
                          <InfoItem label="Oylik to'lov:" value={formatCurrency(mainPayment.monthly_payment)} alignRight boldValue />
                          <InfoItem label="Muddat / Foiz:" value={`${mainPayment.duration_months || "-"} oy / ${mainPayment.interest_rate ?? 0}%`} alignRight />
                           <InfoItem label="To'lov kuni:" value={`Har oy ${mainPayment.due_date || "?"}-sanasi`} alignRight />
                        </>
                      )}
                      {/* To'lov Progressi */}
                      <InfoItem label="Jami to'langan:" value={formatCurrency(mainPayment.paid_amount)} alignRight boldValue className="text-green-700 dark:text-green-500" />
                      <InfoItem label="Qoldiq:" value={formatCurrency(mainPayment.total_amount - (mainPayment.paid_amount || 0))} alignRight boldValue className="text-red-700 dark:text-red-500" />
                      <InfoItem label="Shartnoma statusi:" value={getPaymentStatusBadge(mainPayment.status)} alignRight />
                    </div>
                  ) : (apartment.status !== 'bosh') ? ( // Agar sotilgan/band bo'lsa lekin shartnoma yo'q bo'lsa
                    <p className="text-xs text-muted-foreground italic border-t pt-3 dark:border-gray-700">
                      Shartnoma ma'lumotlari topilmadi.
                    </p>
                  ) : null }

                  {/* To'lov qo'shish tugmasi (faqat mijoz va shartnoma bo'lsa) */}
                  {mainPayment && apartment.client && (
                    <Button size="sm" className="w-full mt-4" onClick={handleOpenPaymentModal}>
                      <CreditCard className="mr-2 h-4 w-4" /> Balansga To‘lov Qo‘shish
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tablar: To'lovlar tarixi, Hujjatlar, Jadval */}
        {(mainPayment) && ( // Faqat shartnoma mavjud bo'lsa tablarni ko'rsatish
          <Tabs defaultValue="payments_history" className="mt-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3">
              <TabsTrigger value="payments_history">Balans To‘lovlari</TabsTrigger>
              <TabsTrigger value="documents">Hujjatlar</TabsTrigger>
              {/* Jadval faqat muddatli/ipoteka uchun */}
              {(mainPayment?.payment_type === 'muddatli' || mainPayment?.payment_type === 'ipoteka') && (
                <TabsTrigger value="payment_schedule">To‘lov Jadvali</TabsTrigger>
              )}
            </TabsList>

            {/* Balans To'lovlari Tabi (UserPayment) */}
            <TabsContent value="payments_history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Mijoz Balansiga Qilingan To'lovlar</CardTitle>
                  <CardDescription>Bu yerda mijozning umumiy balansiga qilingan to'lovlar (UserPayment) ko'rsatiladi.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto"> {/* Scroll qo'shildi */}
                    {userPayments.length > 0 ? (
                      userPayments
                        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()) // date bo'yicha sort
                        .map((up: any) => (
                          <div key={up.id} className="flex justify-between items-start p-3 border rounded-md hover:bg-accent/50 dark:border-gray-700 text-xs">
                            <div className="flex-1 pr-4">
                              <div className="font-medium text-sm mb-0.5">{formatCurrency(up.amount)}</div>
                              <div className="text-muted-foreground">
                                {formatDate(up.date)} - {getUserPaymentTypeLabel(up.payment_type)}
                              </div>
                              {up.description && (
                                <div className="text-muted-foreground italic mt-1 text-xs break-words">"{up.description}"</div>
                              )}
                            </div>
                            <div className="text-muted-foreground text-right whitespace-nowrap">ID: {up.id}</div>
                          </div>
                        ))
                    ) : (
                      <p className="text-muted-foreground text-sm italic text-center py-4">
                        Mijoz balansiga hali to'lovlar qilinmagan.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Hujjatlar Tabi */}
            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Biriktirilgan Hujjatlar</CardTitle>
                  <CardDescription>Shartnoma va boshqa tegishli fayllar.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {documents.length > 0 ? (
                      documents.map((doc: any) => (
                        <div key={doc.id} className="flex justify-between items-center p-3 border rounded-md hover:bg-accent/50 dark:border-gray-700 text-xs">
                           <div className="flex items-center gap-3 overflow-hidden">
                              <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                               <div className="overflow-hidden">
                                 {/* Fayl nomini ko'rsatish */}
                                <div className="font-medium text-sm truncate" title={doc.docx_file?.split('/').pop() || doc.pdf_file?.split('/').pop() || doc.image?.split('/').pop() || `Hujjat ${doc.id}`}>
                                   {doc.docx_file?.split('/').pop() || doc.pdf_file?.split('/').pop() || doc.image?.split('/').pop() || `Hujjat ${doc.id}`}
                                 </div>
                                <div className="text-muted-foreground capitalize">{doc.document_type} | Qo'shildi: {formatDate(doc.created_at)}</div>
                               </div>
                            </div>
                           {/* Yuklash tugmasi */}
                            {(doc.docx_file || doc.pdf_file || doc.image) && (
                               <Button variant="outline" size="sm" asChild className="ml-2 flex-shrink-0">
                                 <a href={`${API_BASE_URL}${doc.docx_file || doc.pdf_file || doc.image}`} target="_blank" rel="noopener noreferrer" download>
                                     <Download className="h-4 w-4 mr-1"/> Yuklash
                                 </a>
                               </Button>
                            )}
                         </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm italic text-center py-4">
                        Hujjatlar mavjud emas. Shartnoma generatsiya qilish uchun yuqoridagi "Shartnoma" tugmasini bosing.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* To'lov Jadvali Tabi */}
            {(mainPayment?.payment_type === 'muddatli' || mainPayment?.payment_type === 'ipoteka') && (
              <TabsContent value="payment_schedule" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Rejalashtirilgan To‘lovlar Jadvali</CardTitle>
                    <CardDescription>Kelajakdagi oylik to'lovlar (agar mavjud bo'lsa).</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Jadvalni generatsiya qilish logikasi (backenddan olish yoki frontendda hisoblash) */}
                     {mainPayment && mainPayment.monthly_payment > 0 && mainPayment.duration_months > 0 ? (
                       <div className="space-y-4">
                         {/* Umumiy info */}
                         <div className="flex justify-between items-center p-3 border rounded-md bg-accent/50 dark:border-gray-700 text-xs">
                            <div>
                               <div className="font-medium text-sm">Oylik to'lov</div>
                               <div className="text-muted-foreground">Har oyning {mainPayment.due_date || "?"}-sanasi</div>
                            </div>
                            <div className="text-right">
                               <div className="font-medium text-sm">{formatCurrency(mainPayment.monthly_payment)}</div>
                                <div className="text-muted-foreground">{mainPayment.duration_months} oy davomida</div>
                            </div>
                          </div>

                          {/* Bu yerga batafsil jadvalni chiqarish mumkin */}
                          <p className="text-muted-foreground text-xs italic text-center py-2">
                              Batafsil oylar kesimida jadval ko'rsatish funksiyasi keyinroq qo'shiladi.
                          </p>
                       </div>
                     ) : (
                        <p className="text-muted-foreground text-sm italic text-center py-4">
                         Rejalashtirilgan oylik to'lovlar mavjud emas yoki hisoblanmagan.
                       </p>
                     )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>

      {/* ----- Modallar ----- */}

      {/* Yangi To'lov Qo'shish Modal (UserPayment uchun) */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Mijoz Balansiga To'lov Qo'shish</DialogTitle>
            <CardDescription>Xonadon №{apartment?.room_number} mijozining ({apartment?.client?.fio}) balansiga.</CardDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Summa */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right text-sm">Summa ($)*</Label>
              <Input id="amount" name="amount" type="number" value={paymentForm.amount} onChange={handlePaymentChange} placeholder="0.00" className="col-span-3" required step="0.01" min="0.01"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4 -mt-2"><span className="col-start-2 col-span-3 text-xs text-muted-foreground">{formatCurrency(paymentForm.amount)}</span></div>
            {/* Sana */}
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="paymentDate" className="text-right text-sm">Sana*</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP", { locale: uz }) : <span>Sanani tanlang</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus /></PopoverContent>
                </Popover>
            </div>
            {/* To'lov Turi (UserPayment uchun) */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentType" className="text-right text-sm">To‘lov Usuli* <br/><span className="text-xs text-muted-foreground">(Balansga)</span></Label>
                <div className="col-span-3">
                    <Select value={paymentForm.paymentType} onValueChange={handlePaymentTypeChange}>
                        <SelectTrigger id="paymentType"><SelectValue placeholder="Usulni tanlang" /></SelectTrigger>
                        <SelectContent position="popper">
                            {/* UserPayment modelidagi turlar */}
                            <SelectItem value="naqd">Naqd pul</SelectItem>
                            <SelectItem value="muddatli">Bank O'tkazmasi</SelectItem> {/* Nomini o'zgartirish mumkin */}
                            <SelectItem value="ipoteka">Kartadan</SelectItem> {/* Nomini o'zgartirish mumkin */}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {/* Izoh */}
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right text-sm mt-1">Izoh</Label>
                <Textarea id="description" name="description" value={paymentForm.description} onChange={handlePaymentChange} placeholder="To'lov haqida qo'shimcha ma'lumot (ixtiyoriy)" className="col-span-3" rows={2}/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClosePaymentModal} disabled={paymentLoading}>Bekor qilish</Button>
            <Button onClick={handleAddUserPayment} disabled={paymentLoading || !paymentForm.amount || !selectedDate || parseFloat(paymentForm.amount) <= 0}>
              {paymentLoading ? "Saqlanmoqda..." : "Saqlash va Kvitansiya"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Xonadonni Tahrirlash Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Xonadon №{editForm.room_number} ni Tahrirlash</DialogTitle>
            <CardDescription>Obyekt: {apartment?.object_name || apartment?.object?.name}</CardDescription>
          </DialogHeader>
          {/* Scrollable Content */}
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-6 -mx-6 md:px-2 md:-mx-2">
            <EditInput label="Xonadon №*" id="edit_room_number" name="room_number" value={editForm.room_number} onChange={handleEditChange} required />
            <EditInput label="Qavat*" id="edit_floor" name="floor" type="number" value={editForm.floor} onChange={handleEditChange} required min="0" />
            <EditInput label="Xonalar soni*" id="edit_rooms" name="rooms" type="number" value={editForm.rooms} onChange={handleEditChange} required min="1"/>
            <EditInput label="Maydon (m²)*" id="edit_area" name="area" type="number" step="0.01" value={editForm.area} onChange={handleEditChange} required min="0.01"/>
            {/* Narx */}
            <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="edit_price" className="text-right text-sm">Narx ($)*</Label>
                <Input id="edit_price" name="price" type="number" step="0.01" value={editForm.price} onChange={handleEditChange} className="col-span-3" required min="0"/>
            </div>
             <div className="grid grid-cols-4 items-center gap-4 -mt-2"><span className="col-start-2 col-span-3 text-xs text-muted-foreground">{formatCurrency(editForm.price)}</span></div>
             {/* Tavsif */}
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit_description" className="text-right text-sm mt-1">Tavsif</Label>
                <Textarea id="edit_description" name="description" value={editForm.description} onChange={handleEditChange} placeholder="Xonadon haqida qo'shimcha ma'lumot" className="col-span-3" rows={3}/>
            </div>
            {/* Holati */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_status" className="text-right text-sm">Holati*</Label>
                <div className="col-span-3">
                    <Select value={editForm.status} onValueChange={handleEditStatusChange}>
                        <SelectTrigger id="edit_status"><SelectValue placeholder="Holati tanlang" /></SelectTrigger>
                        <SelectContent position="popper">
                            {/* Apartment modelidagi barcha statuslar */}
                            <SelectItem value="bosh">Bo‘sh</SelectItem>
                            <SelectItem value="band">Band qilingan</SelectItem>
                            <SelectItem value="muddatli">Muddatli</SelectItem>
                            <SelectItem value="sotilgan">Sotilgan</SelectItem>
                            <SelectItem value="ipoteka">Ipoteka</SelectItem>
                            <SelectItem value="subsidiya">Subsidiya</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditModal} disabled={editLoading}>Bekor qilish</Button>
            <Button onClick={handleUpdateApartment} disabled={editLoading}>
              {editLoading ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ----- Yordamchi Komponentlar -----

// Umumiy ma'lumotlar uchun qator komponenti
function InfoItem({ label, value, className = "", alignRight = false, boldValue = false, capitalizeValue = false }: { label: string, value: React.ReactNode, className?: string, alignRight?: boolean, boldValue?: boolean, capitalizeValue?: boolean }) {
  return (
    <div className={`flex ${alignRight ? 'justify-between items-center' : 'flex-col'}`}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-base ${boldValue ? 'font-medium' : ''} ${alignRight ? 'text-right' : ''} ${capitalizeValue ? 'capitalize': ''} ${className}`}>
        {value}
      </span>
    </div>
  );
}

// Tahrirlash modalidagi Input uchun komponent
function EditInput({ label, id, ...props }: { label: string, id: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={id} className="text-right text-sm">{label}</Label>
            <Input id={id} {...props} className="col-span-3" />
        </div>
    );
}