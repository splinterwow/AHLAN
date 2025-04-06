"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MainNav } from "@/components/main-nav";
import { Search } from "@/components/search";
import { UserNav } from "@/components/user-nav";
import { Textarea } from "@/components/ui/textarea";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Home, Plus, Printer, UserPlus, Loader2 } from "lucide-react";
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import * as docx from "docx";

export default function ReserveApartmentPage() {
  const params = useParams();
  const router = useRouter();
  const [apartment, setApartment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [paymentType, setPaymentType] = useState("muddatli");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showKafil, setShowKafil] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [requestReceipt, setRequestReceipt] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("existing");

  const [formData, setFormData] = useState({
    clientId: "",
    initialPayment: "",
    totalMonths: "12",
    comments: "",
    name: "",
    phone: "",
    address: "",
    kafilFio: "",
    kafilPhone: "",
    kafilAddress: "",
    due_date: 15,
  });

  const API_BASE_URL = "http://api.ahlan.uz";
  const PAGE_SIZE = 100; // Mijozlar ro'yxati uchun page size

  const getAuthHeaders = () => ({
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      setAccessToken(token);
    }
  }, []);

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^\+998\d{9}$/;
    return phoneRegex.test(phone);
  };

  const fetchAllClients = async () => {
    let allClients: any[] = [];
    let nextUrl: string | null = `${API_BASE_URL}/users/?user_type=mijoz&page_size=${PAGE_SIZE}`;

    try {
      while (nextUrl) {
        const response = await fetch(nextUrl, {
          method: "GET",
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Mijozlarni olishda xatolik (${response.status})`);
        }

        const data = await response.json();
        allClients = [...allClients, ...(data.results || [])];
        nextUrl = data.next;
      }
      return allClients;
    } catch (error) {
      throw error;
    }
  };

  const fetchData = async () => {
    if (!accessToken) {
      toast({ title: "Xatolik", description: "Avtorizatsiya qilinmagan.", variant: "destructive" });
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const apartmentId = params.id;
      if (!apartmentId) throw new Error("Xonadon ID topilmadi.");

      const apartmentResponse = await fetch(`${API_BASE_URL}/apartments/${apartmentId}/`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!apartmentResponse.ok) {
        if (apartmentResponse.status === 404) throw new Error("Xonadon topilmadi.");
        throw new Error(`Xonadon ma'lumotlarini olishda xatolik (${apartmentResponse.status})`);
      }
      const apartmentData = await apartmentResponse.json();
      setApartment(apartmentData);

      const allClients = await fetchAllClients();
      setClients(allClients);

      setFormData((prev) => ({
        ...prev,
        initialPayment: apartmentData?.price && paymentType !== "naqd"
          ? Math.round(apartmentData.price * 0.3).toString()
          : apartmentData?.price.toString(),
        totalMonths: paymentType === "naqd" ? "0" : (prev.totalMonths === "0" ? "12" : prev.totalMonths),
      }));
    } catch (error) {
      console.error("Fetch data error:", error);
      toast({ title: "Xatolik", description: (error as Error).message, variant: "destructive" });
      if ((error as Error).message.includes("topilmadi")) router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && params.id) {
      fetchData();
    }
  }, [accessToken, params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const createClient = async (): Promise<any> => {
    if (!accessToken) throw new Error("Avtorizatsiya qilinmagan.");

    if (!validatePhoneNumber(formData.phone)) {
      throw new Error("Telefon raqami noto'g'ri formatda. To'g'ri format: +998901234567");
    }
    if (formData.kafilPhone && !validatePhoneNumber(formData.kafilPhone)) {
      throw new Error("Kafil telefon raqami noto'g'ri formatda. To'g'ri format: +998901234567");
    }

    const clientData = {
      fio: formData.name,
      phone_number: formData.phone,
      address: formData.address || "",
      user_type: "mijoz",
      kafil_fio: formData.kafilFio || null,
      kafil_phone_number: formData.kafilPhone || null,
      kafil_address: formData.kafilAddress || null,
      password: formData.phone,
    };

    if (!clientData.fio || !clientData.phone_number) {
      throw new Error("Yangi mijoz uchun F.I.O. va telefon raqami majburiy.");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(clientData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Create client error data:", errorData);
        let errorMessage = `Mijoz qo'shishda xatolik (${response.status})`;
        if (errorData.phone_number && errorData.phone_number.includes("already exists")) {
          errorMessage = "Bu telefon raqami allaqachon ro'yxatdan o'tgan.";
        } else if (errorData && typeof errorData === "object") {
          const firstErrorKey = Object.keys(errorData)[0];
          if (firstErrorKey && Array.isArray(errorData[firstErrorKey])) {
            errorMessage = `${firstErrorKey}: ${errorData[firstErrorKey][0]}`;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        }
        throw new Error(errorMessage);
      }
      return await response.json();
    } catch (error) {
      throw new Error((error as Error).message || "Mijoz qo'shishda noma'lum xatolik");
    }
  };

  const handleAddClient = async () => {
    if (!formData.name || !formData.phone) {
      toast({
        title: "Ma'lumot yetarli emas",
        description: "Iltimos, yangi mijoz uchun F.I.O. va telefon raqamini kiriting.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingClient(true);
    try {
      const newClient = await createClient();
      toast({
        title: "Muvaffaqiyat!",
        description: `${newClient.fio} mijozlar ro'yxatiga qo'shildi.`,
      });
      setClients((prev) => [...prev, newClient]);
      handleSelectChange("clientId", newClient.id.toString());
      setActiveTab("existing");
      setFormData((prev) => ({
        ...prev,
        name: "",
        phone: "",
        address: "",
        kafilFio: "",
        kafilPhone: "",
        kafilAddress: "",
      }));
      setShowKafil(false);
    } catch (error) {
      console.error("Mijoz qo'shishda xatolik:", error);
      toast({
        title: "Xatolik",
        description: (error as Error).message || "Mijozni qo'shishda noma'lum xatolik yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setIsAddingClient(false);
    }
  };

  const calculateMonthlyPayment = () => {
    if (!apartment || paymentType === "naqd") return 0;
    if (!formData.initialPayment || !formData.totalMonths || Number(formData.totalMonths) <= 0) return 0;
    const principal = Math.max(0, apartment.price - Number.parseInt(formData.initialPayment));
    const months = Number(formData.totalMonths);
    const monthlyPayment = principal / months;
    if (monthlyPayment > Number.MAX_SAFE_INTEGER) {
      throw new Error("Hisoblangan oylik to'lov juda katta.");
    }
    return monthlyPayment;
  };

  const generateContractText = (paymentId: number, client: any) => {
    const currentDate = new Date().toLocaleDateString("us-US", { day: "2-digit", month: "long", year: "numeric" });
    const priceInWords = (price: number): string => Number(price || 0).toLocaleString("us-US");
    if (!apartment) return "Xonadon ma'lumotlari topilmadi.";

    const finalPrice = paymentType === "naqd" ? apartment.price : apartment.price;
    const formattedPrice = Number(finalPrice).toLocaleString("us-US");
    const priceWords = priceInWords(finalPrice);
    const initialPaymentFormatted = Number(formData.initialPayment || 0).toLocaleString("us-US");
    let monthlyPaymentFormatted = "0";
    try {
      monthlyPaymentFormatted = calculateMonthlyPayment().toLocaleString("us-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch (e) {
      monthlyPaymentFormatted = "Hisoblashda xato";
    }
    const endDate = new Date();
    if (paymentType !== "naqd" && formData.totalMonths && Number(formData.totalMonths) > 0) {
      endDate.setMonth(endDate.getMonth() + Number(formData.totalMonths));
    }
    const endDateString = endDate.toLocaleDateString("us-US");

    // TODO: "AXLAN HOUSE" MCHJ ma'lumotlarini backenddan olish mumkin
    return `
                ДАСТЛАБКИ ШАРТНОМА № ${paymentId}
    Куп хонадонли турар-жой биноси қуриш ва сотиш тўғрисида

« ${currentDate} »                                           Қўқон шаҳри

Қўқон шаҳар «AXLAN HOUSE» МЧЖ номидан низомга асосан фаолият юритувчи
раҳбари SODIQOV XASANJON MUXSINJONOVICH (кейинги ўринларда «Бажарувчи»
деб юритилади) бир томондан ҳамда «${client.fio}» (кейинги ўринларда
«Буюртмачи» деб аталади), иккинчи томондан Ўзбекистон Республикасининг
«Хўжалик юритувчи субъектлар фаолиятининг шартномавий-хуқуқий базаси
тўғрисида»ги қонунига мувофиқ мазкур шартномани қуйидагилар тўғрисида
туздик.

                          I. ШАРТНОМА ПРЕДМЕТИ

1. Томонлар «Буюртмачи» хонадон сотиб олишга розилиги тўғрисида
   «Бажарувчи»га ариза орқали мурожаат этгандан сўнг, Ўзбекистон
   Республикаси, Фарғона вилояти, Қўқон шаҳар,
   ${apartment.object_name || "Номаълум Обиект"} да жойлашган
   ${apartment.floor || "N/A"}-қаватли ${apartment.room_number || "N/A"}-хонадонли (${apartment.rooms || "?"} хонали,
   умумий майдони ${apartment.area || "?"} кв.м) турар-жой биносини қуришга, буюртмачи
   вазифасини бажариш тўғрисида шартномани (кейинги ўринларда - асосий
   шартнома) тузиш мажбуриятини ўз зиммаларига оладилар.

                          II. МУҲИМ ШАРТЛАР

1. Томонлар қуйидагиларни асосий шартноманинг муҳим шартлари деб
   ҳисоблашга келишиб оладилар:
   а) «Буюртмачи»га топшириладиган ${apartment.room_number || "N/A"}-хонадоннинг умумий
      қийматининг бошланғич нархи ${formattedPrice} (${priceWords}) сўмни
      ташкил этади ва ушбу нарх томонлар томонидан келишилган ҳолда
      ${paymentType === "naqd" ? "ўзгармайди" : "ўзгариши мумкин"};
   б) Бажарувчи «тайёр ҳолда топшириш» шартларида турар-жой биносини
      қуришга бажарувчи вазифасини бажариш мажбуриятини ўз зиммасига
      олади ва лойиҳага мувофиқ қуриш бўйича барча ишларни пудратчиларни
      жалб қилган ҳолда ва ўз маблағлари ва/ёки жалб этилган маблағлар
      билан бажариш мажбуриятини, «Буюртмачи» эса шартнома бўйича
      мажбуриятларни лозим даражада бажариш, шу жумладан шартномада
      келишилган баҳони тўлаш, шунингдек қурилиш ишлари тугаганда, ўзига
      тегишли бўлган хонадонни қабул қилиб олиш мажбуриятини олади.
   в) Шартномада назарда тутилган қурилишнинг давом этиш вақти ва
      ишларни бажариш муддатлари ва қиймати бажарувчининг (пудратчи)
      танлаш натижаларига мувофиқ белгиланади;

                       III. ҲИСОБ-КИТОБ ТАРТИБИ

1) «Буюртмачи» томонидан мазкур шартнома имзолангач,
   ${paymentType === "naqd"
     ? `тўлиқ тўловни (${initialPaymentFormatted} сўм) дарҳол`
     : `${formData.totalMonths} ой давомида (${endDateString} гача)`
   }
   банкдаги ҳисоб-варағига хонадон умумий қийматини, яъни
   ${formattedPrice} (${priceWords}) сўм миқдорида пул маблағини
   ўтказади.
${paymentType !== "naqd"
  ? `   - Бошланғич тўлов: ${initialPaymentFormatted} so'm (${currentDate}).
   - Ойлик тўлов: ${monthlyPaymentFormatted} so'm (har oyning ${formData.due_date || 15}-sanasigacha).`
  : ""
}

                    IV. ШАРТНОМАНИНГ АМАЛ ҚИЛИШИ

4.1. Мазкур шартнома Томонлар уни имзолаган кундан бошлаб амалга киради
     ва асосий шартнома тузилгунга қадар амалда бўлади.
4.2. Бажарувчининг ташаббуси билан мазкур шартнома қуйидаги холларда
     бекор қилиниши мумкин:
     - «Буюртмачи» томонидан мазкур шартнома тузилгандан кейин
       ${paymentType === "naqd"
         ? "тўлиқ тўловни"
         : `${endDateString} гача бўлган муддатда белгиланган тўловларни`}
       амалга оширмаса;

                         V. ЯКУНИЙ ҚОИДАЛАР

5.1. Томонларнинг ҳар бири ўз мажбуриятларини лозим даражада, мазкур
     шартнома шартларига мувофиқ бажариши лозим.
5.2. Томонларнинг мазкур шартнома бўйича юзага келган низолари уларнинг
     келишуви бўйича ҳал этилади, бундай келишувга эришилмаган тақдирда
     суд томонидан ҳал этилади.
5.3. Мазкур шартнома уч нусхада тузилган бўлиб, улардан бири Банкка
     берилади, қолган иккитаси томонларга бир нусхадан топширилади.
     Барча нусхалар бир хил ва тенг юридик кучга эга.

               VI. ТОМОНЛАРНИНГ РЕКВИЗИТЛАРИ ВА ИМЗОЛАРИ

Бажарувчи:                                Буюртмачи:
«AXLAN HOUSE» МЧЖ                         «${client.fio}»
Фарғона вилояти, Қўқон шаҳар,             Телефон: ${client.phone_number || "Кўрсатилмаган"}
Адабиёт кўчаси, 25-уй                     Манзил: ${client.address || "Кўрсатилмаган"}
СТИР: 306997685
ХХТУТ: 61110
Х/р: 20208000205158478001
МФО: 01076 Ипотека банк                    ${client.kafil_fio ? `\nКафил: ${client.kafil_fio}` : ""}
       Қўқон филиали                       ${client.kafil_phone_number ? `Кафил тел: ${client.kafil_phone_number}` : ""}
Тел № (+99833) 701-75 75

_________________________                   _________________________
        (имзо)                                           (имзо)
    `.trim();
  };

  const generateContractWordBlob = async (paymentId: number, client: any) => {
    const contractText = generateContractText(paymentId, client);
    const lines = contractText.split("\n");
    const formatParagraph = (line: string) => {
      const commonProps = { size: 24, font: "Times New Roman" };
      if (line.startsWith("ДАСТЛАБКИ ШАРТНОМА №")) {
        return new Paragraph({
          children: [new TextRun({ text: line, bold: true, size: 28, font: commonProps.font })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        });
      } else if (line.match(/^(I|II|III|IV|V|VI)\./)) {
        return new Paragraph({
          children: [new TextRun({ text: line, bold: true, ...commonProps })],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150 },
        });
      } else if (line.match(/^\d+\)/) || line.match(/^[а-я]\)/) || line.trim().startsWith("-")) {
        return new Paragraph({
          children: [new TextRun({ text: line, ...commonProps })],
          indent: { left: 720 },
          spacing: { after: 100 },
        });
      } else if (line.trim().startsWith("Бажарувчи:") || line.trim().startsWith("Буюртмачи:")) {
        const parts = line.split(/:\s*/);
        return new Paragraph({
          children: [
            new TextRun({ text: `${parts[0]}:`, bold: true, ...commonProps }),
            ...(parts[1] ? [new TextRun({ text: `\t${parts[1]}`, bold: true, ...commonProps })] : []),
          ],
          spacing: { before: 300, after: 100 },
          tabStops: [{ type: docx.TabStopType.LEFT, position: 4320 }],
        });
      } else if (
        line.includes(":") &&
        (line.includes("СТИР:") ||
          line.includes("Телефон:") ||
          line.includes("Х/р:") ||
          line.includes("МФО:") ||
          line.includes("Манзил:") ||
          line.includes("Кафил:"))
      ) {
        const [key, value] = line.split(/:(.+)/);
        return new Paragraph({
          children: [
            new TextRun({ text: `${key?.trim()}:`, ...commonProps }),
            new TextRun({ text: `\t${value?.trim() || ""}`, ...commonProps }),
          ],
          indent: { left: line.trim().startsWith("Кафил") ? 720 : 0 },
          spacing: { after: 50 },
          tabStops: [{ type: docx.TabStopType.LEFT, position: 2160 }],
        });
      } else if (line.trim() === "") {
        return new Paragraph({ children: [], spacing: { after: 100 } });
      } else {
        return new Paragraph({
          children: [new TextRun({ text: line, ...commonProps })],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100 },
        });
      }
    };

    const doc = new Document({
      creator: "Ahlan House System",
      title: `Shartnoma №${paymentId}`,
      description: `Xonadon band qilish shartnomasi ${client.fio} uchun`,
      sections: [
        {
          properties: {
            page: { margin: { top: 1440, right: 1080, bottom: 1440, left: 1080 } },
          },
          children: lines.map(formatParagraph),
        },
      ],
      styles: {
        paragraphStyles: [
          {
            id: "Normal",
            name: "Normal",
            run: { font: "Times New Roman", size: 24 },
            paragraph: { spacing: { after: 120 }, alignment: AlignmentType.JUSTIFIED },
          },
          {
            id: "CenteredTitle",
            name: "Centered Title",
            basedOn: "Normal",
            run: { bold: true, size: 28 },
            paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 240 } },
          },
          {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            run: { bold: true },
            paragraph: { alignment: AlignmentType.LEFT, spacing: { before: 360, after: 180 } },
          },
          {
            id: "ListItem",
            name: "List Item",
            basedOn: "Normal",
            paragraph: { alignment: AlignmentType.LEFT, indent: { left: 720 }, spacing: { after: 100 } },
          },
        ],
      },
    });
    return await Packer.toBlob(doc);
  };

  const handleDownloadContractWord = async (paymentId: number, client: any) => {
    try {
      const blob = await generateContractWordBlob(paymentId, client);
      saveAs(blob, `Shartnoma_${paymentId}_${client.fio.replace(/\s+/g, "_")}.docx`);
      toast({ title: "Muvaffaqiyat", description: "Shartnoma fayli yuklab olindi." });
    } catch (error) {
      console.error("Error generating or downloading Word contract:", error);
      toast({
        title: "Xatolik",
        description: "Shartnoma faylini yaratishda yoki yuklashda xatolik.",
        variant: "destructive",
      });
    }
  };

  const handlePrintContract = () => {
    if (!requestReceipt || !receiptRef.current) return;
    const printContent = receiptRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "height=600,width=800");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Shartnoma №${requestReceipt.id}</title>
            <style>
              body { font-family: 'Times New Roman', Times, serif; margin: 30px; font-size: 12pt; line-height: 1.5; }
              pre { white-space: pre-wrap; word-wrap: break-word; font-family: 'Times New Roman', Times, serif; font-size: 12pt; }
              h1, h2, h3 { text-align: center; }
              @page { size: A4; margin: 2cm; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 250);
    } else {
      toast({
        title: "Xatolik",
        description: "Chop etish oynasini ochib bo‘lmadi. Brauzeringizda popup blokerni tekshiring.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId) {
      toast({
        title: "Mijoz tanlanmagan",
        description: "Iltimos, avval mijozni tanlang yoki 'Yangi mijoz' bo'limidan qo'shing.",
        variant: "destructive",
      });
      return;
    }

    if (!accessToken || !apartment) {
      toast({ title: "Xatolik", description: "Kerakli ma'lumotlar topilmadi.", variant: "destructive" });
      return;
    }
    if (apartment.status !== "sotuvda" && apartment.status !== "bosh") {
      toast({
        title: "Mumkin emas",
        description: "Bu xonadon allaqachon band qilingan yoki sotilgan.",
        variant: "destructive",
      });
      return;
    }
    if (paymentType === "naqd" && (!formData.initialPayment || Number(formData.initialPayment) <= 0)) {
      toast({
        title: "Xatolik",
        description: "Naqd to'lov uchun to'lanayotgan summani kiriting.",
        variant: "destructive",
      });
      return;
    }
    if (paymentType === "muddatli" && Number(formData.initialPayment) < apartment.price * 0.3) {
      toast({
        title: "Xatolik",
        description: `Boshlang'ich to'lov kamida 30% bo'lishi kerak (${Math.round(apartment.price * 0.3).toLocaleString("us-US")} so'm).`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const clientDetails = clients.find((c) => c.id.toString() === formData.clientId);
      if (!clientDetails) {
        throw new Error(`Tanlangan mijoz (ID: ${formData.clientId}) ma'lumotlari topilmadi.`);
      }
      const finalClientDetails = {
        ...clientDetails,
        kafil_fio: formData.kafilFio || clientDetails.kafil_fio || null,
        kafil_phone_number: formData.kafilPhone || clientDetails.kafil_phone_number || null,
      };

      let calculatedMonthlyPayment = 0;
      try {
        calculatedMonthlyPayment = calculateMonthlyPayment();
      } catch (error) {
        toast({ title: "Hisoblash xatoligi", description: (error as Error).message, variant: "destructive" });
        setSubmitting(false);
        return;
      }

      const finalPrice = paymentType === "naqd" ? apartment.price : apartment.price;

      const paymentPayload = {
        user: Number(formData.clientId),
        apartment: Number(params.id),
        payment_type: paymentType,
        total_amount: finalPrice.toString(),
        initial_payment: formData.initialPayment || "0",
        duration_months: paymentType === "naqd" ? 0 : Number(formData.totalMonths),
        monthly_payment: paymentType === "naqd" ? "0" : calculatedMonthlyPayment.toFixed(2),
        due_date: formData.due_date || 15,
        paid_amount: paymentType === "naqd" ? formData.initialPayment || "0" : "0",
        status: paymentType === "naqd" ? "paid" : "pending",
        additional_info: formData.comments || "",
      };

      const paymentResponse = await fetch(`${API_BASE_URL}/payments/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(paymentPayload),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json().catch(() => ({}));
        console.error("Payment creation error:", errorData);
        let errorMessage = `To'lov yozuvini yaratishda xatolik (${paymentResponse.status})`;
        if (errorData && typeof errorData === "object") {
          const firstErrorKey = Object.keys(errorData)[0];
          const errorValue = errorData[firstErrorKey];
          if (firstErrorKey && Array.isArray(errorValue) && errorValue.length > 0) {
            errorMessage = errorValue[0];
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (typeof errorValue === "string") {
            errorMessage = `${firstErrorKey}: ${errorValue}`;
          }
        }
        throw new Error(errorMessage);
      }

      const paymentResult = await paymentResponse.json();
      const contractText = generateContractText(paymentResult.id, finalClientDetails);
      setRequestReceipt({ id: paymentResult.id, client: finalClientDetails, contractText });
      setIsReceiptModalOpen(true);

      toast({
        title: "Muvaffaqiyat!",
        description: `Xonadon №${apartment.room_number} band qilindi. To'lov ID: ${paymentResult.id}`,
      });

      try {
        await fetch(`${API_BASE_URL}/apartments/${params.id}/`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ status: paymentPayload.status === "paid" ? "sotilgan" : "band" }),
        });
      } catch (patchError) {
        console.error("Failed to update apartment status:", patchError);
        toast({
          title: "Ogohlantirish",
          description: "Xonadon statusini avtomatik yangilab bo'lmadi.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Band qilish jarayonida xatolik:", error);
      toast({ title: "Xatolik yuz berdi", description: (error as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
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

      <main className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Xonadon band qilish</h2>
            <p className="text-muted-foreground">
              {apartment ? `№ ${apartment.room_number}, ${apartment.object_name || "Noma'lum obyekt"}` : "Xonadon topilmadi"}
            </p>
          </div>
          {apartment && (
            <Button variant="outline" size="sm" onClick={() => router.push(`/apartments/${apartment.id}`)}>
              <Home className="mr-2 h-4 w-4" /> Xonadonga qaytish
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Band qilish ma'lumotlari</CardTitle>
                <CardDescription>Mijoz va to'lov ma'lumotlarini kiriting.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="existing">Mavjud mijoz</TabsTrigger>
                      <TabsTrigger value="new">Yangi mijoz</TabsTrigger>
                    </TabsList>
                    <TabsContent value="existing">
                      <div className="space-y-2 pt-2">
                        <Label htmlFor="clientId">Mijozni tanlang</Label>
                        <Select
                          value={formData.clientId}
                          onValueChange={(value) => {
                            handleSelectChange("clientId", value);
                            setFormData((prev) => ({
                              ...prev,
                              name: "",
                              phone: "",
                              address: "",
                              kafilFio: "",
                              kafilPhone: "",
                              kafilAddress: "",
                            }));
                            setShowKafil(false);
                          }}
                        >
                          <SelectTrigger id="clientId">
                            <SelectValue placeholder="Ro'yxatdan mijozni tanlang..." />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.length > 0 ? (
                              clients.map((client) => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.fio} ({client.phone_number})
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-clients" disabled>
                                Mijozlar topilmadi
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Agar mijoz ro'yxatda bo'lmasa, "Yangi mijoz" yorlig'iga o'ting.
                        </p>
                      </div>
                    </TabsContent>
                    <TabsContent value="new">
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="name">
                              F.I.O. <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="name"
                              name="name"
                              placeholder="To'liq ism sharifi"
                              value={formData.name}
                              onChange={(e) => {
                                handleChange(e);
                                handleSelectChange("clientId", "");
                              }}
                              disabled={isAddingClient}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">
                              Telefon raqami <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="phone"
                              name="phone"
                              placeholder="+998 XX XXX XX XX"
                              value={formData.phone}
                              onChange={(e) => {
                                handleChange(e);
                                handleSelectChange("clientId", "");
                              }}
                              disabled={isAddingClient}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="address">Yashash manzili</Label>
                            <Input
                              id="address"
                              name="address"
                              placeholder="Viloyat, shahar, ko'cha, uy"
                              value={formData.address}
                              onChange={(e) => {
                                handleChange(e);
                                handleSelectChange("clientId", "");
                              }}
                              disabled={isAddingClient}
                            />
                          </div>
                        </div>
                        <div className="pt-4">
                          {!showKafil ? (
                            <Button
                              variant="outline"
                              type="button"
                              onClick={() => {
                                setShowKafil(true);
                                handleSelectChange("clientId", "");
                              }}
                              className="w-full"
                              disabled={isAddingClient}
                            >
                              <Plus className="mr-2 h-4 w-4" /> Kafil ma'lumotlarini qo'shish
                            </Button>
                          ) : (
                            <div className="space-y-4 rounded-md border p-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">Kafil ma'lumotlari</h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  onClick={() => {
                                    setShowKafil(false);
                                    setFormData((prev) => ({
                                      ...prev,
                                      kafilFio: "",
                                      kafilPhone: "",
                                      kafilAddress: "",
                                    }));
                                  }}
                                  className="text-xs text-red-600 hover:bg-red-50"
                                  disabled={isAddingClient}
                                >
                                  Olib tashlash
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                  <Label htmlFor="kafilFio">Kafil F.I.O.</Label>
                                  <Input
                                    id="kafilFio"
                                    name="kafilFio"
                                    placeholder="Kafilning to'liq ismi"
                                    value={formData.kafilFio}
                                    onChange={handleChange}
                                    disabled={isAddingClient}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="kafilPhone">Kafil telefon raqami</Label>
                                  <Input
                                    id="kafilPhone"
                                    name="kafilPhone"
                                    placeholder="+998 XX XXX XX XX"
                                    value={formData.kafilPhone}
                                    onChange={handleChange}
                                    disabled={isAddingClient}
                                  />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                  <Label htmlFor="kafilAddress">Kafil manzili</Label>
                                  <Input
                                    id="kafilAddress"
                                    name="kafilAddress"
                                    placeholder="Kafilning yashash manzili"
                                    value={formData.kafilAddress}
                                    onChange={handleChange}
                                    disabled={isAddingClient}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <Button type="button" onClick={handleAddClient} disabled={isAddingClient} className="w-full mt-4">
                          {isAddingClient ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                          Mijozni qo'shish
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-semibold">To'lov shartlari</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="paymentType">To'lov turi</Label>
                        <Select
                          value={paymentType}
                          onValueChange={(value) => {
                            setPaymentType(value);
                            const isNaqd = value === "naqd";
                            setFormData((prev) => ({
                              ...prev,
                              totalMonths: isNaqd ? "0" : prev.totalMonths === "0" ? "12" : prev.totalMonths,
                              initialPayment: isNaqd && apartment?.price
                                ? apartment.price.toString()
                                : apartment?.price && !isNaqd
                                ? Math.round(apartment.price * 0.3).toString()
                                : prev.initialPayment,
                            }));
                          }}
                        >
                          <SelectTrigger id="paymentType">
                            <SelectValue placeholder="To'lov turini tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="naqd">Naqd</SelectItem>
                            <SelectItem value="muddatli">Muddatli to'lov</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {paymentType === "muddatli" && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="initialPayment">
                            Boshlang'ich to'lov<span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="initialPayment"
                            name="initialPayment"
                            type="number"
                            min="0"
                            max={apartment?.price}
                            value={formData.initialPayment}
                            onChange={handleChange}
                            required
                          />
                          
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="totalMonths">
                            To'lov muddati (oy) <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.totalMonths}
                            onValueChange={(value) => handleSelectChange("totalMonths", value)}
                            required
                          >
                            <SelectTrigger id="totalMonths">
                              <SelectValue placeholder="Muddat" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">3 oy</SelectItem>
                              <SelectItem value="6">6 oy</SelectItem>
                              <SelectItem value="12">12 oy</SelectItem>
                              <SelectItem value="18">18 oy</SelectItem>
                              <SelectItem value="24">24 oy</SelectItem>
                              <SelectItem value="36">36 oy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                    {paymentType === "naqd" && (
                      <div className="space-y-2">
                        <Label htmlFor="initialPayment">
                          To'lanayotgan summa (Naqd) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="initialPayment"
                          name="initialPayment"
                          type="number"
                          value={formData.initialPayment}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="comments">Izohlar</Label>
                      <Textarea
                        id="comments"
                        name="comments"
                        placeholder="Shartnoma yoki to'lovga oid qo'shimcha izohlar..."
                        value={formData.comments}
                        onChange={handleChange}
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-3 border-t px-6 py-4">
                  <Button variant="outline" type="button" onClick={() => router.back()} disabled={submitting || isAddingClient}>
                    Bekor qilish
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      submitting ||
                      isAddingClient ||
                      loading ||
                      !apartment ||
                      !formData.clientId ||
                      (apartment.status !== "sotuvda" && apartment.status !== "bosh")
                    }
                  >
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {submitting ? "Band qilinmoqda..." : "Band qilish va Shartnoma"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {apartment && (
              <Card>
                <CardHeader>
                  <CardTitle>Xonadon haqida</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Obyekt:</span>
                    <span className="font-medium text-right">{apartment.object_name || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Xonadon №:</span>
                    <span className="font-medium">{apartment.room_number || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Qavat:</span>
                    <span className="font-medium">{apartment.floor || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Xonalar:</span>
                    <span className="font-medium">{apartment.rooms || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maydon:</span>
                    <span className="font-medium">{apartment.area || "-"} m²</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Narx:</span>
                    <span className="font-bold text-lg text-primary">
                      {Number(apartment.price).toLocaleString("us-US", { style: "currency", currency: "USD" })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Holati:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        apartment.status === "sotuvda" || apartment.status === "bosh"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {apartment.status === "sotuvda" || apartment.status === "bosh"
                        ? "Sotuvda"
                        : apartment.status === "band"
                        ? "Band"
                        : apartment.status === "sotilgan"
                        ? "Sotilgan"
                        : "Noma'lum"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
            {apartment && paymentType === "muddatli" && (
              <Card>
                <CardHeader>
                  <CardTitle>Taxminiy to'lov jadvali</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Umumiy narx:</span>
                    <span>{Number(apartment.price).toLocaleString("us-US", { style: "currency", currency: "USD" })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Boshlang'ich to'lov:</span>
                    <span>
                      {Number(formData.initialPayment || "0").toLocaleString("us-US", { style: "currency", currency: "USD" })}
                      ({apartment.price > 0 ? ((Number(formData.initialPayment || "0") / apartment.price) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Qolgan summa:</span>
                    <span>
                      {(apartment.price - Number(formData.initialPayment || "0")).toLocaleString("us-US", {
                        style: "currency",
                        currency: "USD",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Muddat:</span>
                    <span>{formData.totalMonths} oy</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="font-semibold">Oylik to'lov:</span>
                    <span className="font-bold text-lg text-primary">
                      {(() => {
                        try {
                          const monthly = calculateMonthlyPayment();
                          if (monthly > 0 || Number(formData.initialPayment) < apartment.price) {
                            return monthly.toLocaleString("us-US", {
                              style: "currency",
                              currency: "USD",
                              minimumFractionDigits: 2,
                            });
                          } else {
                            return "-";
                          }
                        } catch (e) {
                          return <span className="text-red-500 text-sm font-normal">Xato</span>;
                        }
                      })()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {isReceiptModalOpen && requestReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-3 pt-4 px-4">
              <CardTitle className="text-lg font-semibold">Shartnoma №{requestReceipt.id}</CardTitle>
              <Button onClick={() => setIsReceiptModalOpen(false)} variant="ghost" size="icon" className="h-7 w-7">
                <span className="sr-only">Yopish</span>X
              </Button>
            </CardHeader>
            <CardContent className="p-4 md:p-6 flex-grow overflow-y-auto">
              <p className="mb-4 text-sm text-muted-foreground">
                Xonadon muvaffaqiyatli band qilindi. Quyida dastlabki shartnoma bilan tanishing.
              </p>
              <div ref={receiptRef} className="p-4 bg-gray-50 rounded border border-gray-200">
                <pre className="whitespace-pre-wrap text-xs sm:text-sm font-serif leading-relaxed">
                  {requestReceipt.contractText}
                </pre>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2 justify-end border-t px-4 py-3">
              <Button
                onClick={() => handleDownloadContractWord(requestReceipt.id, requestReceipt.client)}
                variant="default"
                size="sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Word (.docx)
              </Button>
              <Button onClick={handlePrintContract} variant="secondary" size="sm">
                <Printer className="h-4 w-4 mr-2" /> Chop etish
              </Button>
              <Button
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  router.push(`/apartments/${apartment.id}`);
                }}
                variant="outline"
                size="sm"
              >
                Yopish
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}