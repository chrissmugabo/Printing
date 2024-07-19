const { PrismaClient } = require("@prisma/client");
const argon2 = require("argon2");
const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);
  const hash = await argon2.hash("tame123");
  const user = await prisma.user.create({
    data: {
      email: "webmaster@gmail.com",
      password: hash,
      name: "Super Admin",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
