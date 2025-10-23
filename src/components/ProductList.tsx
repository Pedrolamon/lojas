import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface Product {
  id: string
  name: string
  barcode?: string
  photo?: string
  costPrice: number
  sellingPrice: number
  location?: string
  expirationDate?: string
  minStock: number
  currentStock: number
  averageCost?: number
  investedValue?: number
  lastSaleDate?: string
}

const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    costPrice: '',
    sellingPrice: '',
    location: '',
    expirationDate: '',
    minStock: '',
    photo: null as File | null
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/products')
      setProducts(response.data)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData(prev => ({ ...prev, photo: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = new FormData()
      data.append('name', formData.name)
      data.append('barcode', formData.barcode)
      data.append('costPrice', formData.costPrice.toString())
      data.append('sellingPrice', formData.sellingPrice.toString())
      data.append('location', formData.location)
      data.append('expirationDate', formData.expirationDate)
      data.append('minStock', formData.minStock.toString())
      if (formData.photo) {
        data.append('photo', formData.photo)
      }

      await axios.post('http://localhost:3001/api/products', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setFormData({
        name: '',
        barcode: '',
        costPrice: '',
        sellingPrice: '',
        location: '',
        expirationDate: '',
        minStock: '',
        photo: null
      })
      setShowForm(false)
      fetchProducts()
    } catch (error) {
      console.error('Error creating product:', error)
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Products</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Product Name"
              value={formData.name}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              name="barcode"
              placeholder="Barcode"
              value={formData.barcode}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              type="number"
              name="costPrice"
              placeholder="Cost Price"
              value={formData.costPrice}
              onChange={handleInputChange}
              className="border p-2 rounded"
              step="0.01"
              required
            />
            <input
              type="number"
              name="sellingPrice"
              placeholder="Selling Price"
              value={formData.sellingPrice}
              onChange={handleInputChange}
              className="border p-2 rounded"
              step="0.01"
              required
            />
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={formData.location}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              type="date"
              name="expirationDate"
              value={formData.expirationDate}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              type="number"
              name="minStock"
              placeholder="Min Stock"
              value={formData.minStock}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            />
            <input
              type="file"
              name="photo"
              accept="image/*"
              onChange={handleFileChange}
              className="border p-2 rounded"
            />
          </div>
          <button
            type="submit"
            className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Product
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white p-4 rounded shadow">
            {product.photo && (
              <img
                src={`http://localhost:3001/uploads/${product.photo}`}
                alt={product.name}
                className="w-full h-32 object-cover rounded mb-2"
              />
            )}
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <p>Barcode: {product.barcode || 'N/A'}</p>
            <p>Stock: {product.currentStock}</p>
            <p>Min Stock: {product.minStock}</p>
            <p>Cost: ${product.costPrice}</p>
            <p>Selling: ${product.sellingPrice}</p>
            {product.location && <p>Location: {product.location}</p>}
            {product.expirationDate && <p>Expires: {new Date(product.expirationDate).toLocaleDateString()}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProductList
