import { z } from "zod";

const addressSchema = z.object({
  company: z.string().optional(),
  address1: z.string().min(1),
  address2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postcode: z.string().min(1),
  country: z.string().min(1),
});

const customerInfoSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: addressSchema,
});

const orderItemSchema = z.object({
  product: z.string().optional(),
  productId: z.string().optional(),
  name: z.string().min(1),
  slug: z.string().min(1),
  image: z.string().optional(),
  weight: z.string().optional(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  lineTotal: z.number().min(0),
});

export const createOrderSchema = z.object({
  customerId: z.string().optional(),
  customerInfo: customerInfoSchema,
  items: z.array(orderItemSchema).min(1),
  subtotal: z.number().min(0),
  shippingCost: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  total: z.number().min(0),
  paymentMethod: z.string().min(1),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
