
import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  
  const addProduct = async (productId: number) => {
    try {
      const productAdded = (await api.get(`/products/${productId}`)).data;
      var existsProduct=false;
      var checkedProduct:Product={
        id: 0,
        title: '',
        price: 0,
        image: '',
        amount: 0,
      };

      cart.forEach(element => {
        if (element.id===productId) {
          existsProduct= true;
          checkedProduct=element;    
        }
      });

      var newProduct = {
        amount: 1,
        ...productAdded,
      };
      const updatedCart = [...cart];

      if (existsProduct) {
        updateProductAmount({productId,amount:(checkedProduct.amount)+1});
      } else {
        if (productAdded) {
          updatedCart.push(newProduct)
          setCart(updatedCart);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
        }     
      }

    } catch {
      toast.error("Erro na adição do produto");
    }
  };
  const removeProduct = (productId: number) => {
    try {
      var productsCartArray=[...cart];
      var productExists=false;
      productsCartArray.forEach(element => {
        if (element.id===productId) {
          productExists=true
        }
      });
      if (productExists) {
        productsCartArray.filter(product=>product.id!==productId)
        setCart(productsCartArray);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
      }else{
        throw new Error("");       
      } 
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productStock = (await api.get(`/stock/${productId}`)).data;
     if (amount<=0) {
       return;
     }else if(amount>productStock.amount){
      toast.error('Quantidade solicitada fora de estoque');
     }else{
       var updateProductArray=[...cart];
       updateProductArray.forEach(element => {
         if (element.id===productId) {
           element.amount=amount
         }
       });       
        setCart(updateProductArray);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
     }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
