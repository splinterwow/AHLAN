"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/main-nav"
import { Search } from "@/components/search"
import { UserNav } from "@/components/user-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDateRangePicker } from "@/components/date-range-picker"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from "recharts"
import { Download, FileText, Printer } from "lucide-react"

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<any[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string>("all")
  const [reportType, setReportType] = useState<string>("sales")

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      // Generate mock properties data
      const mockProperties = [
        { id: 1, name: "Navoiy 108K" },
        { id: 2, name: "Navoiy 108L" },
        { id: 3, name: "Baqachorsu" },
      ]

      setProperties(mockProperties)
      setLoading(false)
    }, 1000)
  }, [])

  // Mock data for sales report
  const salesData = [
    { name: "Yan", sales: 4000, target: 2400 },
    { name: "Fev", sales: 3000, target: 2400 },
    { name: "Mar", sales: 2000, target: 2400 },
    { name: "Apr", sales: 2780, target: 2400 },
    { name: "May", sales: 1890, target: 2400 },
    { name: "Iyun", sales: 2390, target: 2400 },
    { name: "Iyul", sales: 3490, target: 2400 },
    { name: "Avg", sales: 2000, target: 2400 },
    { name: "Sen", sales: 2780, target: 2400 },
    { name: "Okt", sales: 1890, target: 2400 },
    { name: "Noy", sales: 2390, target: 2400 },
    { name: "Dek", sales: 3490, target: 2400 },
  ]

  // Mock data for payments report
  const paymentsData = [
    { name: "Yan", paid: 4000, pending: 2400, overdue: 1000 },
    { name: "Fev", paid: 3000, pending: 1398, overdue: 800 },
    { name: "Mar", paid: 2000, pending: 9800, overdue: 1200 },
    { name: "Apr", paid: 2780, pending: 3908, overdue: 300 },
    { name: "May", paid: 1890, pending: 4800, overdue: 500 },
    { name: "Iyun", paid: 2390, pending: 3800, overdue: 700 },
    { name: "Iyul", paid: 3490, pending: 4300, overdue: 200 },
  ]

  // Mock data for expenses report
  const expensesData = [
    { name: "Qurilish materiallari", value: 35000 },
    { name: "Ishchi kuchi", value: 25000 },
    { name: "Jihozlar", value: 18000 },
    { name: "Kommunal xizmatlar", value: 8000 },
    { name: "Boshqa xarajatlar", value: 14000 },
  ]

  // Mock data for apartments status
  const apartmentsStatusData = [
    { name: "Sotilgan", value: 85, color: "#4ade80" },
    { name: "Band qilingan", value: 15, color: "#facc15" },
    { name: "Bo'sh", value: 20, color: "#3b82f6" },
  ]

  const COLORS = ["#4ade80", "#facc15", "#3b82f6", "#f43f5e", "#a855f7"]

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
          <h2 className="text-3xl font-bold tracking-tight">Hisobotlar</h2>
          <div className="flex items-center space-x-2">
            <CalendarDateRangePicker />
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Obyekt tanlang" />
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
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Chop etish
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Yuklab olish
            </Button>
          </div>
        </div>

        <Tabs defaultValue="sales" className="space-y-4" onValueChange={setReportType}>
          <TabsList>
            <TabsTrigger value="sales">Sotuvlar</TabsTrigger>
            <TabsTrigger value="payments">To'lovlar</TabsTrigger>
            <TabsTrigger value="expenses">Xarajatlar</TabsTrigger>
            <TabsTrigger value="apartments">Xonadonlar</TabsTrigger>
            <TabsTrigger value="clients">Mijozlar</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Jami sotuvlar</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$45,231.89</div>
                  <p className="text-xs text-muted-foreground">+20.1% o'tgan oyga nisbatan</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sotilgan xonadonlar</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+85</div>
                  <p className="text-xs text-muted-foreground">+10.1% o'tgan oyga nisbatan</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">O'rtacha narx</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$35,500</div>
                  <p className="text-xs text-muted-foreground">+5.2% o'tgan oyga nisbatan</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Yangi mijozlar</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+23</div>
                  <p className="text-xs text-muted-foreground">+12% o'tgan oyga nisbatan</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sotuvlar dinamikasi</CardTitle>
                <CardDescription>Oylar bo'yicha sotuvlar va maqsadlar</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={salesData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" name="Sotuvlar" fill="#3b82f6" />
                    <Bar dataKey="target" name="Maqsad" fill="#f43f5e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Jami to'lovlar</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$125,430.89</div>
                  <p className="text-xs text-muted-foreground">+15.3% o'tgan oyga nisbatan</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">To'langan</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">$98,230.50</div>
                  <p className="text-xs text-muted-foreground">78.3% jami to'lovlardan</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Muddati o'tgan</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">$12,430.20</div>
                  <p className="text-xs text-muted-foreground">9.9% jami to'lovlardan</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>To'lovlar dinamikasi</CardTitle>
                <CardDescription>Oylar bo'yicha to'lovlar holati</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={paymentsData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="paid" name="To'langan" stackId="a" fill="#4ade80" />
                    <Bar dataKey="pending" name="Kutilmoqda" stackId="a" fill="#facc15" />
                    <Bar dataKey="overdue" name="Muddati o'tgan" stackId="a" fill="#f43f5e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Xarajatlar taqsimoti</CardTitle>
                  <CardDescription>Kategoriyalar bo'yicha xarajatlar</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="h-80 w-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expensesData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {expensesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Xarajatlar statistikasi</CardTitle>
                  <CardDescription>Jami xarajatlar: $100,000</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {expensesData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span>{item.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">${item.value.toLocaleString()}</span>
                          <span className="text-muted-foreground text-sm">
                            {Math.round((item.value / 100000) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Oylik xarajatlar</CardTitle>
                <CardDescription>Oylar bo'yicha xarajatlar dinamikasi</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={salesData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sales" name="Xarajatlar" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apartments" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Xonadonlar holati</CardTitle>
                  <CardDescription>Xonadonlarning joriy holati</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="h-80 w-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={apartmentsStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {apartmentsStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Xonadonlar statistikasi</CardTitle>
                  <CardDescription>Jami xonadonlar: 120</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {apartmentsStatusData.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                            <span>{item.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{item.value}</span>
                            <span className="text-muted-foreground text-sm">
                              {Math.round((item.value / 120) * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${Math.round((item.value / 120) * 100)}%`,
                              backgroundColor: item.color,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Xonadonlar sotilishi</CardTitle>
                <CardDescription>Oylar bo'yicha sotilgan xonadonlar soni</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={salesData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" name="Sotilgan xonadonlar" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mijozlar statistikasi</CardTitle>
                <CardDescription>Mijozlar haqida umumiy ma'lumotlar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Jami mijozlar</p>
                    <p className="text-2xl font-bold">120</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Yangi mijozlar (oy)</p>
                    <p className="text-2xl font-bold">23</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Qarzdor mijozlar</p>
                    <p className="text-2xl font-bold text-red-500">15</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">O'rtacha xarid</p>
                    <p className="text-2xl font-bold">$35,500</p>
                  </div>
                </div>

                <div className="mt-8">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={salesData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="sales" name="Yangi mijozlar" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            PDF formatida saqlash
          </Button>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Excel formatida saqlash
          </Button>
        </div>
      </div>
    </div>
  )
}

