import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function upsertUser(
  email: string,
  name: string,
  role: "CLIENT" | "ADMIN" | "CUISINIER" | "LIVREUR",
  password: string,
) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, role, passwordHash },
  });
}

async function main() {
  await prisma.restaurantSettings.upsert({
    where: { id: "settings" },
    update: {},
    create: { id: "settings" },
  });

  await upsertUser("admin@pizzafratelli.fr", "Gérant Fratelli", "ADMIN", "admin1234");
  await upsertUser("cuisine@pizzafratelli.fr", "Chef Cuisinier", "CUISINIER", "cuisine1234");
  await upsertUser("livreur@pizzafratelli.fr", "Livreur Test", "LIVREUR", "livreur1234");
  await upsertUser("client@pizzafratelli.fr", "Client Test", "CLIENT", "client1234");

  const pizzas = await prisma.category.upsert({
    where: { name: "Pizzas" },
    update: {},
    create: { name: "Pizzas", position: 1 },
  });
  const desserts = await prisma.category.upsert({
    where: { name: "Desserts" },
    update: {},
    create: { name: "Desserts", position: 2 },
  });
  const boissons = await prisma.category.upsert({
    where: { name: "Boissons" },
    update: {},
    create: { name: "Boissons", position: 3 },
  });

  const margherita = await prisma.product.create({
    data: {
      categoryId: pizzas.id,
      name: "Margherita",
      description: "Tomate, mozzarella, basilic frais.",
      priceCents: 990,
      allergens: ["gluten", "lait"],
    },
  });
  await prisma.supplement.createMany({
    data: [
      { productId: margherita.id, name: "Supplément mozzarella", priceCents: 150 },
      { productId: margherita.id, name: "Supplément olives", priceCents: 100 },
    ],
  });

  await prisma.product.create({
    data: {
      categoryId: pizzas.id,
      name: "Fratelli",
      description: "Tomate, mozzarella, jambon, champignons, œuf.",
      priceCents: 1290,
      allergens: ["gluten", "lait", "œuf"],
    },
  });

  await prisma.product.create({
    data: {
      categoryId: desserts.id,
      name: "Tiramisu",
      description: "Recette maison au mascarpone.",
      priceCents: 550,
      allergens: ["lait", "œuf", "gluten"],
    },
  });

  await prisma.product.create({
    data: {
      categoryId: boissons.id,
      name: "Eau minérale 50cl",
      description: "",
      priceCents: 250,
      allergens: [],
    },
  });

  console.log("Seed terminé.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
