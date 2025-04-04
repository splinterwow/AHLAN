"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/main-nav"
import { Search } from "@/components/search"
import { UserNav } from "@/components/user-nav"
import { PropertyList } from "@/components/property-list"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function PropertiesPage() {
  const router = useRouter()
  const [objects, setObjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [accessToken, setAccessToken] = useState(null)

  const getAuthHeaders = () => ({
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`,
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token")
      setAccessToken(token)
    }
  }, [])

  const fetchAllObjects = async (url = "http://api.ahlan.uz/objects/") => {
    let allObjects = []
    let nextUrl = url

    try {
      while (nextUrl) {
        const response = await fetch(nextUrl, {
          method: "GET",
          headers: getAuthHeaders(),
        })

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Sessiya tugagan, qayta kirish kerak")
          }
          throw new Error("Obyektlarni olishda xatolik")
        }

        const data = await response.json()
        allObjects = [...allObjects, ...(data.results || [])]
        nextUrl = data.next
      }
      return allObjects
    } catch (error) {
      throw error
    }
  }

  useEffect(() => {
    if (accessToken === null) return

    if (!accessToken) {
      toast({
        title: "Xatolik",
        description: "Tizimga kirish talab qilinadi",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    const loadObjects = async () => {
      setLoading(true)
      try {
        const allObjects = await fetchAllObjects()
        setObjects(allObjects)
        setLoading(false)
      } catch (error) {
        toast({
          title: "Xatolik",
          description: error.message || "Obyektlarni olishda xatolik yuz berdi",
          variant: "destructive",
        })
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
        ])
        setLoading(false)
      }
    }

    loadObjects()
  }, [accessToken, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Yuklanmoqda...</p>
        </div>
      </div>
    )
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
        <div className="space-y-4">
          <PropertyList objects={objects} />
        </div>
      </div>
    </div>
  )
}