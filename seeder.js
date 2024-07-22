const { User } = require("./models");
async function main() {
  console.log(`Start seeding ...`);
  const user = await User.update(
    {
      password: "tame123",
    },
    { where: {} }
  );
}

main().then(() => {});
