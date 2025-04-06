"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/main-nav";
import { Search } from "@/components/search";
import { UserNav } from "@/components/user-nav";
import { PlusCircle, Edit, Trash } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function PropertiesPage() {
  const router = useRouter();
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    total_apartments: "",
    floors: "",
    address: "",
    description: "",
    image: null,
  });

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${accessToken}`,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      setAccessToken(token);
    }
  }, []);

  const fetchAllObjects = async (url = "http://api.ahlan.uz/objects/") => {
    let allObjects = [];
    let nextUrl = url;

    try {
      while (nextUrl) {
        const response = await fetch(nextUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Sessiya tugagan, qayta kirish kerak");
          }
          throw new Error("Obyektlarni olishda xatolik");
        }

        const data = await response.json();
        allObjects = [...allObjects, ...(data.results || [])];
        nextUrl = data.next;
      }
      return allObjects;
    } catch (error) {
      throw error;
    }
  };

  const loadObjects = async () => {
    setLoading(true);
    try {
      const allObjects = await fetchAllObjects();
      setObjects(allObjects);
      setLoading(false);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.message || "Obyektlarni olishda xatolik yuz berdi",
        variant: "destructive",
      });
      setObjects([
        {
          id: 1,
          name: "Alisher",
          total_apartments: 30,
          floors: 4,
          address: "Kokand",
          description: "Yaxshi",
          image: null,
        },
      ]);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken === null) return;

    if (!accessToken) {
      toast({
        title: "Xatolik",
        description: "Tizimga kirish talab qilinadi",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    loadObjects();
  }, [accessToken, router]);

  const handleEdit = (object) => {
    setSelectedObject(object);
    setFormData({
      name: object.name,
      total_apartments: object.total_apartments,
      floors: object.floors,
      address: object.address,
      description: object.description,
      image: null, // Faylni qayta tanlash kerak
    });
    setOpenEditDialog(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("total_apartments", formData.total_apartments);
    formDataToSend.append("floors", formData.floors);
    formDataToSend.append("address", formData.address);
    formDataToSend.append("description", formData.description);
    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }

    try {
      const response = await fetch(`http://api.ahlan.uz/objects/${selectedObject.id}/`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error("Obyektni yangilashda xatolik yuz berdi");
      }

      toast({
        title: "Muvaffaqiyat",
        description: "Obyekt muvaffaqiyatli yangilandi",
      });
      setOpenEditDialog(false);
      loadObjects();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.message || "Obyektni yangilashda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Obyektni o'chirishni tasdiqlaysizmi?")) return;

    try {
      const response = await fetch(`http://api.ahlan.uz/objects/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Obyektni o'chirishda xatolik yuz berdi");
      }

      toast({
        title: "Muvaffaqiyat",
        description: "Obyekt muvaffaqiyatli o'chirildi",
      });
      loadObjects();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error.message || "Obyektni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Yuklanmoqda...</p>
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
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Obyektlar</h2>
          <Link href="/properties/add">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Yangi obyekt qo'shish
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {objects.map((object) => (
            <Card key={object.id} className="shadow-lg">
              <CardHeader>
                <img
                  src={object.image || "https://via.placeholder.com/300x150"}
                  alt={object.name}
                  className="w-full h-48 object-cover rounded-t-md"
                />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-xl font-semibold">{object.name}</CardTitle>
                <p className="text-sm text-gray-500">{object.address}</p>
                <p className="text-sm mt-2">
                  Umumiy xonadonlar: {object.total_apartments}
                </p>
                <p className="text-sm">Qavatlar soni: {object.floors}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => handleEdit(object)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Tahrirlash
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(object.id)}>
                  <Trash className="mr-2 h-4 w-4" />
                  O'chirish
                </Button>
                <Button variant="link">Batafsil</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Obyektni Tahrirlash</DialogTitle>
              <DialogDescription>Obyekt ma'lumotlarini yangilang</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nomi</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_apartments">Umumiy Xonadonlar</Label>
                <Input
                  id="total_apartments"
                  type="number"
                  value={formData.total_apartments}
                  onChange={(e) => setFormData({ ...formData, total_apartments: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floors">Qavatlar</Label>
                <Input
                  id="floors"
                  type="number"
                  value={formData.floors}
                  onChange={(e) => setFormData({ ...formData, floors: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Manzil</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Tavsif</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Rasm</Label>
                <Input
                  id="image"
                  type="file"
                  onChange={handleFileChange}
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
  );
}