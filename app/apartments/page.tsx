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
import { Home, DollarSign, User, Calendar, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [properties, setProperties] = useState<any[]>([]);
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
    property: propertyIdParam || "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 20,
  });

  const API_BASE_URL = "http://api.ahlan.uz";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast({
          title: "Xatolik",
          description: "Avtorizatsiya qilinmagan. Iltimos, tizimga kiring.",
          variant: "destructive",
        });
        router.push("/login");
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

  const fetchProperties = async () => {
    if (!accessToken) return;

    let allProperties: any[] = [];
    let currentPage = 1;
    const pageSize = 20;
    let totalPages = 1;

    try {
      while (currentPage <= totalPages) {
        const url = `${API_BASE_URL}/objects/?page=${currentPage}&page_size=${pageSize}`;
        const response = await fetch(url, {
          method: "GET",
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Obyektlarni olishda xatolik (${response.status})`);
        }

        const data = await response.json();
        allProperties = [...allProperties, ...(data.results || data)];
        totalPages = Math.ceil(data.count / pageSize);
        currentPage += 1;
      }

      setProperties(allProperties);
      console.log("Obyektlar ro‘yxati:", allProperties);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: (error as Error).message || "Obyektlarni yuklashda xatolik.",
        variant: "destructive",
      });
    }
  };

  const fetchApartments = async (page = 1) => {
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
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.property && filters.property !== "all") {
        console.log("Tanlangan obyekt ID:", filters.property);
        queryParams.append("object", filters.property); // "object_id" o‘rniga "object"
      }
      if (propertyIdParam && !filters.property) {
        console.log("URL parametridan obyekt ID:", propertyIdParam);
        queryParams.append("object", propertyIdParam); // "object_id" o‘rniga "object"
      }

      queryParams.append("page", page.toString());
      queryParams.append("page_size", pagination.pageSize.toString());

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      console.log("So‘rov URL:", url);
      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("access_token");
          setAccessToken(null);
          toast({
            title: "Sessiya tugadi",
            description: "Iltimos, tizimga qayta kiring.",
            variant: "destructive",
          });
          router.push("/login");
          return;
        }
        throw new Error(`Xonadonlarni olishda xatolik (${response.status})`);
      }

      const data = await response.json();
      console.log("Xonadonlar ro‘yxati:", data.results || data);
      setApartments(data.results || []);
      setPagination((prev) => ({
        ...prev,
        currentPage: page,
        totalPages: Math.ceil(data.count / prev.pageSize),
      }));
    } catch (error) {
      toast({
        title: "Xatolik",
        description: (error as Error).message || "Xonadonlarni yuklashda xatolik.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteApartment = async (id: number) => {
    if (!accessToken) return;
    if (!window.confirm("Haqiqatan ham bu xonadonni o‘chirmoqchimisiz?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/apartments/${id}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("access_token");
          setAccessToken(null);
          toast({
            title: "Sessiya tugadi",
            description: "Iltimos, tizimga qayta kiring.",
            variant: "destructive",
          });
          router.push("/login");
          return;
        }
        throw new Error(`Xonadonni o‘chirishda xatolik (${response.status})`);
      }

      toast({
        title: "Muvaffaqiyat",
        description: "Xonadon muvaffaqiyatli o‘chirildi.",
      });
      fetchApartments(pagination.currentPage);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: (error as Error).message || "Xonadonni o‘chirishda xatolik.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchProperties();
      fetchApartments(1);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken && properties.length > 0) {
      fetchApartments(1);
    }
  }, [filters, propertyIdParam, accessToken, properties]);

  const handleFilterChange = (name: string, value: string) => {
    console.log(`Filtr o‘zgardi: ${name} = ${value}`);
    setFilters((prev) => ({
      ...prev,
      [name]: value === "all" ? "" : value,
    }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchApartments(newPage);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "bosh":
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Bo'sh</Badge>;
      case "band":
        return <Badge className="bg-red-500 hover:bg-red-600 text-white">Band</Badge>;
      case "sotilgan":
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Sotilgan</Badge>;
      default:
        return <Badge variant="secondary">{status || "Noma'lum"}</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <div className="border-b bg-background">
        <div className="flex h-16 items-center px-4 md:px-6">
          <MainNav className="mx-6 hidden md:flex" />
          <div className="ml-auto flex items-center space-x-4">
            <Search />
            <UserNav />
          </div>
        </div>
      </div>

      <main className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Xonadonlar</h2>
          <Link href="/apartments/add" passHref>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yangi xonadon
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5">
              <div className="space-y-1.5">
                <Label htmlFor="status">Holati</Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => handleFilterChange("status", value)}
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

              <div className="space-y-1.5">
                <Label htmlFor="rooms">Xonalar soni</Label>
                <Select
                  value={filters.rooms || "all"}
                  onValueChange={(value) => handleFilterChange("rooms", value)}
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

              <div className="space-y-1.5">
                <Label htmlFor="floor">Qavat</Label>
                <Select
                  value={filters.floor || "all"}
                  onValueChange={(value) => handleFilterChange("floor", value)}
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

              <div className="space-y-1.5">
                <Label htmlFor="search">Qidiruv (xonadon №)</Label>
                <Input
                  id="search"
                  placeholder="Xonadon raqami..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="property">Obyekt</Label>
                <Select
                  value={filters.property || "all"}
                  onValueChange={(value) => handleFilterChange("property", value)}
                >
                  <SelectTrigger id="property">
                    <SelectValue placeholder="Barcha obyektlar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha obyektlar</SelectItem>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id.toString()}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="minPrice">Minimal narx (USD)</Label>
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
                <Label htmlFor="maxPrice">Maksimal narx (USD)</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  placeholder="Mas: 1000000000"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                  min="0"
                />
              </div>

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

        {loading ? (
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
                  <div className="mt-4 pt-3 border-t">
                    <Skeleton className="h-9 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : apartments.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">Filtrlarga mos xonadonlar topilmadi.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {apartments.map((apartment) => (
                <Card
                  key={apartment.id}
                  className="overflow-hidden transition-shadow duration-200 hover:shadow-lg cursor-pointer"
                  onClick={() => router.push(`/apartments/${apartment.id}`)}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold">
                          № {apartment.room_number || "N/A"}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {apartment.object_name || "Noma'lum obyekt"}
                        </p>
                      </div>
                      {getStatusBadge(apartment.status)}
                    </div>

                    <div className="space-y-1 text-sm text-foreground">
                      <div className="flex items-center">
                        <Home className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>
                          {apartment.rooms || "?"} xona, {apartment.area || "?"} m²,{" "}
                          {apartment.floor || "?"} - qavat
                        </span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium">
                          {Number(apartment.price)
                            ? Number(apartment.price).toLocaleString("us-US", {
                                style: "currency",
                                currency: "USD",
                                minimumFractionDigits: 0,
                              })
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
                          <span>Band: {new Date(apartment.reservation_date).toLocaleDateString("us-US")}</span>
                        </div>
                      )}
                      {apartment.status === "sotilgan" && apartment.sold_date && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="mr-1.5 h-3.5 w-3.5" />
                          <span>Sotilgan: {new Date(apartment.sold_date).toLocaleDateString("us-US")}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t">
                      {apartment.status === "bosh" ? (
                        <div className="flex space-x-2">
                          <Button
                            size="default"
                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-md shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/apartments/${apartment.id}/reserve`);
                            }}
                          >
                            Band qilish
                          </Button>
                          <Button
                            size="default"
                            variant="destructive"
                            className="flex-1 font-semibold rounded-md shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteApartment(apartment.id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> O‘chirish
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="default"
                          variant="destructive"
                          className="w-full font-semibold rounded-md shadow-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteApartment(apartment.id);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> O‘chirish
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

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