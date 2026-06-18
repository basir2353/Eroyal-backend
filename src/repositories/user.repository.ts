import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../utils/password.js";

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
  },

  findByResetToken(token: string) {
    return prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });
  },

  list() {
    return prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async create(data: {
    name: string;
    email: string;
    password: string;
    roleId: string;
    phone?: string;
  }) {
    return prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
        password: await hashPassword(data.password),
      },
      include: { role: true },
    });
  },

  async update(id: string, data: Record<string, unknown>) {
    const update: Record<string, unknown> = { ...data };
    if (typeof update.password === "string") {
      update.password = await hashPassword(update.password);
    }
    return prisma.user.update({
      where: { id },
      data: update as never,
      include: { role: true },
    });
  },

  async updatePassword(id: string, password: string) {
    return prisma.user.update({
      where: { id },
      data: { password: await hashPassword(password) },
    });
  },

  getPermissions(user: {
    role: {
      name: string;
      permissions: { permission: { name: string } }[];
    };
  }) {
    return user.role.permissions.map((rp) => rp.permission.name);
  },
};
