// "use client";

// import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { MainNav } from "@/components/main-nav";
// import { Search } from "@/components/search";
// import { UserNav } from "@/components/user-nav";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { useParams, useRouter } from "next/navigation";
// import { Badge } from "@/components/ui/badge";
// import { Building, Home, User, FileText, CreditCard, Edit } from "lucide-react";
// import Link from "next/link";
// import { toast } from "@/hooks/use-toast";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";

// export default function ApartmentDetailPage() {
//   const params = useParams();
//   const router = useRouter();
//   const [apartment, setApartment] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [accessToken, setAccessToken] = useState<string | null>(null);
//   const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [paymentForm, setPaymentForm] = useState({
//     amount: "",
//     paymentDate: "",
//     paymentType: "naqd",
//     description: "",
//   });
//   const [editForm, setEditForm] = useState({
//     room_number: "",
//     floor: "",
//     rooms: "",
//     area: "",
//     price: "",
//     description: "",
//     status: "",
//   });

//   const API_BASE_URL = "http://api.ahlan.uz";

//   const getAuthHeaders = () => ({
//     Accept: "application/json",
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${accessToken}`,
//   });

//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       const token = localStorage.getItem("access_token");
//       setAccessToken(token);
//     }
//   }, []);

//   const fetchApartmentDetails = async () => {
//     if (!accessToken) {
//       toast({
//         title: "Xatolik",
//         description: "Tizimga kirish talab qilinadi",
//         variant: "destructive",
//       });
//       router.push("/login");
//       return;
//     }

//     setLoading(true);
//     try {
//       const apartmentId = params.id;

//       const apartmentResponse = await fetch(`${API_BASE_URL}/apartments/${apartmentId}/`, {
//         method: "GET",
//         headers: getAuthHeaders(),
//       });

//       if (!apartmentResponse.ok) {
//         if (apartmentResponse.status === 401) {
//           const confirmLogout = window.confirm("Sessiya tugagan. Qayta kirishni xohlaysizmi?");
//           if (confirmLogout) {
//             router.push("/login");
//           }
//           throw new Error("Sessiya tugagan, qayta kirish kerak");
//         }
//         throw new Error(`Xonadon ma'lumotlarini olishda xatolik: ${apartmentResponse.status}`);
//       }

//       const apartmentData = await apartmentResponse.json();

//       const paymentsResponse = await fetch(`${API_BASE_URL}/payments/?apartment=${apartmentId}`, {
//         method: "GET",
//         headers: getAuthHeaders(),
//       });

//       if (!paymentsResponse.ok) {
//         throw new Error("To'lovlarni olishda xatolik");
//       }

//       const paymentsData = await paymentsResponse.json();
//       const payments = paymentsData.results || [];

//       const documents = payments.length > 0 ? payments[0].documents || [] : [];

//       const clientResponse = await fetch(`${API_BASE_URL}/users/?apartment_id=${apartmentId}`, {
//         method: "GET",
//         headers: getAuthHeaders(),
//       });
//       const clientData = await clientResponse.json();
//       const client = clientData.results?.[0] || null;

//       setApartment({
//         ...apartmentData,
//         payments,
//         documents,
//         client,
//       });

//       setEditForm({
//         room_number: apartmentData.room_number || "",
//         floor: apartmentData.floor || "",
//         rooms: apartmentData.rooms || "",
//         area: apartmentData.area || "",
//         price: apartmentData.price || "",
//         description: apartmentData.description || "",
//         status: apartmentData.status || "",
//       });
//     } catch (error) {
//       toast({
//         title: "Xatolik",
//         description: (error as Error).message || "Ma'lumotlarni olishda xatolik yuz berdi",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (accessToken === null) return;
//     fetchApartmentDetails();
//   }, [accessToken, params.id]);

//   const handleOpenPaymentModal = () => setIsPaymentModalOpen(true);
//   const handleClosePaymentModal = () => {
//     setIsPaymentModalOpen(false);
//     setPaymentForm({ amount: "", paymentDate: "", paymentType: "naqd", description: "" });
//   };

//   const handleOpenEditModal = () => setIsEditModalOpen(true);
//   const handleCloseEditModal = () => setIsEditModalOpen(false);

//   const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setPaymentForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const handlePaymentTypeChange = (value: string) => {
//     setPaymentForm((prev) => ({ ...prev, paymentType: value }));
//   };

//   const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setEditForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleEditStatusChange = (value: string) => {
//     setEditForm((prev) => ({ ...prev, status: value }));
//   };

//   const handleAddPayment = async () => {
//     if (!accessToken) return;

//     const paymentData = {
//       amount: Number(paymentForm.amount),
//       payment_date: paymentForm.paymentDate,
//       payment_type: paymentForm.paymentType,
//       description: paymentForm.description,
//       apartment: Number(params.id),
//     };

//     try {
//       const response = await fetch(`${API_BASE_URL}/users/1/add_balance/`, {
//         method: "POST",
//         headers: getAuthHeaders(),
//         body: JSON.stringify(paymentData),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "To‘lov qo‘shishda xatolik");
//       }

//       toast({
//         title: "Muvaffaqiyat",
//         description: "To‘lov muvaffaqiyatli qo‘shildi",
//       });
//       handleClosePaymentModal();
//       fetchApartmentDetails();
//     } catch (error) {
//       toast({
//         title: "Xatolik",
//         description: (error as Error).message || "To‘lov qo‘shishda xatolik yuz berdi",
//         variant: "destructive",
//       });
//     }
//   };

//   const handleUpdateApartment = async () => {
//     if (!accessToken) return;

//     const apartmentData = {
//       room_number: editForm.room_number,
//       floor: Number(editForm.floor),
//       rooms: Number(editForm.rooms),
//       area: Number(editForm.area),
//       price: Number(editForm.price),
//       description: editForm.description,
//       status: editForm.status,
//       object: apartment.object,
//     };

//     try {
//       const response = await fetch(`${API_BASE_URL}/apartments/${params.id}/`, {
//         method: "PUT",
//         headers: getAuthHeaders(),
//         body: JSON.stringify(apartmentData),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Xonadonni yangilashda xatolik");
//       }

//       toast({
//         title: "Muvaffaqiyat",
//         description: "Xonadon muvaffaqiyatli yangilandi",
//       });
//       handleCloseEditModal();
//       fetchApartmentDetails();
//     } catch (error) {
//       toast({
//         title: "Xatolik",
//         description: (error as Error).message || "Xonadonni yangilashda xatolik yuz berdi",
//         variant: "destructive",
//       });
//     }
//   };

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case "bosh":
//         return <Badge className="bg-blue-500">Bo‘sh</Badge>;
//       case "band":
//         return <Badge className="bg-yellow-500">Band</Badge>;
//       case "sold":
//         return <Badge className="bg-green-500">Sotilgan</Badge>;
//       default:
//         return <Badge className="bg-gray-500">{status}</Badge>;
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex min-h-screen flex-col">
//         <div className="border-b">
//           <div className="flex h-16 items-center px-4">
//             <MainNav className="mx-6" />
//             <div className="ml-auto flex items-center space-x-4">
//               <Search />
//               <UserNav />
//             </div>
//           </div>
//         </div>
//         <div className="flex-1 space-y-4 p-8 pt-6">
//           <div className="flex items-center justify-center h-[80vh]">
//             <p className="text-muted-foreground">Ma'lumotlar yuklanmoqda...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!apartment) {
//     return (
//       <div className="flex min-h-screen flex-col">
//         <div className="border-b">
//           <div className="flex h-16 items-center px-4">
//             <MainNav className="mx-6" />
//             <div className="ml-auto flex items-center space-x-4">
//               <Search />
//               <UserNav />
//             </div>
//           </div>
//         </div>
//         <div className="flex-1 space-y-4 p-8 pt-6">
//           <p className="text-muted-foreground">Xonadon topilmadi</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex min-h-screen flex-col">
//       <div className="border-b">
//         <div className="flex h-16 items-center px-4">
//           <MainNav className="mx-6" />
//           <div className="ml-auto flex items-center space-x-4">
//             <Search />
//             <UserNav />
//           </div>
//         </div>
//       </div>
//       <div className="flex-1 space-y-4 p-8 pt-6">
//         <div className="flex items-center justify-between space-y-2">
//           <div>
//             <h2 className="text-3xl font-bold tracking-tight">Xonadon № {apartment.room_number}</h2>
//             <p className="text-muted-foreground">{apartment.object_name}</p>
//           </div>
//           <div className="flex space-x-2">
//             <Button variant="outline" onClick={() => router.push("/apartments")}>
//               <Home className="mr-2 h-4 w-4" />
//               Barcha xonadonlar
//             </Button>
//             <Link href={`/properties/${apartment.object}`}>
//               <Button variant="outline">
//                 <Building className="mr-2 h-4 w-4" />
//                 Obyekt sahifasi
//               </Button>
//             </Link>
//             {apartment.status === "bosh" && (
//               <Button onClick={() => router.push(`/apartments/${apartment.id}/reserve`)}>
//                 <User className="mr-2 h-4 w-4" />
//                 Band qilish
//               </Button>
//             )}
//             <Button variant="outline" onClick={handleOpenEditModal}>
//               <Edit className="mr-2 h-4 w-4" />
//               Tahrirlash
//             </Button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div className="md:col-span-2">
//             <Card>
//               <CardContent className="p-0">
//                 <div className="relative h-[300px]">
//                   <img
//                     src={apartment.object?.image || "/placeholder.svg?height=300&width=500"}
//                     alt={`Xonadon № ${apartment.room_number}`}
//                     className="w-full h-full object-cover"
//                   />
//                   <div className="absolute top-4 right-4">{getStatusBadge(apartment.status)}</div>
//                 </div>
//                 <div className="p-6">
//                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
//                     <div className="flex flex-col">
//                       <span className="text-sm text-muted-foreground">Qavat</span>
//                       <span className="text-lg font-medium">{apartment.floor}-qavat</span>
//                     </div>
//                     <div className="flex flex-col">
//                       <span className="text-sm text-muted-foreground">Xonalar</span>
//                       <span className="text-lg font-medium">{apartment.rooms} xona</span>
//                     </div>
//                     <div className="flex flex-col">
//                       <span className="text-sm text-muted-foreground">Maydon</span>
//                       <span className="text-lg font-medium">{apartment.area} m²</span>
//                     </div>
//                     <div className="flex flex-col">
//                       <span className="text-sm text-muted-foreground">Narx</span>
//                       <span className="text-lg font-medium">
//                         {Number(apartment.price).toLocaleString("uz-UZ", { style: "currency", currency: "UZS" })}
//                       </span>
//                     </div>
//                   </div>

//                   <h3 className="text-lg font-bold mb-2">Tavsif</h3>
//                   <p className="text-muted-foreground mb-4">{apartment.description || "Tavsif mavjud emas"}</p>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           <div>
//             <Card className="mb-4">
//               <CardHeader>
//                 <CardTitle>Xonadon holati</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-4">
//                   <div className="flex justify-between items-center">
//                     <span className="text-muted-foreground">Holati:</span>
//                     <span>{getStatusBadge(apartment.status)}</span>
//                   </div>

//                   {apartment.status !== "bosh" && apartment.client && (
//                     <>
//                       <div className="flex justify-between items-center">
//                         <span className="text-muted-foreground">Mijoz:</span>
//                         <span>{apartment.client.fio || "Noma'lum"}</span>
//                       </div>
//                       <div className="flex justify-between items-center">
//                         <span className="text-muted-foreground">Telefon:</span>
//                         <span>{apartment.client.phone_number || "Mavjud emas"}</span>
//                       </div>
//                     </>
//                   )}

//                   {apartment.status === "band" && apartment.payments.length > 0 && (
//                     <div className="flex justify-between items-center">
//                       <span className="text-muted-foreground">Band qilingan sana:</span>
//                       <span>{new Date(apartment.payments[0].created_at).toLocaleDateString()}</span>
//                     </div>
//                   )}

//                   {apartment.status === "sold" && apartment.payments.length > 0 && (
//                     <div className="flex justify-between items-center">
//                       <span className="text-muted-foreground">Sotilgan sana:</span>
//                       <span>{new Date(apartment.payments[0].created_at).toLocaleDateString()}</span>
//                     </div>
//                   )}

//                   {apartment.status === "bosh" && (
//                     <Button className="w-full" onClick={() => router.push(`/apartments/${apartment.id}/reserve`)}>
//                       <User className="mr-2 h-4 w-4" />
//                       Band qilish
//                     </Button>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>

//             {apartment.status !== "bosh" && (
//               <Card>
//                 <CardHeader>
//                   <CardTitle>To‘lovlar</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="space-y-4">
//                     {apartment.payments.map((payment: any) => (
//                       <div key={payment.id} className="flex justify-between items-center">
//                         <div>
//                           <div className="font-medium">
//                             {payment.payment_type === "naqd"
//                               ? "Naqd to‘lov"
//                               : payment.payment_type === "muddatli"
//                                 ? "Muddatli to‘lov"
//                                 : "Ipoteka"}
//                           </div>
//                           <div className="text-sm text-muted-foreground">
//                             {new Date(payment.created_at).toLocaleDateString()}
//                           </div>
//                         </div>
//                         <div className="text-right">
//                           <div className="font-medium">
//                             {Number(payment.monthly_payment || payment.total_amount).toLocaleString("uz-UZ", {
//                               style: "currency",
//                               currency: "UZS",
//                             })}
//                           </div>
//                           <div>
//                             {payment.status === "paid" ? (
//                               <Badge className="bg-green-500">To‘langan</Badge>
//                             ) : payment.status === "pending" ? (
//                               <Badge variant="outline" className="text-yellow-500 border-yellow-500">
//                                 Kutilmoqda
//                               </Badge>
//                             ) : (
//                               <Badge variant="outline" className="text-red-500 border-red-500">
//                                 Muddati o‘tgan
//                               </Badge>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     ))}

//                     <Button className="w-full" onClick={handleOpenPaymentModal}>
//                       <CreditCard className="mr-2 h-4 w-4" />
//                       To‘lov qo‘shish
//                     </Button>
//                   </div>
//                 </CardContent>
//               </Card>
//             )}
//           </div>
//         </div>

//         {apartment.status !== "bosh" && (
//           <Tabs defaultValue="documents" className="space-y-4">
//             <TabsList>
//               <TabsTrigger value="documents">Hujjatlar</TabsTrigger>
//               <TabsTrigger value="payments">To‘lovlar jadvali</TabsTrigger>
//               <TabsTrigger value="history">Tarix</TabsTrigger>
//             </TabsList>
//             <TabsContent value="documents" className="space-y-4">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Hujjatlar</CardTitle>
//                   <CardDescription>Xonadon bilan bog‘liq barcha hujjatlar</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="space-y-4">
//                     {apartment.documents.length > 0 ? (
//                       apartment.documents.map((document: any) => (
//                         <div key={document.id} className="flex justify-between items-center p-3 border rounded-md">
//                           <div className="flex items-center">
//                             <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
//                             <div>
//                               <div className="font-medium">Shartnoma</div>
//                               <div className="text-sm text-muted-foreground">
//                                 {new Date(document.created_at).toLocaleDateString()}
//                               </div>
//                             </div>
//                           </div>
//                           <Button variant="outline" size="sm" asChild>
//                             <a href={`${API_BASE_URL}/media/${document.pdf_file}`} target="_blank" rel="noopener noreferrer">
//                               Yuklab olish
//                             </a>
//                           </Button>
//                         </div>
//                       ))
//                     ) : (
//                       <p className="text-muted-foreground">Hujjatlar mavjud emas</p>
//                     )}

//                     <Button>
//                       <FileText className="mr-2 h-4 w-4" />
//                       Yangi hujjat qo‘shish
//                     </Button>
//                   </div>
//                 </CardContent>
//               </Card>
//             </TabsContent>
//             <TabsContent value="payments" className="space-y-4">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>To‘lovlar jadvali</CardTitle>
//                   <CardDescription>Xonadon uchun to‘lovlar jadvali</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="space-y-4">
//                     {apartment.payments.length > 0 ? (
//                       apartment.payments.map((payment: any) => (
//                         <div key={payment.id} className="flex justify-between items-center p-3 border rounded-md">
//                           <div>
//                             <div className="font-medium">{payment.payment_type}</div>
//                             <div className="text-sm text-muted-foreground">
//                               Har oy {payment.due_date ? payment.due_date : "-"}-kuni
//                             </div>
//                           </div>
//                           <div className="text-right">
//                             <div className="font-medium">
//                               {Number(payment.monthly_payment || 0).toLocaleString("uz-UZ", {
//                                 style: "currency",
//                                 currency: "UZS",
//                               })}
//                             </div>
//                             <div className="text-sm text-muted-foreground">
//                               Umumiy: {Number(payment.total_amount).toLocaleString("uz-UZ", {
//                                 style: "currency",
//                                 currency: "UZS",
//                               })}
//                             </div>
//                           </div>
//                         </div>
//                       ))
//                     ) : (
//                       <p className="text-muted-foreground">To‘lovlar jadvali mavjud emas</p>
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>
//             </TabsContent>
//             <TabsContent value="history" className="space-y-4">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Tarix</CardTitle>
//                   <CardDescription>Xonadon bilan bog‘liq barcha o‘zgarishlar tarixi</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="h-[400px] flex items-center justify-center border rounded">
//                     <p className="text-muted-foreground">Tarix ma'lumotlari hozircha mavjud emas</p>
//                   </div>
//                 </CardContent>
//               </Card>
//             </TabsContent>
//           </Tabs>
//         )}
//       </div>

//       {/* To‘lov qo‘shish uchun modal */}
//       <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Yangi to‘lov qo‘shish</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="amount">Summa (so‘m)</Label>
//               <Input
//                 id="amount"
//                 name="amount"
//                 type="number"
//                 value={paymentForm.amount}
//                 onChange={handlePaymentChange}
//                 placeholder="Summani kiriting"
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="paymentDate">To‘lov sanasi</Label>
//               <Input
//                 id="paymentDate"
//                 name="paymentDate"
//                 type="date"
//                 value={paymentForm.paymentDate}
//                 onChange={handlePaymentChange}
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="paymentType">To‘lov turi</Label>
//               <Select value={paymentForm.paymentType} onValueChange={handlePaymentTypeChange}>
//                 <SelectTrigger id="paymentType">
//                   <SelectValue placeholder="To‘lov turini tanlang" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="naqd">Naqd pul</SelectItem>
//                   <SelectItem value="muddatli">Muddatli to‘lov</SelectItem>
//                   <SelectItem value="ipoteka">Ipoteka</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="description">Tavsif</Label>
//               <Textarea
//                 id="description"
//                 name="description"
//                 value={paymentForm.description}
//                 onChange={handlePaymentChange}
//                 placeholder="To‘lov haqida qo‘shimcha ma'lumot"
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={handleClosePaymentModal}>
//               Bekor qilish
//             </Button>
//             <Button onClick={handleAddPayment}>Saqlash</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Xonadonni tahrirlash uchun modal */}
//       <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Xonadonni tahrirlash</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="room_number">Xonadon raqami</Label>
//               <Input
//                 id="room_number"
//                 name="room_number"
//                 value={editForm.room_number}
//                 onChange={handleEditChange}
//                 placeholder="Xonadon raqamini kiriting"
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="floor">Qavat</Label>
//               <Input
//                 id="floor"
//                 name="floor"
//                 type="number"
//                 value={editForm.floor}
//                 onChange={handleEditChange}
//                 placeholder="Qavatni kiriting"
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="rooms">Xonalar soni</Label>
//               <Input
//                 id="rooms"
//                 name="rooms"
//                 type="number"
//                 value={editForm.rooms}
//                 onChange={handleEditChange}
//                 placeholder="Xonalar sonini kiriting"
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="area">Maydon (m²)</Label>
//               <Input
//                 id="area"
//                 name="area"
//                 type="number"
//                 value={editForm.area}
//                 onChange={handleEditChange}
//                 placeholder="Maydonni kiriting"
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="price">Narx (so‘m)</Label>
//               <Input
//                 id="price"
//                 name="price"
//                 type="number"
//                 value={editForm.price}
//                 onChange={handleEditChange}
//                 placeholder="Narxni kiriting"
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="description">Tavsif</Label>
//               <Textarea
//                 id="description"
//                 name="description"
//                 value={editForm.description}
//                 onChange={handleEditChange}
//                 placeholder="Tavsifni kiriting"
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="status">Holati</Label>
//               <Select value={editForm.status} onValueChange={handleEditStatusChange}>
//                 <SelectTrigger id="status">
//                   <SelectValue placeholder="Holati tanlang" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="bosh">Bo‘sh</SelectItem>
//                   <SelectItem value="band">Band</SelectItem>
//                   <SelectItem value="sold">Sotilgan</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={handleCloseEditModal}>
//               Bekor qilish
//             </Button>
//             <Button onClick={handleUpdateApartment}>Saqlash</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }



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
import { Building, Home, User, FileText, CreditCard, Edit, CalendarIcon, InfoIcon } from "lucide-react"; // Ikonkalarni qo'shish
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Popover uchun
import { Calendar } from "@/components/ui/calendar"; // Calendar uchun
import { format } from "date-fns"; // Sana formatlash uchun
import { cn } from "@/lib/utils"; // cn utiliti

export default function ApartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [apartment, setApartment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false); // To'lov saqlash uchun loading
  const [editLoading, setEditLoading] = useState(false); // Tahrirlash saqlash uchun loading
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date()); // Calendar uchun state

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    // paymentDate endi selectedDate orqali boshqariladi
    paymentType: "naqd", // Default qiymat
    description: "",
  });

  const [editForm, setEditForm] = useState({
    room_number: "",
    floor: "",
    rooms: "",
    area: "",
    price: "",
    description: "",
    status: "",
  });

  const API_BASE_URL = "http://api.ahlan.uz";

  const getAuthHeaders = () => ({
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (!token) {
          router.push("/login"); // Agar token yo'q bo'lsa login sahifasiga
      } else {
           setAccessToken(token);
      }
    }
  }, [router]); // router dependency qo'shildi

  const fetchApartmentDetails = async () => {
    if (!accessToken) {
      // Token yo'q bo'lsa yoki useEffect hali ishga tushmagan bo'lsa
      return;
    }

    setLoading(true);
    try {
      const apartmentId = params.id;
      const apartmentResponse = await fetch(`${API_BASE_URL}/apartments/${apartmentId}/`, {
        method: "GET",
        headers: getAuthHeaders(),
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
        throw new Error(`Xonadon ma'lumotlarini olishda xatolik: ${apartmentResponse.status}`);
      }
      const apartmentData = await apartmentResponse.json();

      let payments = [];
      let documents = [];
      let client = null;
      let userPayments = []; // Haqiqiy to'lovlarni saqlash uchun

      if (apartmentData.status === 'band' || apartmentData.status === 'sold') {
          const paymentsResponse = await fetch(`${API_BASE_URL}/payments/?apartment=${apartmentId}`, {
            method: "GET",
            headers: getAuthHeaders(),
          });
           if (paymentsResponse.ok) {
              const paymentsData = await paymentsResponse.json();
              payments = paymentsData.results || [];
              if (payments.length > 0) {
                  const mainPaymentId = payments[0].id;
                  // Hujjatlarni olish
                  const docsResponse = await fetch(`${API_BASE_URL}/documents/?payment=${mainPaymentId}`, {
                        method: "GET", headers: getAuthHeaders(),
                  });
                  if (docsResponse.ok) documents = (await docsResponse.json()).results || [];

                  // Mijozni olish (to'lov orqali)
                  if (payments[0].user) {
                       const clientResponse = await fetch(`${API_BASE_URL}/users/${payments[0].user}/`, {
                           method: "GET", headers: getAuthHeaders(),
                       });
                       if(clientResponse.ok) client = await clientResponse.json();
                  }

                  // Haqiqiy user to'lovlarini olish
                  const userPaymentsResponse = await fetch(`${API_BASE_URL}/user-payments/?payment=${mainPaymentId}`, {
                      method: "GET", headers: getAuthHeaders(),
                  });
                  if (userPaymentsResponse.ok) userPayments = (await userPaymentsResponse.json()).results || [];

              }
          } else if (paymentsResponse.status !== 404) {
               console.error("Asosiy to'lovlarni olishda xatolik:", paymentsResponse.status);
          }
          // Agar to'lov orqali mijoz olinmagan bo'lsa (eski usul)
          if (!client) {
              const clientResponseAlt = await fetch(`${API_BASE_URL}/users/?apartment_id=${apartmentId}`, {
                  method: "GET", headers: getAuthHeaders(),
              });
               if (clientResponseAlt.ok) {
                   client = (await clientResponseAlt.json()).results?.[0] || null;
               }
          }
      }

      setApartment({
        ...apartmentData,
        payments, // Asosiy shartnoma(lar)
        documents,
        client,
        userPayments, // Haqiqiy to'lovlar tarixi
      });

      setEditForm({
        room_number: apartmentData.room_number || "", floor: apartmentData.floor || "",
        rooms: apartmentData.rooms || "", area: apartmentData.area || "", price: apartmentData.price || "",
        description: apartmentData.description || "", status: apartmentData.status || "",
      });

    } catch (error) {
      console.error("Ma'lumotlarni olish xatosi:", error);
      toast({
        title: "Xatolik",
        description: (error as Error).message || "Ma'lumotlarni olishda noma'lum xatolik.",
        variant: "destructive",
      });
       setApartment(null); // Xatolik bo'lsa null qilish
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) { // Faqat token mavjud bo'lganda fetch qilish
        fetchApartmentDetails();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, params.id]);

  const handleOpenPaymentModal = () => {
      setSelectedDate(new Date()); // Modal ochilganda sanani tiklash
      setIsPaymentModalOpen(true);
  };
  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setPaymentForm({ amount: "", paymentType: "naqd", description: "" }); // Sanani olib tashladik
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

 const handleAddPayment = async () => {
    setPaymentLoading(true); // Loadingni boshlash
    if (!accessToken || !apartment || !apartment.payments || apartment.payments.length === 0) {
        toast({ title: "Xatolik", description: "To'lov qo'shish uchun yetarli ma'lumot mavjud emas.", variant: "destructive" });
        setPaymentLoading(false); return;
    }
    const mainPaymentId = apartment.payments[0].id;
    const clientId = apartment.client?.id;

    if (!mainPaymentId) {
         toast({ title: "Xatolik", description: "Asosiy to'lov IDsi topilmadi.", variant: "destructive" });
         setPaymentLoading(false); return;
    }
     if (!clientId) {
         toast({ title: "Xatolik", description: "Mijoz IDsi topilmadi.", variant: "destructive" });
         setPaymentLoading(false); return;
    }
    if (!selectedDate) {
         toast({ title: "Xatolik", description: "To'lov sanasi tanlanishi kerak.", variant: "destructive" });
         setPaymentLoading(false); return;
    }

    const newUserPaymentData = {
      amount: Number(paymentForm.amount),
      payment_date: format(selectedDate, "yyyy-MM-dd"), // Formatlangan sana
      payment_type: paymentForm.paymentType,
      description: paymentForm.description,
      payment: mainPaymentId,
      user: clientId,
    };

    if (!newUserPaymentData.amount || newUserPaymentData.amount <= 0) {
        toast({ title: "Xatolik", description: "Summa musbat bo'lishi kerak.", variant: "destructive" });
        setPaymentLoading(false); return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/user-payments/`, {
        method: "POST", headers: getAuthHeaders(), body: JSON.stringify(newUserPaymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("To'lov qo'shish xatosi:", errorData);
        let errorMessage = "To‘lov qo‘shishda xatolik";
        if (errorData && typeof errorData === 'object') {
             if (errorData.detail) errorMessage = errorData.detail;
             else { /* ... (batafsil xato xabari logikasi) ... */
                 const firstErrorKey = Object.keys(errorData)[0];
                 if (firstErrorKey) errorMessage = `${firstErrorKey}: ${JSON.stringify(errorData[firstErrorKey])}`;
                 else errorMessage = JSON.stringify(errorData);
             }
        }
        throw new Error(errorMessage);
      }

      toast({ title: "Muvaffaqiyat", description: "To‘lov muvaffaqiyatli qo‘shildi" });
      handleClosePaymentModal();
      fetchApartmentDetails(); // Ma'lumotlarni yangilash
    } catch (error) {
       console.error("To'lov qo'shishda yakuniy xatolik:", error);
       toast({ title: "Xatolik", description: (error as Error).message || "To‘lov qo‘shishda xatolik.", variant: "destructive" });
    } finally {
        setPaymentLoading(false); // Loadingni tugatish
    }
  };


  const handleUpdateApartment = async () => {
    setEditLoading(true); // Loadingni boshlash
    if (!accessToken || !apartment || !apartment.object?.id) { // Obyekt IDsi mavjudligini tekshirish
        toast({ title: "Xatolik", description: "Xonadon ma'lumotlari yoki obyekt IDsi topilmadi.", variant: "destructive" });
         setEditLoading(false); return;
    }

    const apartmentData = {
      room_number: editForm.room_number, floor: Number(editForm.floor), rooms: Number(editForm.rooms),
      area: Number(editForm.area), price: Number(editForm.price), description: editForm.description,
      status: editForm.status, object: apartment.object.id,
    };

     if (!apartmentData.room_number || !apartmentData.floor || !apartmentData.rooms || !apartmentData.area || !apartmentData.price || !apartmentData.status || !apartmentData.object) {
         toast({ title: "Xatolik", description: "Barcha majburiy maydonlar to'ldirilishi kerak.", variant: "destructive" });
          setEditLoading(false); return;
     }

    try {
      const response = await fetch(`${API_BASE_URL}/apartments/${params.id}/`, {
        method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(apartmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Xonadonni yangilash xatosi:", errorData);
         let errorMessage = "Xonadonni yangilashda xatolik";
          if (errorData && typeof errorData === 'object') { /* ... (batafsil xato xabari logikasi) ... */
             if (errorData.detail) errorMessage = errorData.detail;
             else {
                const firstErrorKey = Object.keys(errorData)[0];
                 if (firstErrorKey) errorMessage = `${firstErrorKey}: ${JSON.stringify(errorData[firstErrorKey])}`;
                 else errorMessage = JSON.stringify(errorData);
             }
         }
        throw new Error(errorMessage);
      }

      toast({ title: "Muvaffaqiyat", description: "Xonadon muvaffaqiyatli yangilandi" });
      handleCloseEditModal();
      fetchApartmentDetails();
    } catch (error) {
       console.error("Xonadonni yangilashda yakuniy xatolik:", error);
       toast({ title: "Xatolik", description: (error as Error).message || "Xonadonni yangilashda xatolik.", variant: "destructive" });
    } finally {
        setEditLoading(false); // Loadingni tugatish
    }
  };

  // --- Helper funksiyalar ---
  const getStatusBadge = (status: string) => { /* ... (avvalgi kod) ... */
     switch (status) {
      case "bosh": return <Badge className="bg-blue-500 hover:bg-blue-600">Bo‘sh</Badge>;
      case "band": return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Band</Badge>;
      case "sold": return <Badge className="bg-green-500 hover:bg-green-600">Sotilgan</Badge>;
      default: return <Badge className="bg-gray-500 hover:bg-gray-600">{status || "Noma'lum"}</Badge>;
    }
  };
   const getPaymentStatusBadge = (status: string) => { /* ... (avvalgi kod) ... */
      switch (status?.toLowerCase()) {
       case "paid": return <Badge className="bg-green-500 hover:bg-green-600">To‘langan</Badge>;
       case "pending": return <Badge variant="outline" className="text-yellow-600 border-yellow-500">Kutilmoqda</Badge>;
       case "overdue": return <Badge variant="destructive">Muddati o‘tgan</Badge>;
       default: return <Badge variant="secondary">{status || "Noma'lum"}</Badge>;
     }
   };
  const formatCurrency = (amount: number | string | null | undefined) => {
      return Number(amount || 0).toLocaleString("uz-UZ", { style: "currency", currency: "UZS" });
  }
  const formatDate = (dateString: string | null | undefined) => {
      if (!dateString) return "-";
      try {
          return new Date(dateString).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric' });
      } catch (e) {
          return "-";
      }
  }

  // ------ Render ------

  if (loading && !apartment) { // Faqat boshlang'ich yuklanishda ko'rsatish
    return ( /* ... (Loading UI) ... */
         <div className="flex min-h-screen flex-col">
            <div className="border-b"><div className="flex h-16 items-center px-4"><MainNav className="mx-6" /><div className="ml-auto flex items-center space-x-4"><Search /><UserNav /></div></div></div>
            <div className="flex-1 space-y-4 p-8 pt-6"><div className="flex items-center justify-center h-[80vh]"><p className="text-muted-foreground">Ma'lumotlar yuklanmoqda...</p></div></div>
         </div>
    );
  }

  if (!apartment) { // Yuklanish tugagach ham apartment yo'q bo'lsa
    return ( /* ... (Not Found UI) ... */
         <div className="flex min-h-screen flex-col">
            <div className="border-b"><div className="flex h-16 items-center px-4"><MainNav className="mx-6" /><div className="ml-auto flex items-center space-x-4"><Search /><UserNav /></div></div></div>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight text-red-600">Xonadon topilmadi</h2>
                    <Button variant="outline" onClick={() => router.push("/apartments")}><Home className="mr-2 h-4 w-4" /> Barcha xonadonlar</Button>
                </div>
                <p className="text-muted-foreground">Bu ID ({params.id}) ga ega xonadon mavjud emas yoki o'chirilgan.</p>
            </div>
         </div>
    );
  }

  // --- Asosiy JSX ---
  const mainPayment = apartment.payments?.[0];
  const userPayments = apartment.userPayments || []; // Fetch qilingan userPayments

  return (
    <div className="flex min-h-screen flex-col">
       {/* --- Header --- */}
      <div className="border-b sticky top-0 bg-background z-10">
        <div className="flex h-16 items-center px-4">
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4">
            <Search />
            <UserNav />
          </div>
        </div>
      </div>

       {/* --- Content --- */}
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
         {/* --- Page Header --- */}
        <div className="flex items-center justify-between space-y-2 flex-wrap">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Xonadon № {apartment.room_number}</h2>
            <p className="text-muted-foreground">{apartment.object?.name || "Noma'lum obyekt"}</p>
          </div>
          <div className="flex space-x-2 flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/apartments")}>
              <Home className="mr-2 h-4 w-4" /> Barcha xonadonlar
            </Button>
            {apartment.object?.id && (
              <Link href={`/properties/${apartment.object.id}`}>
                <Button variant="outline" size="sm"><Building className="mr-2 h-4 w-4" /> Obyekt</Button>
              </Link>
            )}
            {apartment.status === "bosh" && (
              <Button size="sm" onClick={() => router.push(`/apartments/${apartment.id}/reserve`)}>
                <User className="mr-2 h-4 w-4" /> Band qilish
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleOpenEditModal}>
              <Edit className="mr-2 h-4 w-4" /> Tahrirlash
            </Button>
          </div>
        </div>

         {/* --- Main Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* --- Left Column (Apartment Details) --- */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="relative h-[250px] md:h-[350px] bg-gray-200">
                  <img
                    src={apartment.object?.image || "/placeholder.svg?h=350&w=600"}
                    alt={`Xonadon ${apartment.room_number}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = "/placeholder.svg?h=350&w=600"; e.currentTarget.onerror = null; }}
                  />
                  <div className="absolute top-4 right-4">{getStatusBadge(apartment.status)}</div>
                </div>
                <div className="p-4 md:p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 border-b pb-4">
                     {/* ... (Qavat, Xonalar, Maydon, Narx - avvalgi kod) ... */}
                     <div className="flex flex-col"><span className="text-xs text-muted-foreground">Qavat</span><span className="text-base font-medium">{apartment.floor || "-"}</span></div>
                     <div className="flex flex-col"><span className="text-xs text-muted-foreground">Xonalar</span><span className="text-base font-medium">{apartment.rooms || "-"} xona</span></div>
                     <div className="flex flex-col"><span className="text-xs text-muted-foreground">Maydon</span><span className="text-base font-medium">{apartment.area || "-"} m²</span></div>
                     <div className="flex flex-col"><span className="text-xs text-muted-foreground">Narx</span><span className="text-base font-medium text-green-600">{formatCurrency(apartment.price)}</span></div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Tavsif</h3>
                  <p className="text-sm text-muted-foreground">
                    {apartment.description || <span className="italic">Tavsif mavjud emas</span>}
                   </p>
                </div>
              </CardContent>
            </Card>
          </div>

           {/* --- Right Column (Status & Actions) --- */}
          <div>
            <Card className="mb-6 sticky top-20"> {/* Sticky bo'lishi mumkin */}
              <CardHeader>
                <CardTitle className="text-lg">Umumiy ma'lumot</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center"><span className="text-muted-foreground">Holati:</span><span>{getStatusBadge(apartment.status)}</span></div>
                  {/* --- Mijoz info --- */}
                  {(apartment.status === "band" || apartment.status === "sold") && (
                    <> {apartment.client ? ( <>
                        <div className="border-t pt-3 flex justify-between items-center"><span className="text-muted-foreground">Mijoz:</span><span className="font-medium text-right">{apartment.client.fio || "Noma'lum"}</span></div>
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Telefon:</span><span className="text-right">{apartment.client.phone_number || "-"}</span></div>
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Passport:</span><span className="text-right">{apartment.client.passport || "-"}</span></div>
                    </>) : (<p className="text-xs text-muted-foreground italic border-t pt-3">Mijoz ma'lumotlari topilmadi.</p>)} </>
                  )}
                  {/* --- Asosiy to'lov info --- */}
                  {mainPayment && ( <>
                     <div className="border-t pt-3 space-y-3">
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">To'lov turi:</span><span className="capitalize">{mainPayment.payment_type || "-"}</span></div>
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Shartnoma sanasi:</span><span>{formatDate(mainPayment.created_at)}</span></div>
                        {(mainPayment.payment_type === 'muddatli' || mainPayment.payment_type === 'ipoteka') && (<>
                            <div className="flex justify-between items-center"><span className="text-muted-foreground">Boshlang'ich:</span><span className="font-medium">{formatCurrency(mainPayment.initial_payment)}</span></div>
                            <div className="flex justify-between items-center"><span className="text-muted-foreground">Oylik:</span><span className="font-medium">{formatCurrency(mainPayment.monthly_payment)}</span></div>
                            <div className="flex justify-between items-center"><span className="text-muted-foreground">Muddat / Foiz:</span><span>{mainPayment.duration_months || "-"} oy / {mainPayment.interest_rate || 0}%</span></div>
                        </>)}
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Jami to'langan:</span><span className="font-semibold text-green-700">{formatCurrency(mainPayment.paid_amount)}</span></div>
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Qoldiq:</span><span className="font-semibold text-red-700">{formatCurrency(mainPayment.total_amount - (mainPayment.paid_amount || 0))}</span></div>
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Shartnoma status:</span><span>{getPaymentStatusBadge(mainPayment.status)}</span></div>
                     </div> </>
                  )}
                  {/* --- Actions --- */}
                  {apartment.status === "bosh" && (<Button size="sm" className="w-full mt-4" onClick={() => router.push(`/apartments/${apartment.id}/reserve`)}><User className="mr-2 h-4 w-4" /> Band qilish</Button>)}
                  {(apartment.status === "band" || apartment.status === "sold") && mainPayment && (<Button size="sm" className="w-full mt-4" onClick={handleOpenPaymentModal}><CreditCard className="mr-2 h-4 w-4" /> To‘lov qo‘shish</Button>)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* --- Tabs --- */}
        {(apartment.status === "band" || apartment.status === "sold") && (
          <Tabs defaultValue="payments_history" className="mt-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3"> {/* Responsive */}
              <TabsTrigger value="payments_history">To‘lovlar tarixi</TabsTrigger>
              <TabsTrigger value="documents">Hujjatlar</TabsTrigger>
              <TabsTrigger value="payment_schedule">To‘lov jadvali</TabsTrigger>
            </TabsList>

             {/* --- To'lovlar Tarixi --- */}
            <TabsContent value="payments_history" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Amalga oshirilgan to‘lovlar</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userPayments.length > 0 ? ( userPayments
                        .sort((a:any, b:any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                        .map((up: any) => (
                           <div key={up.id} className="flex justify-between items-center p-3 border rounded-md hover:bg-gray-50 text-xs">
                                <div>
                                    <div className="font-medium text-sm">{formatCurrency(up.amount)}</div>
                                    <div className="text-muted-foreground">{formatDate(up.payment_date)} - {up.payment_type}</div>
                                    {up.description && <div className="text-muted-foreground italic mt-1">"{up.description}"</div>}
                                </div>
                                <div className="text-muted-foreground">ID: {up.id}</div>
                           </div>
                        ))
                    ) : (<p className="text-muted-foreground text-sm italic text-center py-4">Hali to'lovlar amalga oshirilmagan.</p>)}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* --- Hujjatlar --- */}
            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Hujjatlar</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {apartment.documents.length > 0 ? ( apartment.documents.map((doc: any) => (
                        <div key={doc.id} className="flex justify-between items-center p-3 border rounded-md hover:bg-gray-50 text-xs">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-sm">{doc.doc_file?.split('/').pop() || `Hujjat ${doc.id}`}</div>
                              <div className="text-muted-foreground">Qo'shildi: {formatDate(doc.created_at)}</div>
                            </div>
                          </div>
                           {/* Fayl linklari backend media URLga mos bo'lishi kerak */}
                           {doc.doc_file && (<Button variant="outline" size="sm" asChild><a href={`${API_BASE_URL}${doc.doc_file}`} target="_blank" rel="noopener noreferrer" download>Yuklash</a></Button>)}
                           {/* Agar PDF ham bo'lsa: */}
                           {/* {doc.pdf_file && (<Button ...>Yuklash (.pdf)</Button>)} */}
                        </div>
                      ))
                    ) : (<p className="text-muted-foreground text-sm italic text-center py-4">Hujjatlar mavjud emas.</p>)}
                     {/* Yangi hujjat qo'shish: */}
                     {/* <Button variant="outline" size="sm" disabled><Plus className="mr-2 h-4 w-4" /> Hujjat qo'shish</Button> */}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

             {/* --- To'lovlar Jadvali --- */}
            <TabsContent value="payment_schedule" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">To‘lov jadvali</CardTitle></CardHeader>
                <CardContent>
                   {mainPayment && (mainPayment.payment_type === 'muddatli' || mainPayment.payment_type === 'ipoteka') ? (
                     <div className="space-y-4">
                       {/* Haqiqiy jadval backenddan kelishi yoki generatsiya qilinishi kerak */}
                       <div className="flex justify-between items-center p-3 border rounded-md bg-gray-50 text-xs">
                           <div>
                             <div className="font-medium text-sm">Oylik to'lov</div>
                             <div className="text-muted-foreground">Har oyning {mainPayment.due_date || 'belgilangan'}-sanasi</div>
                           </div>
                           <div className="text-right">
                             <div className="font-medium text-sm">{formatCurrency(mainPayment.monthly_payment)}</div>
                             <div className="text-muted-foreground">{mainPayment.duration_months || '-'} oy davomida</div>
                           </div>
                       </div>
                       <p className="text-muted-foreground text-xs italic text-center py-2">Batafsil jadval uchun backend integratsiyasi kutilmoqda.</p>
                       {/* Bu yerga jadvalni chiqarish logikasi */}
                     </div>
                   ) : (<p className="text-muted-foreground text-sm italic text-center py-4">{mainPayment ? "Naqd to'lov uchun jadval mavjud emas." : "To'lov ma'lumotlari topilmadi."}</p>)}
                 </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        )}
      </div>

      {/* ------ Modallar ------ */}

      {/* --- To‘lov qo‘shish Modal --- */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Yangi to‘lov qo‘shish</DialogTitle>
            <CardDescription>Xonadon №{apartment.room_number} uchun to'lov.</CardDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             {/* Amount */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right text-sm">Summa*</Label>
              <Input id="amount" name="amount" type="number" value={paymentForm.amount} onChange={handlePaymentChange} placeholder="0" className="col-span-3" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4 -mt-2">
               <span className="col-start-2 col-span-3 text-xs text-muted-foreground">{formatCurrency(paymentForm.amount)}</span>
             </div>
             {/* Payment Date */}
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentDate" className="text-right text-sm">Sana*</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn("col-span-3 justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP", {}) : <span>Sanani tanlang</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                    </PopoverContent>
                </Popover>
             </div>
             {/* Payment Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentType" className="text-right text-sm">To‘lov turi*</Label>
               <div className="col-span-3">
                   <Select value={paymentForm.paymentType} onValueChange={handlePaymentTypeChange}>
                    <SelectTrigger id="paymentType"><SelectValue placeholder="To‘lov turini tanlang" /></SelectTrigger>
                    <SelectContent>
                        {/* Qiymatlar backenddagiga mos bo'lishi kerak */}
                        <SelectItem value="naqd">Naqd pul</SelectItem>
                        <SelectItem value="plastik">Plastik karta</SelectItem>
                        <SelectItem value="bank">Bank o'tkazmasi</SelectItem>
                        <SelectItem value="boshqa">Boshqa</SelectItem>
                    </SelectContent>
                    </Select>
               </div>
            </div>
             {/* Description */}
            <div className="grid grid-cols-4 items-start gap-4"> {/* items-start */}
              <Label htmlFor="description" className="text-right text-sm mt-1">Tavsif</Label>
              <Textarea id="description" name="description" value={paymentForm.description} onChange={handlePaymentChange} placeholder="Izoh (ixtiyoriy)" className="col-span-3" rows={2}/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClosePaymentModal}>Bekor qilish</Button>
            <Button onClick={handleAddPayment} disabled={paymentLoading}>
               {paymentLoading ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Xonadonni Tahrirlash Modal --- */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader><DialogTitle>Xonadon №{editForm.room_number} tahrirlash</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
             {/* ... (Input fields: room_number, floor, rooms, area, price) ... */}
             <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit_room_number" className="text-right text-sm">Xonadon №*</Label><Input id="edit_room_number" name="room_number" value={editForm.room_number} onChange={handleEditChange} className="col-span-3" required /></div>
             <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit_floor" className="text-right text-sm">Qavat*</Label><Input id="edit_floor" name="floor" type="number" value={editForm.floor} onChange={handleEditChange} className="col-span-3" required /></div>
             <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit_rooms" className="text-right text-sm">Xonalar*</Label><Input id="edit_rooms" name="rooms" type="number" value={editForm.rooms} onChange={handleEditChange} className="col-span-3" required /></div>
             <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit_area" className="text-right text-sm">Maydon (m²)*</Label><Input id="edit_area" name="area" type="number" step="0.01" value={editForm.area} onChange={handleEditChange} className="col-span-3" required /></div>
             <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit_price" className="text-right text-sm">Narx (so‘m)*</Label><Input id="edit_price" name="price" type="number" value={editForm.price} onChange={handleEditChange} className="col-span-3" required /></div>
             <div className="grid grid-cols-4 items-center gap-4 -mt-2"><span className="col-start-2 col-span-3 text-xs text-muted-foreground">{formatCurrency(editForm.price)}</span></div>
             {/* Description */}
             <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="edit_description" className="text-right text-sm mt-1">Tavsif</Label><Textarea id="edit_description" name="description" value={editForm.description} onChange={handleEditChange} placeholder="Xonadon haqida" className="col-span-3" rows={3}/></div>
             {/* Status */}
             <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit_status" className="text-right text-sm">Holati*</Label><div className="col-span-3"><Select value={editForm.status} onValueChange={handleEditStatusChange}><SelectTrigger id="edit_status"><SelectValue placeholder="Holati tanlang" /></SelectTrigger><SelectContent><SelectItem value="bosh">Bo‘sh</SelectItem><SelectItem value="band">Band</SelectItem><SelectItem value="sold">Sotilgan</SelectItem></SelectContent></Select></div></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditModal}>Bekor qilish</Button>
            <Button onClick={handleUpdateApartment} disabled={editLoading}>
              {editLoading ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div> // Root div
  );
}