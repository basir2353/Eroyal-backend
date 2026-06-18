import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { customerRepository } from "../repositories/customer.repository.js";
import { getPagination, sendError, sendSuccess } from "../utils/apiResponse.js";
import { paramId } from "../utils/params.js";
import { mapCustomer, mapOrder, serialize, serializeMany } from "../utils/serialize.js";

export async function listCustomers(req: AuthRequest, res: Response) {
  const { page, limit, skip } = getPagination(req.query);
  const { items, total } = await customerRepository.list(skip, limit);
  return sendSuccess(res, {
    items: serializeMany(items).map((c) => mapCustomer(c as Record<string, unknown>)),
    pagination: { page, limit, total },
  });
}

export async function getCustomer(req: AuthRequest, res: Response) {
  const customer = await customerRepository.findById(paramId(req.params.id));
  if (!customer) return sendError(res, "Not found", 404);

  const mapped = mapCustomer(serialize(customer) as Record<string, unknown>);
  mapped.orders = serializeMany(customer.orders ?? []).map((o) =>
    mapOrder(o as Record<string, unknown>),
  );
  mapped.totalSpent = (mapped.orders as { total?: number }[]).reduce(
    (sum, o) => sum + Number(o.total ?? 0),
    0,
  );
  mapped.orderCount = (mapped.orders as unknown[]).length;

  return sendSuccess(res, mapped);
}

export async function updateCustomer(req: AuthRequest, res: Response) {
  const customer = await customerRepository.update(paramId(req.params.id), req.body);
  return sendSuccess(res, mapCustomer(serializeMany([customer])[0] as Record<string, unknown>));
}

export async function deleteCustomer(req: AuthRequest, res: Response) {
  await customerRepository.delete(paramId(req.params.id));
  return sendSuccess(res, null, "Deleted");
}
