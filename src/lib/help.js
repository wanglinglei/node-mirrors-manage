export const helpData = [
  {
    text: "查看版本号",
    command: "--version",
    alias: ["--v"],
  },
  {
    text: "更新版本号",
    command: "update",
  },
  {
    text: "查看当前镜像源",
    command: "current",
  },
  {
    text: "查看所有镜像源",
    command: "ls",
  },
  {
    text: "帮助",
    command: "help",
  },
  {
    text: "切换镜像源",
    command: "use",
  },
  {
    text: "测试镜像源连接",
    command: "ping",
  },
  {
    text: "添加镜像源",
    command: "add",
  },
];

export function help() {
  const message = ["  命令列表:"];
  helpData.forEach((item) => {
    const alias = item.alias ? ` / ${item.alias.join("/ ")}` : "";
    message.push(`    ${item.text}  =>  mnpmmior ${item.command}${alias}`);
  });
  console.log(message.join("\n"));
}
