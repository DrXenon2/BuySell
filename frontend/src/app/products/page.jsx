import Link from 'next/link'

const sampleProducts = [
  { id: 1, name: 'Wireless Headphones', price: 99.99, category: 'Electronics', image: '/images/products/placeholder.jpg' },
  { id: 2, name: 'Smart Watch', price: 199.99, category: 'Electronics', image: '/images/products/placeholder.jpg' },
  { id: 3, name: 'Laptop Bag', price: 49.99, category: 'Accessories', image: '/images/products/placeholder.jpg' },
  { id: 4, name: 'Portable Charger', price: 29.99, category: 'Electronics', image: '/images/products/placeholder.jpg' },
  { id: 5, name: 'Phone Case', price: 19.99, category: 'Accessories', image: '/images/products/placeholder.jpg' },
  { id: 6, name: 'Bluetooth Speaker', price: 79.99, category: 'Electronics', image: '/images/products/placeholder.jpg' },
]

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-indigo-600">Buy-Sell Platform</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/products" className="text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                Products
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                Login
              </Link>
              <Link href="/register" className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium">
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
          <p className="mt-2 text-gray-600">Browse our selection of products</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sampleProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">Product Image</span>
              </div>
              <div className="p-4">
                <span className="text-xs font-semibold text-indigo-600">{product.category}</span>
                <h3 className="mt-1 text-lg font-semibold text-gray-900">{product.name}</h3>
                <p className="mt-2 text-2xl font-bold text-indigo-600">${product.price}</p>
                <Link 
                  href={`/products/${product.id}`}
                  className="mt-4 block w-full bg-indigo-600 text-white text-center py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
