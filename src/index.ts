import { cac } from "cac";
import pc from "picocolors";
import { version } from "../package.json";
import { init } from "./commands/init";
import { list } from "./commands/list";
import { add } from "./commands/add";

const cli = cac("dev-tookit");

cli
  .command("init", "Initialize configuration")
  .action(async () => {
    await init();
  });

cli
  .command("list", "List available components")
  .alias("ls")
  .action(async () => {
    await list();
  });

cli
  .command("add <type> <name>", "Add a component to your project")
  .option("-f, --force", "Overwrite existing files", { default: false })
  .option("-d, --dry-run", "Preview changes without writing files", {
    default: false,
  })
  .action(async (type, name, options) => {
    await add(type, name, options);
  });

cli.help();
cli.version(version);

cli.parse();
