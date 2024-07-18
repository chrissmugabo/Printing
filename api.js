const prisma = require("./config/db");

exports.addPrinter = async (printer) => {
  return await prisma.printer.create({
    data: printer,
  });
};

exports.saveSettings = async (settings) => {
  const row = await prisma.setting.findFirst();
  if (row) {
    return await prisma.setting.update({
      data: settings,
      where: { id: row.id },
    });
  } else {
    return await prisma.setting.create({
      data: settings,
    });
  }
};
