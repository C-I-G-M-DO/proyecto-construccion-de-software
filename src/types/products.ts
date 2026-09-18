

export type Producto = {
  _id: string;
  nombre: string;
  precios: Precio[]; //  array
  stock: number;
  equivalenciaPaquete?: number;
  imagen: string;
};

 export type Precio = {
  tipo: "unidad" | "libra" | "paquete";
  valor: number;
  equivalencia?: number; // 👈 SOLO para paquetes
};

export type CartItem = {
  id: string; // id del item en carrito
  productoId: string; // 🔥 id REAL del producto
  nombre: string;
  tipo: "unidad" | "libra" | "paquete";
  precio: number;
  cantidad: number;
  total: number;
  equivalencia?: number;
};