import pc from "picocolors";

export const logger = {
  info: (msg: string) => console.log(pc.blue("ℹ"), msg),
  success: (msg: string) => console.log(pc.green("✔"), msg),
  warn: (msg: string) => console.log(pc.yellow("⚠"), msg),
  error: (msg: string | Error) => {
    if (msg instanceof Error) {
      console.error(pc.red("✖"), msg.message);
    } else {
      console.error(pc.red("✖"), msg);
    }
  },
  step: (msg: string) => console.log(pc.cyan("➜"), msg),
};
