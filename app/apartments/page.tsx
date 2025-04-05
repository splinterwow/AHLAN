// "use client";

// import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { MainNav } from "@/components/main-nav";
// import { Search } from "@/components/search";
// import { UserNav } from "@/components/user-nav";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Skeleton } from "@/components/ui/skeleton";
// import { useRouter, useSearchParams } from "next/navigation";
// import { Home, DollarSign, User, Calendar, Plus, Trash2, Edit } from "lucide-react";
// import Link from "next/link";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { toast } from "@/hooks/use-toast";

// const ALL_STATUSES = [
//   { value: "bosh", label: "Bo'sh" },
//   { value: "band", label: "Band" },
//   { value: "sotilgan", label: "Sotilgan" },
// ];

// const ALL_ROOM_OPTIONS = [
//   { value: "1", label: "1 xona" },
//   { value: "2", label: "2 xona" },
//   { value: "3", label: "3 xona" },
//   { value: "4", label: "4 xona" },
// ];

// const ALL_FLOOR_OPTIONS = Array.from({ length: 16 }, (_, i) => ({
//   value: (i + 1).toString(),
//   label: `${i + 1}-qavat`,
// }));

// export default function ApartmentsPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const propertyIdParam = searchParams.get("propertyId");

//   const [apartments, setApartments] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [accessToken, setAccessToken] = useState<string | null>(null);
//   const [filters, setFilters] = useState({
//     status: "",
//     rooms: "",
//     minPrice: "",
//     maxPrice: "",
//     minArea: "",
//     maxArea: "",
//     floor: "",
//     search: "",
//   });
//   const [pagination, setPagination] = useState({
//     currentPage: 1,
//     totalPages: 1,
//     pageSize: 20,
//   });

//   const API_BASE_URL = "http://api.ahlan.uz";

//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       const token = localStorage.getItem("access_token");
//       if (!token) {
//         toast({
//           title: "Xatolik",
//           description: "Avtorizatsiya qilinmagan. Iltimos, tizimga kiring.",
//           variant: "destructive",
//         });
//         router.push("/login");
//       } else {
//         setAccessToken(token);
//       }
//     }
//   }, [router]);

//   const getAuthHeaders = () => ({
//     Accept: "application/json",
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${accessToken}`,
//   });

//   const fetchApartments = async (page = pagination.currentPage) => {
//     if (!accessToken) return;

//     setLoading(true);
//     try {
//       let url = `${API_BASE_URL}/apartments/`;
//       const queryParams = new URLSearchParams();

//       if (filters.status && filters.status !== "all") queryParams.append("status", filters.status);
//       if (filters.rooms && filters.rooms !== "all") queryParams.append("rooms", filters.rooms);
//       if (filters.minPrice) queryParams.append("price__gte", filters.minPrice);
//       if (filters.maxPrice) queryParams.append("price__lte", filters.maxPrice);
//       if (filters.minArea) queryParams.append("area__gte", filters.minArea);
//       if (filters.maxArea) queryParams.append("area__lte", filters.maxArea);
//       if (filters.floor && filters.floor !== "all") queryParams.append("floor", filters.floor);
//       if (filters.search) queryParams.append("search", filters.search);
//       if (propertyIdParam) queryParams.append("property_id", propertyIdParam);

//       queryParams.append("page", page.toString());
//       queryParams.append("page_size", pagination.pageSize.toString());

//       if (queryParams.toString()) {
//         url += `?${queryParams.toString()}`;
//       }

//       const response = await fetch(url, {
//         method: "GET",
//         headers: getAuthHeaders(),
//       });

//       if (!response.ok) {
//         if (response.status === 401) {
//           localStorage.removeItem("access_token");
//           setAccessToken(null);
//           toast({
//             title: "Sessiya tugadi",
//             description: "Iltimos, tizimga qayta kiring.",
//             variant: "destructive",
//           });
//           router.push("/login");
//           return;
//         }
//         const errorData = await response.json().catch(() => ({}));
//         throw new Error(`Xonadonlarni olishda xatolik (${response.status}): ${errorData.detail || response.statusText}`);
//       }

//       const data = await response.json();
//       setApartments(data.results || []);
//       setPagination(prev => ({
//         ...prev,
//         currentPage: page,
//         totalPages: Math.ceil(data.count / prev.pageSize),
//       }));

//     } catch (error) {
//       console.error("Fetch apartments error:", error);
//       toast({
//         title: "Xatolik",
//         description: (error as Error).message || "Xonadonlarni yuklashda noma'lum xatolik.",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const deleteApartment = async (id: number) => {
//     if (!accessToken) return;
//     if (!window.confirm("Haqiqatan ham bu xonadonni o‘chirmoqchimisiz?")) return;

//     try {
//       const response = await fetch(`${API_BASE_URL}/apartments/${id}/`, {
//         method: "DELETE",
//         headers: getAuthHeaders(),
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         throw new Error(`Xonadonni o‘chirishda xatolik (${response.status}): ${errorData.detail || response.statusText}`);
//       }

//       toast({
//         title: "Muvaffaqiyat",
//         description: "Xonadon muvaffaqiyatli o‘chirildi.",
//       });
//       fetchApartments(pagination.currentPage);

//     } catch (error) {
//       console.error("Delete apartment error:", error);
//       toast({
//         title: "Xatolik",
//         description: (error as Error).message || "Xonadonni o‘chirishda noma'lum xatolik.",
//         variant: "destructive",
//       });
//     }
//   };

//   useEffect(() => {
//     if (accessToken) {
//       fetchApartments(1);
//     }
//   }, [accessToken, filters, propertyIdParam, pagination.pageSize]);

//   const handleFilterChange = (name: string, value: string) => {
//     setFilters((prev) => ({ ...prev, [name]: value }));
//   };

//   const handlePageChange = (newPage: number) => {
//     if (newPage >= 1 && newPage <= pagination.totalPages) {
//       fetchApartments(newPage);
//     }
//   };

//   const getStatusBadge = (status: string) => {
//     switch (status?.toLowerCase()) {
//       case "bosh":
//         return <Badge className="bg-blue-500 hover:bg-blue-600">Bo'sh</Badge>;
//       case "band":
//         return <Badge className="bg-red-500 hover:bg-red-600">Band</Badge>;
//       case "sotilgan":
//         return <Badge className="bg-green-500 hover:bg-green-600">Sotilgan</Badge>;
//       default:
//         return <Badge variant="secondary">{status || "Noma'lum"}</Badge>;
//     }
//   };

//   return (
//     <div className="flex min-h-screen flex-col bg-muted/40">
//       <div className="border-b bg-background">
//         <div className="flex h-16 items-center px-4 md:px-6">
//           <MainNav className="mx-6 hidden md:flex" />
//           <div className="ml-auto flex items-center space-x-4">
//             <Search />
//             <UserNav />
//           </div>
//         </div>
//       </div>

//       <main className="flex-1 space-y-6 p-4 pt-6 md:p-8">
//         <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between">
//           <h2 className="text-3xl font-bold tracking-tight">Xonadonlar</h2>
//           <Link href="/apartments/add" passHref>
//             <Button>
//               <Plus className="mr-2 h-4 w-4" />
//               Yangi xonadon
//             </Button>
//           </Link>
//         </div>

//         <Card>
//           <CardContent className="p-4 md:p-6">
//             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
//               <div className="space-y-1.5">
//                 <Label htmlFor="status">Holati</Label>
//                 <Select
//                   value={filters.status || "all"}
//                   onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}
//                 >
//                   <SelectTrigger id="status">
//                     <SelectValue placeholder="Barcha holatlar" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">Barcha holatlar</SelectItem>
//                     {ALL_STATUSES.map((status) => (
//                       <SelectItem key={status.value} value={status.value}>
//                         {status.label}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="space-y-1.5">
//                 <Label htmlFor="rooms">Xonalar soni</Label>
//                 <Select
//                   value={filters.rooms || "all"}
//                   onValueChange={(value) => handleFilterChange("rooms", value === "all" ? "" : value)}
//                 >
//                   <SelectTrigger id="rooms">
//                     <SelectValue placeholder="Barcha xonalar" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">Barcha xonalar</SelectItem>
//                     {ALL_ROOM_OPTIONS.map((room) => (
//                       <SelectItem key={room.value} value={room.value}>
//                         {room.label}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="space-y-1.5">
//                 <Label htmlFor="floor">Qavat</Label>
//                 <Select
//                   value={filters.floor || "all"}
//                   onValueChange={(value) => handleFilterChange("floor", value === "all" ? "" : value)}
//                 >
//                   <SelectTrigger id="floor">
//                     <SelectValue placeholder="Barcha qavatlar" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">Barcha qavatlar</SelectItem>
//                     {ALL_FLOOR_OPTIONS.map((floor) => (
//                       <SelectItem key={floor.value} value={floor.value}>
//                         {floor.label}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="space-y-1.5">
//                 <Label htmlFor="search">Qidiruv (xonadon №)</Label>
//                 <Input
//                   id="search"
//                   placeholder="Xonadon raqami..."
//                   value={filters.search}
//                   onChange={(e) => handleFilterChange("search", e.target.value)}
//                 />
//               </div>

//               <div className="space-y-1.5">
//                 <Label htmlFor="minPrice">Minimal narx (UZS)</Label>
//                 <Input
//                   id="minPrice"
//                   type="number"
//                   placeholder="Mas: 300000000"
//                   value={filters.minPrice}
//                   onChange={(e) => handleFilterChange("minPrice", e.target.value)}
//                   min="0"
//                 />
//               </div>
//               <div className="space-y-1.5">
//                 <Label htmlFor="maxPrice">Maksimal narx (UZS)</Label>
//                 <Input
//                   id="maxPrice"
//                   type="number"
//                   placeholder="Mas: 1000000000"
//                   value={filters.maxPrice}
//                   onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
//                   min="0"
//                 />
//               </div>

//               <div className="space-y-1.5">
//                 <Label htmlFor="minArea">Minimal maydon (m²)</Label>
//                 <Input
//                   id="minArea"
//                   type="number"
//                   placeholder="Mas: 30"
//                   value={filters.minArea}
//                   onChange={(e) => handleFilterChange("minArea", e.target.value)}
//                   min="0"
//                 />
//               </div>
//               <div className="space-y-1.5">
//                 <Label htmlFor="maxArea">Maksimal maydon (m²)</Label>
//                 <Input
//                   id="maxArea"
//                   type="number"
//                   placeholder="Mas: 120"
//                   value={filters.maxArea}
//                   onChange={(e) => handleFilterChange("maxArea", e.target.value)}
//                   min="0"
//                 />
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {loading ? (
//           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
//             {Array.from({ length: pagination.pageSize }).map((_, i) => (
//               <Card key={i}>
//                 <CardContent className="p-4 space-y-3">
//                   <div className="flex justify-between">
//                     <Skeleton className="h-6 w-20" />
//                     <Skeleton className="h-5 w-16" />
//                   </div>
//                   <Skeleton className="h-4 w-3/4" />
//                   <Skeleton className="h-4 w-1/2" />
//                   <Skeleton className="h-4 w-2/3" />
//                   <div className="mt-4 pt-3 border-t flex space-x-2">
//                     <Skeleton className="h-9 flex-1" />
//                     <Skeleton className="h-9 flex-1" />
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         ) : apartments.length === 0 ? (
//           <Card>
//             <CardContent className="flex items-center justify-center h-40">
//               <p className="text-muted-foreground">Filtrlarga mos xonadonlar topilmadi.</p>
//             </CardContent>
//           </Card>
//         ) : (
//           <>
//             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
//               {apartments.map((apartment) => (
//                 <Card
//                   key={apartment.id}
//                   className="overflow-hidden transition-shadow duration-200 hover:shadow-lg cursor-pointer"
//                   onClick={() => router.push(`/apartments/${apartment.id}`)}
//                 >
//                   <CardContent className="p-4 space-y-2">
//                     <div className="flex justify-between items-start mb-2">
//                       <div>
//                         <h3 className="text-lg font-semibold">
//                           № {apartment.room_number || "N/A"}
//                         </h3>
//                         <p className="text-xs text-muted-foreground">
//                           {apartment.property?.name || apartment.object_name || "Noma'lum obyekt"}
//                         </p>
//                       </div>
//                       {getStatusBadge(apartment.status)}
//                     </div>

//                     <div className="space-y-1 text-sm text-foreground">
//                       <div className="flex items-center">
//                         <Home className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
//                         <span>
//                           {apartment.rooms || "?"} xona, {apartment.area || "?"} m², {apartment.floor || "?"} - qavat
//                         </span>
//                       </div>
//                       <div className="flex items-center">
//                         <DollarSign className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
//                         <span className="font-medium">
//                           {Number(apartment.price)
//                             ? Number(apartment.price).toLocaleString("uz-UZ", { style: "currency", currency: "UZS", minimumFractionDigits: 0 })
//                             : "Narx ko'rsatilmagan"}
//                         </span>
//                       </div>
//                       {apartment.status !== "bosh" && apartment.client && (
//                         <div className="flex items-center">
//                           <User className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
//                           <span className="truncate" title={apartment.client?.name}>
//                             {apartment.client?.name || "Noma'lum mijoz"}
//                           </span>
//                         </div>
//                       )}
//                       {apartment.status === "band" && apartment.reservation_date && (
//                         <div className="flex items-center text-xs text-muted-foreground">
//                           <Calendar className="mr-1.5 h-3.5 w-3.5" />
//                           <span>Band: {new Date(apartment.reservation_date).toLocaleDateString("uz-UZ")}</span>
//                         </div>
//                       )}
//                       {apartment.status === "sotilgan" && apartment.sold_date && (
//                         <div className="flex items-center text-xs text-muted-foreground">
//                           <Calendar className="mr-1.5 h-3.5 w-3.5" />
//                           <span>Sotilgan: {new Date(apartment.sold_date).toLocaleDateString("uz-UZ")}</span>
//                         </div>
//                       )}
//                     </div>

//                     <div className="mt-4 pt-3 border-t">
//                       {apartment.status === "bosh" ? (
//                         <div className="space-y-2">
//                           <Button
//                             size="sm"
//                             className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               router.push(`/apartments/${apartment.id}/reserve`);
//                             }}
//                           >
//                             Band qilish
//                           </Button>
//                           <div className="flex gap-2">
//                             <Button
//                               variant="outline"
//                               size="xs"
//                               className="flex-1"
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 router.push(`/apartments/edit/${apartment.id}`);
//                               }}
//                               aria-label="Tahrirlash"
//                             >
//                               <Edit className="h-4 w-4" />
//                             </Button>
//                             <Button
//                               variant="destructive"
//                               size="xs"
//                               className="flex-1"
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 deleteApartment(apartment.id);
//                               }}
//                               aria-label="O'chirish"
//                             >
//                               <Trash2 className="h-4 w-4" />
//                             </Button>
//                           </div>
//                         </div>
//                       ) : (
//                         <div className="flex gap-2">
//                           <Button
//                             variant="outline"
//                             size="sm"
//                             className="w-16"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               router.push(`/apartments/edit/${apartment.id}`);
//                             }}
//                             aria-label="Tahrirlash"
//                           >
//                             <Edit className="h-4 w-4" />
//                           </Button>
//                           <Button
//                             variant="destructive"
//                             size="sm"
//                             className="w-16"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               deleteApartment(apartment.id);
//                             }}
//                             aria-label="O'chirish"
//                           >
//                             <Trash2 className="h-4 w-4" />
//                           </Button>
//                         </div>
//                       )}
//                     </div>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>

//             {pagination.totalPages > 1 && (
//               <div className="flex items-center justify-center space-x-2 pt-4">
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   disabled={pagination.currentPage === 1}
//                   onClick={() => handlePageChange(pagination.currentPage - 1)}
//                 >
//                   Oldingi
//                 </Button>
//                 <span className="text-sm text-muted-foreground">
//                   Sahifa {pagination.currentPage} / {pagination.totalPages}
//                 </span>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   disabled={pagination.currentPage === pagination.totalPages}
//                   onClick={() => handlePageChange(pagination.currentPage + 1)}
//                 >
//                   Keyingi
//                 </Button>
//               </div>
//             )}
//           </>
//         )}
//       </main>
//     </div>
//   );
// }



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
import { toast } from "@/hooks/use-toast";

const ALL_STATUSES = [
  { value: "bosh", label: "Bo'sh" },
  { value: "band", label: "Band" },
  { value: "sotilgan", label: "Sotilgan" },
];

const ALL_ROOM_OPTIONS = [
  { value: "1", label: "1 xona" },
  { value: "2", label: "2 xona" },
  { value: "3", label: "3 xona" },
  { value: "4", label: "4 xona" },
];

const ALL_FLOOR_OPTIONS = Array.from({ length: 16 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `${i + 1}-qavat`,
}));

export default function ApartmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyIdParam = searchParams.get("propertyId");

  const [apartments, setApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    rooms: "",
    minPrice: "",
    maxPrice: "",
    minArea: "",
    maxArea: "",
    floor: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 20, // You can adjust page size here if needed
  });

  const API_BASE_URL = "http://api.ahlan.uz"; // Replace with your actual API base URL

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast({
          title: "Xatolik",
          description: "Avtorizatsiya qilinmagan. Iltimos, tizimga kiring.",
          variant: "destructive",
        });
        router.push("/login"); // Redirect to login page
      } else {
        setAccessToken(token);
      }
    }
  }, [router]);

  const getAuthHeaders = () => ({
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  });

  const fetchApartments = async (page = pagination.currentPage) => {
    if (!accessToken) return;

    setLoading(true);
    try {
      let url = `${API_BASE_URL}/apartments/`;
      const queryParams = new URLSearchParams();

      if (filters.status && filters.status !== "all") queryParams.append("status", filters.status);
      if (filters.rooms && filters.rooms !== "all") queryParams.append("rooms", filters.rooms);
      if (filters.minPrice) queryParams.append("price__gte", filters.minPrice);
      if (filters.maxPrice) queryParams.append("price__lte", filters.maxPrice);
      if (filters.minArea) queryParams.append("area__gte", filters.minArea);
      if (filters.maxArea) queryParams.append("area__lte", filters.maxArea);
      if (filters.floor && filters.floor !== "all") queryParams.append("floor", filters.floor);
      if (filters.search) queryParams.append("search", filters.search); // Assuming backend supports search by room number
      if (propertyIdParam) queryParams.append("property_id", propertyIdParam);

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
          // Handle token expiry or invalid token
          localStorage.removeItem("access_token");
          setAccessToken(null);
          toast({
            title: "Sessiya tugadi",
            description: "Iltimos, tizimga qayta kiring.",
            variant: "destructive",
          });
          router.push("/login");
          return; // Stop execution
        }
        const errorData = await response.json().catch(() => ({})); // Try to parse error, default to empty object
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
    } finally {
      setLoading(false);
    }
  };

  const deleteApartment = async (id: number) => {
    if (!accessToken) return;
    // Confirmation dialog
    if (!window.confirm("Haqiqatan ham bu xonadonni o‘chirmoqchimisiz?")) {
        return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/apartments/${id}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
         if (response.status === 401) {
          localStorage.removeItem("access_token");
          setAccessToken(null);
          toast({ title: "Sessiya tugadi", description: "Iltimos, tizimga qayta kiring.", variant: "destructive" });
          router.push("/login");
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Xonadonni o‘chirishda xatolik (${response.status}): ${errorData.detail || response.statusText}`);
      }

      toast({
        title: "Muvaffaqiyat",
        description: "Xonadon muvaffaqiyatli o‘chirildi.",
      });
      // Refresh the list after deletion, staying on the current page if possible
      fetchApartments(pagination.currentPage); // Or fetchApartments(1) if you want to go back to page 1

    } catch (error) {
      console.error("Delete apartment error:", error);
      toast({
        title: "Xatolik",
        description: (error as Error).message || "Xonadonni o‘chirishda noma'lum xatolik.",
        variant: "destructive",
      });
    }
  };


  // Fetch apartments when accessToken is set, or when filters/page size change
  useEffect(() => {
    if (accessToken) {
      fetchApartments(1); // Fetch page 1 when filters change
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, filters, propertyIdParam, pagination.pageSize]); // Re-fetch on filter/param change


  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    // Reset to page 1 when filters change
    // setPagination(prev => ({ ...prev, currentPage: 1 }));
    // Note: The useEffect above already handles refetching on filter change and goes to page 1
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
        fetchApartments(newPage); // Fetch the specific page
    }
  };

  // CORRECTED: Function to get status badge with requested colors
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "bosh": // Bo'sh uchun ko'k rang
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Bo'sh</Badge>;
      case "band": // Band uchun qizil rang
        return <Badge className="bg-red-500 hover:bg-red-600 text-white">Band</Badge>;
      case "sotilgan": // Sotilgan uchun yashil rang
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Sotilgan</Badge>;
      default:
        return <Badge variant="secondary">{status || "Noma'lum"}</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="flex h-16 items-center px-4 md:px-6">
          <MainNav className="mx-6 hidden md:flex" />
          <div className="ml-auto flex items-center space-x-4">
            <Search />
            <UserNav />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        {/* Page Header */}
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Xonadonlar</h2>
          <Link href="/apartments/add" passHref>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yangi xonadon
            </Button>
          </Link>
        </div>

        {/* Filters Card */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4"> {/* Adjusted grid for better spacing */}
              {/* Status Filter */}
              <div className="space-y-1.5">
                <Label htmlFor="status">Holati</Label>
                <Select
                  value={filters.status || "all"} // Ensure 'all' is handled
                  onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}
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

              {/* Rooms Filter */}
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

               {/* Floor Filter */}
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

              {/* Search by Room Number */}
              <div className="space-y-1.5">
                <Label htmlFor="search">Qidiruv (xonadon №)</Label>
                <Input
                  id="search"
                  placeholder="Xonadon raqami..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </div>

              {/* Price Filters */}
              <div className="space-y-1.5">
                <Label htmlFor="minPrice">Minimal narx (UZS)</Label>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder="Mas: 300000000"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                  min="0"
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

              {/* Area Filters */}
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

        {/* Apartments Grid / Loading / Empty State */}
        {loading ? (
          // Skeleton Loading Grid
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: pagination.pageSize }).map((_, i) => (
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
                    <Skeleton className="h-9 flex-1" /> {/* Adjusted skeleton height */}
                    <Skeleton className="h-9 flex-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : apartments.length === 0 ? (
          // Empty State Card
          <Card>
            <CardContent className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">Filtrlarga mos xonadonlar topilmadi.</p>
            </CardContent>
          </Card>
        ) : (
          // Apartments Grid
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {apartments.map((apartment) => (
                <Card
                  key={apartment.id}
                  className="overflow-hidden transition-shadow duration-200 hover:shadow-lg cursor-pointer flex flex-col" // Added flex flex-col
                  onClick={() => router.push(`/apartments/${apartment.id}`)} // Navigate on card click
                >
                  <CardContent className="p-4 space-y-2 flex-grow flex flex-col justify-between"> {/* Added flex-grow and structure */}
                    <div> {/* Content Part */}
                        <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="text-lg font-semibold">
                            № {apartment.room_number || 'N/A'}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                            {apartment.property?.name || apartment.object_name || "Noma'lum obyekt"}
                            </p>
                        </div>
                        {getStatusBadge(apartment.status)} {/* Use corrected function */}
                        </div>

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
                            {Number(apartment.price)
                                ? Number(apartment.price).toLocaleString("uz-UZ", { style: "currency", currency: "UZS", minimumFractionDigits: 0 })
                                : "Narx ko'rsatilmagan"}
                            </span>
                        </div>
                        {apartment.status !== "bosh" && apartment.client && (
                            <div className="flex items-center">
                            <User className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate" title={apartment.client?.name}>
                                {apartment.client?.name || "Noma'lum mijoz"}
                            </span>
                            </div>
                        )}
                        {apartment.status === "band" && apartment.reservation_date && (
                            <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="mr-1.5 h-3.5 w-3.5" />
                            <span>Band: {new Date(apartment.reservation_date).toLocaleDateString('uz-UZ')}</span>
                            </div>
                        )}
                         {apartment.status === "sotilgan" && apartment.sold_date && (
                            <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="mr-1.5 h-3.5 w-3.5" />
                            <span>Sotilgan: {new Date(apartment.sold_date).toLocaleDateString('uz-UZ')}</span>
                            </div>
                        )}
                        </div>
                    </div>

                    {/* --- CORRECTED Buttons block --- */}
                    <div className="mt-4 pt-3 border-t space-y-2"> {/* Vertical spacing */}
                      {/* Agar status "bosh" bo'lsa */}
                      {apartment.status === "bosh" && (
                        <>
                          {/* Band qilish tugmasi to'liq kenglikda */}
                          <Button
                            size="xs"
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black" // Kept yellow for reserve
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click event
                              router.push(`/apartments/${apartment.id}/reserve`);
                            }}
                          >
                            Band qilish
                          </Button>
                          {/* Tahrirlash va O'chirish tugmalari pastki qatorda */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="xs"
                              className="flex-1" // Takes half of the row
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card click event
                                router.push(`/apartments/edit/${apartment.id}`);
                              }}
                              aria-label="Tahrirlash"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="xs"
                              className="flex-1" // Takes half of the row
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card click event
                                deleteApartment(apartment.id);
                              }}
                              aria-label="O'chirish"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}

                      {/* Agar status "band" yoki "sotilgan" bo'lsa */}
                      {apartment.status !== "bosh" && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="xs"
                            className="flex-1" // Takes half of the width
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click event
                              router.push(`/apartments/edit/${apartment.id}`);
                            }}
                            aria-label="Tahrirlash"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="xs"
                            className="flex-1" // Takes half of the width
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click event
                              deleteApartment(apartment.id);
                            }}
                            aria-label="O'chirish"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {/* --- Buttons block end --- */}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
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