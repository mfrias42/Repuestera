import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '../../context/CartContext';

const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('debe inicializar con carrito vacío', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.itemCount).toBe(0);
  });

  it('debe agregar producto al carrito', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const product = { id: 1, nombre: 'Producto', precio: 1000, stock: 10 };
    
    act(() => {
      result.current.addToCart(product, 2);
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.itemCount).toBe(2);
    expect(result.current.total).toBe(2000);
  });

  it('debe actualizar cantidad si el producto ya está en el carrito', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const product = { id: 1, nombre: 'Producto', precio: 1000, stock: 10 };
    
    act(() => {
      result.current.addToCart(product, 2);
      result.current.addToCart(product, 3);
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.itemCount).toBe(5);
  });

  it('debe lanzar error cuando se intenta agregar producto sin stock', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const product = { id: 1, nombre: 'Producto', precio: 1000, stock: 0 };
    
    expect(() => {
      act(() => {
        result.current.addToCart(product);
      });
    }).toThrow('Producto sin stock');
  });

  it('debe lanzar error cuando se intenta agregar más cantidad que el stock disponible', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const product = { id: 1, nombre: 'Producto', precio: 1000, stock: 5 };
    
    act(() => {
      result.current.addToCart(product, 3);
    });
    
    expect(() => {
      act(() => {
        result.current.addToCart(product, 3);
      });
    }).toThrow();
  });

  it('debe eliminar producto del carrito', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const product = { id: 1, nombre: 'Producto', precio: 1000, stock: 10 };
    
    act(() => {
      result.current.addToCart(product, 2);
      result.current.removeFromCart(1);
    });
    
    expect(result.current.items).toHaveLength(0);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it('debe actualizar cantidad de un producto', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const product = { id: 1, nombre: 'Producto', precio: 1000, stock: 10 };
    
    act(() => {
      result.current.addToCart(product, 2);
      result.current.updateQuantity(1, 5);
    });
    
    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.itemCount).toBe(5);
    expect(result.current.total).toBe(5000);
  });

  it('debe eliminar producto cuando la cantidad se actualiza a 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const product = { id: 1, nombre: 'Producto', precio: 1000, stock: 10 };
    
    act(() => {
      result.current.addToCart(product, 2);
      result.current.updateQuantity(1, 0);
    });
    
    expect(result.current.items).toHaveLength(0);
  });

  it('debe vaciar el carrito', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const product1 = { id: 1, nombre: 'Producto 1', precio: 1000, stock: 10 };
    const product2 = { id: 2, nombre: 'Producto 2', precio: 500, stock: 5 };
    
    act(() => {
      result.current.addToCart(product1, 2);
      result.current.addToCart(product2, 1);
      result.current.clearCart();
    });
    
    expect(result.current.items).toHaveLength(0);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it('debe obtener cantidad de un producto', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const product = { id: 1, nombre: 'Producto', precio: 1000, stock: 10 };
    
    act(() => {
      result.current.addToCart(product, 3);
    });
    
    expect(result.current.getItemQuantity(1)).toBe(3);
    expect(result.current.getItemQuantity(999)).toBe(0);
  });

  it('debe verificar si un producto está en el carrito', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const product = { id: 1, nombre: 'Producto', precio: 1000, stock: 10 };
    
    act(() => {
      result.current.addToCart(product, 1);
    });
    
    expect(result.current.isInCart(1)).toBe(true);
    expect(result.current.isInCart(999)).toBe(false);
  });

  it('debe cargar carrito desde localStorage', () => {
    const savedCart = [{ id: 1, nombre: 'Producto', precio: 1000, stock: 10, quantity: 2 }];
    localStorage.setItem('cart', JSON.stringify(savedCart));
    
    const { result } = renderHook(() => useCart(), { wrapper });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
  });

  it('debe guardar carrito en localStorage cuando cambia', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const product = { id: 1, nombre: 'Producto', precio: 1000, stock: 10 };
    
    act(() => {
      result.current.addToCart(product, 2);
    });
    
    const savedCart = JSON.parse(localStorage.getItem('cart'));
    expect(savedCart).toHaveLength(1);
    expect(savedCart[0].quantity).toBe(2);
  });
});

