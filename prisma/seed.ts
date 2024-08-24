import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { books, members } from './seed-data';

const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt();
  const hash = await bcrypt.hash('Aa!45678', salt);
  for (const member of members) {
    const existingMember = await prisma.member.findUnique({
      where: { email: member.email },
    });

    if (!existingMember) {
      const userCount = await prisma.member.count();
      await prisma.member.create({
        data: {
          name: member.name,
          email: member.email,
          code: `M00${userCount + 1}`,
          password: hash,
          salt,
        },
      });
    }
  }

  for (const book of books) {
    const existingBook = await prisma.book.findUnique({
      where: { code: book.code },
    });

    if (!existingBook) {
      await prisma.book.create({
        data: {
          code: book.code,
          title: book.title,
          author: book.author,
          stock: book.stock,
        },
      });
    }
  }
}

main()
  .then(() => {
    console.log('Seeding completed.');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
