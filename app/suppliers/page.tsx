"use client";

import type React from "react";
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
import { Plus, Eye, Edit, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

// Backenddan kelgan ma'lumotlarga mos interfeys
interface Supplier {
  id: number;
  company_name: string;
  contact_person_name: string;
  phone_number: string;
  email: string;
  address: string;
  description: string;
  balance: string; // Backendda "0.00" kabi string sifatida kelmoqda
}

const SuppliersPage = () => {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    company_name: "",
    contact_person_name: "",
    phone_number: "",
    email: "",
    address: "",
    description: "",
  });

  const API_URL = "http://api.ahlan.uz/suppliers/";

  // Ma'lumotlarni API dan olish (GET)
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Agar API token talab qilsa: "Authorization": "Bearer YOUR_API_TOKEN",
          },
        });
        if (!response.ok) throw new Error("Ma'lumotlarni olishda xatolik");
        const data = await response.json();

        // API javobidan "results" massivini olish
        if (data && Array.isArray(data.results)) {
          setSuppliers(data.results);
        } else {
          console.error("API dan kutilmagan formatdagi ma'lumot keldi:", data);
          setSuppliers([]);
          toast({ title: "Xatolik", description: "API ma'lumotlari noto'g'ri formatda" });
        }
      } catch (error) {
        console.error("Xatolik:", error);
        setSuppliers([]);
        toast({ title: "Xatolik", description: "Ma'lumotlarni yuklashda muammo yuz berdi" });
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  // Formadagi o'zgarishlarni boshqarish
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Yangi yetkazib beruvchi qo'shish yoki tahrirlash (POST yoki PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editId ? `${API_URL}${editId}/` : API_URL;
      const method = editId ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          // "Authorization": "Bearer YOUR_API_TOKEN",
        },
        body: JSON.stringify({ ...formData, balance: "0.00" }), // Backendga moslashtirildi
      });
      if (!response.ok) throw new Error("Saqlashda xatolik");
      const updatedSupplier = await response.json();

      if (editId) {
        setSuppliers((prev) =>
          prev.map((supplier) => (supplier.id === editId ? updatedSupplier : supplier))
        );
        toast({ title: "Yangilandi", description: "Yetkazib beruvchi muvaffaqiyatli yangilandi" });
      } else {
        setSuppliers((prev) => [updatedSupplier, ...prev]);
        toast({ title: "Qo'shildi", description: "Yangi yetkazib beruvchi qo'shildi" });
      }
      resetForm();
    } catch (error) {
      console.error("Xatolik:", error);
      toast({ title: "Xatolik", description: "Ma'lumotlarni saqlashda muammo yuz berdi" });
    }
  };

  // Yetkazib beruvchini o'chirish (DELETE)
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}${id}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          // "Authorization": "Bearer YOUR_API_TOKEN",
        },
      });
      if (!response.ok) throw new Error("O'chirishda xatolik");
      setSuppliers((prev) => prev.filter((supplier) => supplier.id !== id));
      toast({ title: "O'chirildi", description: "Yetkazib beruvchi muvaffaqiyatli o'chirildi" });
    } catch (error) {
      console.error("Xatolik:", error);
      toast({ title: "Xatolik", description: "O'chirishda muammo yuz berdi" });
    }
  };

  // Tahrirlash uchun formani to'ldirish
  const handleEdit = (supplier: Supplier) => {
    setEditId(supplier.id);
    setFormData({
      company_name: supplier.company_name,
      contact_person_name: supplier.contact_person_name,
      phone_number: supplier.phone_number,
      email: supplier.email,
      address: supplier.address,
      description: supplier.description,
    });
    setOpen(true);
  };

  // Formani tozalash
  const resetForm = () => {
    setFormData({
      company_name: "",
      contact_person_name: "",
      phone_number: "",
      email: "",
      address: "",
      description: "",
    });
    setEditId(null);
    setOpen(false);
  };

  // Qidiruv bo'yicha filtrlangan yetkazib beruvchilar
  const filteredSuppliers = suppliers.filter((supplier) =>
    [supplier.company_name, supplier.contact_person_name, supplier.phone_number].some((field) =>
      field.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="text-3xl font-bold tracking-tight">Yetkazib beruvchilar</h2>
          <Dialog open={open} onOpenChange={(isOpen) => !isOpen && resetForm()}>
            <DialogTrigger asChild>
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Yangi yetkazib beruvchi qo‘shish
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editId ? "Yetkazib beruvchini tahrirlash" : "Yangi yetkazib beruvchi qo‘shish"}
                  </DialogTitle>
                  <DialogDescription>
                    Yetkazib beruvchi ma'lumotlarini kiriting yoki yangilang
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Kompaniya nomi</Label>
                      <Input
                        id="company_name"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_person_name">Aloqa shaxsi</Label>
                      <Input
                        id="contact_person_name"
                        name="contact_person_name"
                        value={formData.contact_person_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Telefon</Label>
                      <Input
                        id="phone_number"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="address">Manzil</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="description">Tavsif</Label>
                      <Input
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Saqlash</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Yetkazib beruvchilarni qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Tozalash
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-muted-foreground">Yetkazib beruvchilar ma'lumotlari yuklanmoqda...</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kompaniya nomi</TableHead>
                        <TableHead>Aloqa shaxsi</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Balans</TableHead>
                        <TableHead className="text-right">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSuppliers.length > 0 ? (
                        filteredSuppliers.map((supplier) => (
                          <TableRow key={supplier.id}>
                            <TableCell className="font-medium">{supplier.company_name}</TableCell>
                            <TableCell>{supplier.contact_person_name}</TableCell>
                            <TableCell>{supplier.phone_number}</TableCell>
                            <TableCell>{supplier.email}</TableCell>
                            <TableCell>
                              {parseFloat(supplier.balance) >= 0 ? (
                                <span className="text-green-600">
                                  ${parseFloat(supplier.balance).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-red-600">
                                  -${Math.abs(parseFloat(supplier.balance)).toLocaleString()}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => router.push(`/suppliers/${supplier.id}`)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier.id)}>
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            Yetkazib beruvchilar topilmadi
                          </TableCell>
                        </TableRow>
                      )}
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
};

export default SuppliersPage;