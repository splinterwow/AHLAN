"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/main-nav";
import { Search } from "@/components/search";
import { UserNav } from "@/components/user-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter, useSearchParams } from "next/navigation";
import { Home, DollarSign, User, Calendar, Plus, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast"; // O'zingizning toast hook'ingizni import qiling

// --- Statuslar uchun doimiy ro'yxat ---
// --- Statuslar uchun doimiy ro'yxat ---
const ALL_STATUSES = [
  { value: "bosh", label: "Bo'sh" },
  { value: "band", label: "Band" },
  // { value: "sold", label: "Sotilgan" }, // Eski qiymat
  { value: "sotilgan", label: "Sotilgan" }, // YANGI QIYMAT (API kutgan qiymat)
];
// --- Xonalar soni uchun doimiy ro'yxat (ixtiyoriy, kodni tozalash uchun) ---
const ALL_ROOM_OPTIONS = [
  { value: "1", label: "1 xona" },
  { value: "2", label: "2 xona" },
  { value: "3", label: "3 xona" },
  { value: "4", label: "4 xona" },
  // Kerak bo'lsa qo'shing
];

// --- Qavatlar uchun doimiy ro'yxat (ixtiyoriy, kodni tozalash uchun) ---
const ALL_FLOOR_OPTIONS = Array.from({ length: 16 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `${i + 1}-qavat`,
}));
// ---

export default function ApartmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyIdParam = searchParams.get("propertyId"); // Buni ishlatayotganingizga ishonch hosil qiling yoki olib tashlang

  const [apartments, setApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "", // "all" yoki "" bo'lishi mumkin
    rooms: "", // "all" yoki "" bo'lishi mumkin
    minPrice: "",
    maxPrice: "",
    minArea: "",
    maxArea: "",
    floor: "", // "all" yoki "" bo'lishi mumkin
    search: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 20, // Sahifadagi elementlar soni
  });

  const API_BASE_URL = "http://api.ahlan.uz"; // O'zingizning API URL manzilingiz

  // Tokenni olish uchun useEffect
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast({
          title: "Xatolik",
          description: "Avtorizatsiya qilinmagan. Iltimos, tizimga kiring.",
          variant: "destructive",
        });
        router.push("/login"); // Login sahifasiga yo'naltirish
      } else {
        setAccessToken(token);
      }
    }
  }, [router]);

  // API uchun sarlavhalar
  const getAuthHeaders = () => ({
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  });

  // Xonadonlarni olish funksiyasi
  const fetchApartments = async (page = pagination.currentPage) => {
    if (!accessToken) return; // Token yo'q bo'lsa, so'rov jo'natmaymiz

    setLoading(true);
    try {
      let url = `${API_BASE_URL}/apartments/`;
      const queryParams = new URLSearchParams();

      // Filtrlarni parametrlarga qo'shish
      if (filters.status && filters.status !== "all") queryParams.append("status", filters.status);
      if (filters.rooms && filters.rooms !== "all") queryParams.append("rooms", filters.rooms);
      if (filters.minPrice) queryParams.append("price__gte", filters.minPrice);
      if (filters.maxPrice) queryParams.append("price__lte", filters.maxPrice);
      if (filters.minArea) queryParams.append("area__gte", filters.minArea);
      if (filters.maxArea) queryParams.append("area__lte", filters.maxArea);
      if (filters.floor && filters.floor !== "all") queryParams.append("floor", filters.floor);
      if (filters.search) queryParams.append("search", filters.search);
      // propertyIdParam dan foydalanish (agar kerak bo'lsa)
      if (propertyIdParam) queryParams.append("property_id", propertyIdParam); // API qanday parametr kutishiga bog'liq

      // Pagination parametrlari
      queryParams.append("page", page.toString());
      queryParams.append("page_size", pagination.pageSize.toString());

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Sessiya tugagan yoki token yaroqsiz
          localStorage.removeItem("access_token"); // Tokenni tozalash
          setAccessToken(null);
          toast({
            title: "Sessiya tugadi",
            description: "Iltimos, tizimga qayta kiring.",
            variant: "destructive",
          });
          router.push("/login");
          // Xatolikni qayta tashlamaslik uchun return qilamiz, chunki foydalanuvchi login sahifasiga yo'naltirildi
          return;
        }
        // Boshqa xatoliklar
        const errorData = await response.json().catch(() => ({})); // Agar javob JSON bo'lmasa
        throw new Error(`Xonadonlarni olishda xatolik (${response.status}): ${errorData.detail || response.statusText}`);
      }

      const data = await response.json();
      setApartments(data.results || []);
      setPagination(prev => ({
        ...prev,
        currentPage: page,
        totalPages: Math.ceil(data.count / prev.pageSize),
      }));

    } catch (error) {
      console.error("Fetch apartments error:", error);
      toast({
        title: "Xatolik",
        description: (error as Error).message || "Xonadonlarni yuklashda noma'lum xatolik.",
        variant: "destructive",
      });
      // 401 xatoligi bo'lmasa ham, boshqa muammolar bo'lishi mumkin
      // Masalan, tarmoq xatosi. Bu holda qayta urinish logikasi qo'shish mumkin.
    } finally {
      setLoading(false);
    }
  };

  // CRUD operatsiyalari (create, update, delete)
  // Bu funksiyalar sizning kodingizda mavjud edi, ularni shu yerga qo'shishingiz mumkin.
  // Misol uchun deleteApartment:
  const deleteApartment = async (id: number) => {
    if (!accessToken) return; // Tokenni tekshirish
    if (!window.confirm("Haqiqatan ham bu xonadonni o‘chirmoqchimisiz?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/apartments/${id}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
        throw new Error(`Xonadonni o‘chirishda xatolik (${response.status}): ${errorData.detail || response.statusText}`);
      }

      toast({
        title: "Muvaffaqiyat",
        description: "Xonadon muvaffaqiyatli o‘chirildi.",
      });
      // Ro'yxatni yangilash (joriy sahifada qolish yoki birinchi sahifaga qaytish)
      // Agar o'chirilgandan keyin joriy sahifa bo'sh qolsa, oldingi sahifaga o'tish logikasi qo'shilishi mumkin
      fetchApartments(pagination.currentPage);

    } catch (error) {
       console.error("Delete apartment error:", error);
      toast({
        title: "Xatolik",
        description: (error as Error).message || "Xonadonni o‘chirishda noma'lum xatolik.",
        variant: "destructive",
      });
    }
  };
  // updateApartment, createApartment va partialUpdateApartment uchun ham xuddi shunday try/catch va toast qo'shing.


  // Token yoki filtrlar o'zgarganda xonadonlarni qayta yuklash
  useEffect(() => {
    if (accessToken) {
      fetchApartments(1); // Filtrlar o'zgarganda har doim birinchi sahifadan boshlaymiz
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, filters, propertyIdParam, pagination.pageSize]); // pagination.currentPage ni dependencylardan olib tashladik, chunki u fetchApartments chaqiruvida boshqariladi


  // Filtr qiymatini o'zgartirish uchun handler
  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    // Filtr o'zgarganda paginationni birinchi sahifaga qaytarmaymiz,
    // chunki useEffect dependencylarida filters bor va u fetchApartments(1) ni chaqiradi.
  };

  // Sahifani o'zgartirish uchun handler
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchApartments(newPage); // Faqat sahifani o'zgartiramiz
    }
  };

  // Status uchun Badge komponentini qaytaruvchi funksiya
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) { // Kichik harflarga o'tkazish xatolikni oldini olish uchun
      case "bosh":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Bo'sh</Badge>;
      case "band":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Band</Badge>; // text-black qo'shilishi mumkin
      case "sold":
        return <Badge className="bg-green-500 hover:bg-green-600">Sotilgan</Badge>;
      default:
        return <Badge variant="secondary">{status || "Noma'lum"}</Badge>; // variant="secondary" yoki boshqa stil
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/40"> {/* Fon rangi qo'shilishi mumkin */}
      {/* Header */}
      <div className="border-b bg-background"> {/* Fon rangi ajratilishi */}
        <div className="flex h-16 items-center px-4 md:px-6">
          <MainNav className="mx-6 hidden md:flex" /> {/* Kichik ekranlarda yashirish */}
          {/* Mobil menyu uchun alohida trigger qo'shilishi mumkin */}
          <div className="ml-auto flex items-center space-x-4">
            <Search />
            <UserNav />
          </div>
        </div>
      </div>

      {/* Asosiy kontent */}
      <main className="flex-1 space-y-6 p-4 pt-6 md:p-8"> {/* Padding va bo'shliqlar */}
        {/* Sarlavha va Yangi qo'shish tugmasi */}
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Xonadonlar</h2>
          <Link href="/apartments/add" passHref>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yangi xonadon
            </Button>
          </Link>
        </div>

        {/* Filterlar paneli */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4"> {/* Moslashuvchan grid */}
              {/* Status filteri */}
              <div className="space-y-1.5"> {/* Label va Input orasidagi bo'shliqni kamaytirish */}
                <Label htmlFor="status">Holati</Label>
                <Select
                  value={filters.status || "all"} // Agar bo'sh bo'lsa "all" ni ko'rsat
                  onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)} // "all" tanlansa qiymatni "" ga o'zgartirish
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Barcha holatlar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha holatlar</SelectItem>
                    {ALL_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Xonalar soni filteri */}
              <div className="space-y-1.5">
                <Label htmlFor="rooms">Xonalar soni</Label>
                <Select
                  value={filters.rooms || "all"}
                  onValueChange={(value) => handleFilterChange("rooms", value === "all" ? "" : value)}
                >
                  <SelectTrigger id="rooms">
                    <SelectValue placeholder="Barcha xonalar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha xonalar</SelectItem>
                    {ALL_ROOM_OPTIONS.map((room) => (
                      <SelectItem key={room.value} value={room.value}>
                        {room.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Qavat filteri */}
              <div className="space-y-1.5">
                <Label htmlFor="floor">Qavat</Label>
                <Select
                  value={filters.floor || "all"}
                  onValueChange={(value) => handleFilterChange("floor", value === "all" ? "" : value)}
                >
                  <SelectTrigger id="floor">
                    <SelectValue placeholder="Barcha qavatlar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha qavatlar</SelectItem>
                    {ALL_FLOOR_OPTIONS.map((floor) => (
                      <SelectItem key={floor.value} value={floor.value}>
                        {floor.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Qidiruv maydoni */}
              <div className="space-y-1.5">
                <Label htmlFor="search">Qidiruv (xonadon №)</Label>
                <Input
                  id="search"
                  placeholder="Xonadon raqami..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </div>

              {/* Narx diapazoni filterlari */}
              <div className="space-y-1.5">
                <Label htmlFor="minPrice">Minimal narx (UZS)</Label>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder="Mas: 300000000"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                  min="0" // Minimal qiymat
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maxPrice">Maksimal narx (UZS)</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  placeholder="Mas: 1000000000"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                  min="0"
                />
              </div>

              {/* Maydon diapazoni filterlari */}
              <div className="space-y-1.5">
                <Label htmlFor="minArea">Minimal maydon (m²)</Label>
                <Input
                  id="minArea"
                  type="number"
                  placeholder="Mas: 30"
                  value={filters.minArea}
                  onChange={(e) => handleFilterChange("minArea", e.target.value)}
                  min="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maxArea">Maksimal maydon (m²)</Label>
                <Input
                  id="maxArea"
                  type="number"
                  placeholder="Mas: 120"
                  value={filters.maxArea}
                  onChange={(e) => handleFilterChange("maxArea", e.target.value)}
                  min="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Xonadonlar ro'yxati yoki Loading/Bo'sh holat */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Skeleton loader */}
            {Array.from({ length: pagination.pageSize }).map((_, i) => ( // Ko'proq skeleton ko'rsatish
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="mt-4 pt-3 border-t flex space-x-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : apartments.length === 0 ? (
           // Ma'lumot yo'q holati
          <Card>
            <CardContent className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">Filtrlarga mos xonadonlar topilmadi.</p>
            </CardContent>
          </Card>
        ) : (
          // Xonadonlar ro'yxati
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {apartments.map((apartment) => (
                <Card
                  key={apartment.id}
                  className="overflow-hidden transition-shadow duration-200 hover:shadow-lg" // Yaxshiroq hover effekti
                >
                  {/* Rasm uchun joy (agar mavjud bo'lsa) */}
                  {/* <div className="h-40 bg-muted flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" /> Placeholder
                  </div> */}
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                         {/* Xonadon raqami va obyekti */}
                        <h3
                          className="text-lg font-semibold cursor-pointer hover:underline"
                          onClick={(e) => {
                            e.stopPropagation(); // Card onClick ni ishga tushirmaslik uchun
                            router.push(`/apartments/${apartment.id}`);
                          }}
                        >
                          № {apartment.room_number || 'N/A'}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {apartment.property?.name || apartment.object_name || "Noma'lum obyekt"}
                        </p>
                      </div>
                       {/* Status Badge */}
                      {getStatusBadge(apartment.status)}
                    </div>

                    {/* Asosiy ma'lumotlar */}
                    <div className="space-y-1 text-sm text-foreground">
                      <div className="flex items-center">
                        <Home className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>
                          {apartment.rooms || '?'} xona, {apartment.area || '?'} m², {apartment.floor || '?'} - qavat
                        </span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium">
                          {/* Narxni formatlash */}
                          {Number(apartment.price)
                            ? Number(apartment.price).toLocaleString("uz-UZ", { style: "currency", currency: "UZS", minimumFractionDigits: 0 })
                            : "Narx ko'rsatilmagan"}
                        </span>
                      </div>
                      {/* Mijoz ma'lumoti (agar band yoki sotilgan bo'lsa) */}
                      {apartment.status !== "bosh" && apartment.client && (
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate" title={apartment.client?.name}>
                            {apartment.client?.name || "Noma'lum mijoz"}
                          </span>
                        </div>
                      )}
                      {/* Band qilingan sana (agar band bo'lsa) */}
                      {apartment.status === "band" && apartment.reservation_date && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="mr-1.5 h-3.5 w-3.5" />
                          <span>Band: {new Date(apartment.reservation_date).toLocaleDateString('uz-UZ')}</span>
                        </div>
                      )}
                      {/* Sotilgan sana (agar sotilgan bo'lsa) */}
                      {apartment.status === "sold" && apartment.sold_date && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="mr-1.5 h-3.5 w-3.5" />
                          <span>Sotilgan: {new Date(apartment.sold_date).toLocaleDateString('uz-UZ')}</span>
                        </div>
                      )}
                    </div>

                     {/* Amallar tugmalari */}
                    <div className="mt-4 pt-3 border-t flex flex-wrap gap-2"> {/* Moslashuvchan gap */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 min-w-[80px]" // Minimal kenglik
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/apartments/${apartment.id}`); // Batafsil sahifasi
                        }}
                      >
                        Batafsil
                      </Button>

                      {/* Shartli tugmalar */}
                      {apartment.status === "bosh" && (
                        <Button
                          size="sm"
                          className="flex-1 min-w-[80px] bg-yellow-500 hover:bg-yellow-600 text-black" // Rang berish
                          onClick={(e) => {
                            e.stopPropagation();
                            // Band qilish logikasi yoki sahifasi
                            router.push(`/apartments/${apartment.id}/reserve`); // Yoki modal ochish
                          }}
                        >
                          Band qilish
                        </Button>
                      )}

                      {/* Yangilash va O'chirish tugmalari */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 min-w-[80px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/apartments/edit/${apartment.id}`); // Tahrirlash sahifasiga
                        }}
                        aria-label="Tahrirlash"
                      >
                        <Edit className="h-4 w-4" /> {/* Matnsiz ikonka */}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 min-w-[80px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteApartment(apartment.id);
                        }}
                        aria-label="O'chirish"
                      >
                         <Trash2 className="h-4 w-4" /> {/* Matnsiz ikonka */}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage === 1}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                >
                  Oldingi
                </Button>
                <span className="text-sm text-muted-foreground">
                  Sahifa {pagination.currentPage} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                >
                  Keyingi
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}