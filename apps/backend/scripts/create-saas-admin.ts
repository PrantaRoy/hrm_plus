import "dotenv/config";
import bcrypt from "bcrypt";
import { controlClient } from "../src/db/controlClient";

interface Args {
  email: string;
  password: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx >= 0 ? args[idx + 1] : undefined;
  };

  const email = get("--email");
  const password = get("--password");

  if (!email || !password) {
    console.error("Usage: create-saas-admin --email you@hrmplus.test --password <password>");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters");
    process.exit(1);
  }

  return { email, password };
}

async function main() {
  const { email, password } = parseArgs();

  const existing = await controlClient.platformAdmin.findUnique({ where: { email } });
  if (existing) {
    console.error(`A platform admin with email "${email}" already exists`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await controlClient.platformAdmin.create({ data: { email, passwordHash } });

  console.log(`\nSaaS super-admin created:`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}\n`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await controlClient.$disconnect();
  });
