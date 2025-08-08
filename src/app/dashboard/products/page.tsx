"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Package, Yen } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const productSchema = z.object({
  name: z.string().min(1, "商品名を入力してください"),
  description: z.string().min(1, "商品説明を入力してください"),
  price: z.string().min(1, "価格を入力してください"),
  stock: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

export default function ProductsPage() {
  const { data: session } = useSession()
  const [products, setProducts] = useState([])
  const [exhibitors, setExhibitors] = useState([])
  const [selectedExhibitor, setSelectedExhibitor] = useState("")
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  })

  useEffect(() => {
    if (session?.user?.id) {
      fetchExhibitors()
    }
  }, [session])

  useEffect(() => {
    if (selectedExhibitor) {
      fetchProducts()
    }
  }, [selectedExhibitor])

  const fetchExhibitors = async () => {
    try {
      const response = await fetch("/api/exhibitors/my")
      if (response.ok) {
        const data = await response.json()
        setExhibitors(data)
        if (data.length > 0) {
          setSelectedExhibitor(data[0].id)
        }
      }
    } catch (error) {
      console.error("Failed to fetch exhibitors:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    if (!selectedExhibitor) return

    try {
      const response = await fetch(`/api/exhibitors/${selectedExhibitor}/products`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : "/api/products"
      
      const method = editingProduct ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          exhibitorId: selectedExhibitor,
          price: parseInt(data.price),
          stock: data.stock ? parseInt(data.stock) : null,
        }),
      })

      if (response.ok) {
        await fetchProducts()
        setIsDialogOpen(false)
        setEditingProduct(null)
        reset()
      }
    } catch (error) {
      console.error("Failed to save product:", error)
    }
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    setValue("name", product.name)
    setValue("description", product.description)
    setValue("price", product.price.toString())
    setValue("stock", product.stock?.toString() || "")
    setIsDialogOpen(true)
  }

  const handleDelete = async (productId: string) => {
    if (confirm("この商品を削除してもよろしいですか？")) {
      try {
        const response = await fetch(`/api/products/${productId}`, {
          method: "DELETE",
        })
        if (response.ok) {
          await fetchProducts()
        }
      } catch (error) {
        console.error("Failed to delete product:", error)
      }
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingProduct(null)
    reset()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (exhibitors.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">出展者登録が必要です</h2>
            <p className="text-gray-600 mb-4">
              商品を管理するには、まずイベントに出展者として登録してください
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">商品管理</h1>
          <p className="text-gray-600">出展商品の登録・管理</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              商品追加
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "商品編集" : "商品追加"}
              </DialogTitle>
              <DialogDescription>
                商品の詳細情報を入力してください
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">商品名 *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="商品名を入力"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">商品説明 *</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="商品の詳細な説明"
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">価格 (円) *</Label>
                    <Input
                      id="price"
                      type="number"
                      {...register("price")}
                      placeholder="1000"
                    />
                    {errors.price && (
                      <p className="text-sm text-red-600">{errors.price.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="stock">在庫数</Label>
                    <Input
                      id="stock"
                      type="number"
                      {...register("stock")}
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  キャンセル
                </Button>
                <Button type="submit">
                  {editingProduct ? "更新" : "追加"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 出展者選択 */}
      {exhibitors.length > 1 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Label htmlFor="exhibitor">出展者を選択</Label>
            <select
              id="exhibitor"
              value={selectedExhibitor}
              onChange={(e) => setSelectedExhibitor(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
            >
              {exhibitors.map((exhibitor: any) => (
                <option key={exhibitor.id} value={exhibitor.id}>
                  {exhibitor.businessName || exhibitor.name} - {exhibitor.event?.title}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      {/* 商品一覧 */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">商品がありません</h3>
            <p className="text-gray-600 mb-4">
              最初の商品を登録してみましょう
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product: any) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription className="text-lg font-semibold text-primary mt-2">
                      ¥{product.price.toLocaleString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  {product.description}
                </p>
                {product.stock && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span>在庫: {product.stock}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}