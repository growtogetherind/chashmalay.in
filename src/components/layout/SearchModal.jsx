import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getProducts } from '../../lib/firebase';
import './SearchModal.css';

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) setQuery(''); // Reset query when modal closes
    if (isOpen && products.length === 0) {
      getProducts().then(({ data }) => setProducts(data || []));
    }
  }, [isOpen, products.length]);

  const handleSearch = () => {
    if (!query.trim()) return;
    // Navigate to eyeglasses with search param, close modal
    navigate(`/category/eyeglasses?q=${encodeURIComponent(query.trim())}`);
    onClose();
  };

  const trendingSearches = ['Round Eyeglasses', 'Blue Light Lenses', 'Aviator Sunglasses', 'Contact Lenses'];

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    ).slice(0, 5);
  }, [query, products]);

  if (!isOpen) return null;

  return (
    <div className="search-overlay animate-fade-in" onClick={onClose}>
      <div className="search-container animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="search-header">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={24} />
            <input
              type="text"
              placeholder="Search by brand, style, or category..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="clear-search-btn" aria-label="Clear search">
                <X size={16} />
              </button>
            )}
          </div>
          <button className="close-search" onClick={onClose}><X size={28} /></button>
        </div>

        <div className="search-results-area">
          {query.length > 0 ? (
            <div className="search-results">
              <p className="results-label">Searching for "{query}"...</p>
              {searchResults.length > 0 ? (
                searchResults.map(product => (
                  <div key={product.id} className="mock-result-item cursor-pointer" onClick={() => { onClose(); navigate(`/product/${product.id}`); }}>
                    <div className="result-img" style={{ backgroundImage: `url(${product.frame_image})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}></div>
                    <div className="result-info">
                       <h4>{product.name}</h4>
                       <p className="text-xs text-gray-500">{product.brand} - ₹{product.price}</p>
                    </div>
                    <ArrowRight size={20} className="text-gray-400" />
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-sm font-bold text-gray-400">No matching frames found.</p>
              )}
            </div>
          ) : (
            <div className="search-suggestions">
              <h3>Trending Searches</h3>
              <div className="trending-chips">
                {trendingSearches.map(item => (
                  <button key={item} className="trending-chip" onClick={() => setQuery(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="quick-links">
             <h3>Quick Links</h3>
             <div className="quick-grid">
               <Link to="/category/eyeglasses" onClick={onClose}>Eyeglasses</Link>
               <Link to="/category/sunglasses" onClick={onClose}>Sunglasses</Link>
               <Link to="/category/contacts" onClick={onClose}>Contact Lenses</Link>
               <Link to="/category/special-power" onClick={onClose}>Special Power</Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
