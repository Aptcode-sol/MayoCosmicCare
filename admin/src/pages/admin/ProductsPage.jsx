import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { SkeletonGrid } from '../../components/SkeletonCard';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        name: '', price: 0, bv: 0, stock: 0, description: '', imageUrl: '',
        directBonus: 3000, matchingBonus: 2000, dailyCap: 40000, taxPercent: 5, adminChargePercent: 5
    });

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/admin/products');
            setProducts(res.data.products || []);
        } catch (err) {
            toast.error('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const closeProductModal = () => {
        setShowProductForm(false);
        setEditingProduct(null);
        setProductForm({
            name: '', price: 0, bv: 0, stock: 0, description: '', imageUrl: '',
            directBonus: 3000, matchingBonus: 2000, dailyCap: 40000, taxPercent: 5, adminChargePercent: 5
        });
    };

    const openEditProduct = (product) => {
        setEditingProduct(product);
        setProductForm({
            name: product.name,
            price: product.price,
            bv: product.bv,
            stock: product.stock,
            description: product.description || '',
            imageUrl: product.imageUrl || '',
            directBonus: product.directBonus ?? 3000,
            matchingBonus: product.matchingBonus ?? 2000,
            dailyCap: product.dailyCap ?? 40000,
            taxPercent: product.taxPercent ?? 5,
            adminChargePercent: product.adminChargePercent ?? 5
        });
        setShowProductForm(true);
    };

    const createProduct = async () => {
        try {
            if (editingProduct) {
                await api.put(`/api/admin/products/${editingProduct.id}`, productForm);
                toast.success('Product updated');
            } else {
                await api.post('/api/admin/products', productForm);
                toast.success('Product created');
            }
            closeProductModal();
            fetchProducts();
        } catch (err) {
            toast.error(editingProduct ? 'Failed to update product' : 'Failed to create product');
        }
    };

    const deleteProduct = async (id) => {
        if (!confirm('Delete this product?')) return;
        try {
            await api.delete(`/api/admin/products/${id}`);
            toast.success('Product deleted');
            fetchProducts();
        } catch (err) {
            toast.error('Failed to delete product');
        }
    };

    if (loading) {
        return <SkeletonGrid count={6} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Inventory Management</h2>
                <button
                    onClick={() => { setEditingProduct(null); setProductForm({ name: '', price: 0, bv: 0, stock: 0, description: '', imageUrl: '', directBonus: 3000, matchingBonus: 2000, dailyCap: 40000, taxPercent: 5, adminChargePercent: 5 }); setShowProductForm(true); }}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-colors text-sm font-medium"
                >
                    Add Product
                </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {products.map((product) => (
                    <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                        <div className="h-40 bg-gray-100 relative group">
                            <img
                                src={product.imageUrl || 'https://via.placeholder.com/400x300'}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    onClick={() => openEditProduct(product)}
                                    className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-900 rounded-lg text-sm font-medium"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => deleteProduct(product.id)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-medium text-gray-900">{product.name}</h3>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                                    Stock: {product.stock}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-3">{product.description}</p>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-400">Price</p>
                                    <p className="text-sm font-semibold text-gray-900">₹{product.price}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400">BV</p>
                                    <p className="text-sm font-semibold text-indigo-600">{product.bv}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showProductForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeProductModal}>
                    <div className="w-full max-w-2xl bg-white rounded-2xl p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Product Name</label>
                                <input
                                    type="text"
                                    placeholder="Product name"
                                    value={productForm.name}
                                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                                <input
                                    type="number"
                                    placeholder="Price"
                                    value={productForm.price}
                                    onChange={(e) => setProductForm({ ...productForm, price: +e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">BV</label>
                                <input
                                    type="number"
                                    placeholder="BV"
                                    value={productForm.bv}
                                    onChange={(e) => setProductForm({ ...productForm, bv: +e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Stock</label>
                                <input
                                    type="number"
                                    placeholder="Stock"
                                    value={productForm.stock}
                                    onChange={(e) => setProductForm({ ...productForm, stock: +e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                                <textarea
                                    placeholder="Description"
                                    value={productForm.description}
                                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    value={productForm.imageUrl}
                                    onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Direct Bonus</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="Direct Bonus"
                                    value={productForm.directBonus}
                                    onChange={(e) => setProductForm({ ...productForm, directBonus: +e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Matching Bonus</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="Matching Bonus"
                                    value={productForm.matchingBonus}
                                    onChange={(e) => setProductForm({ ...productForm, matchingBonus: +e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Daily Cap</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="Daily Cap"
                                    value={productForm.dailyCap}
                                    onChange={(e) => setProductForm({ ...productForm, dailyCap: +e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Tax Percent</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="Tax Percent"
                                    value={productForm.taxPercent}
                                    onChange={(e) => setProductForm({ ...productForm, taxPercent: +e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Admin Charge (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="5"
                                    value={productForm.adminChargePercent}
                                    onChange={(e) => setProductForm({ ...productForm, adminChargePercent: +e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={closeProductModal}
                                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createProduct}
                                className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium"
                            >
                                {editingProduct ? 'Update Product' : 'Create Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
