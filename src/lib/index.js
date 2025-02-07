import { execa } from "execa";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import inquirer from "inquirer";
import ping from "node-http-ping";
import { help } from "./help.js";

const __dirname = new URL(".", import.meta.url).pathname;
const pkgUrl = path.join(__dirname, "../../package.json");
const mirrorUrl = path.join(__dirname, "./mirror.json");

export class NpmMirrorManger {
  mirrors = [];
  version = "";
  curPkgVersion = ""; // 当前版本号
  latestVersion = ""; // 最新版本号
  constructor() {
    this.getAllMirror();
  }

  getAllMirror() {
    const mirrorJsonStr = fs.readFileSync(mirrorUrl, "utf-8");
    const mirrors = JSON.parse(mirrorJsonStr);
    this.mirrors = mirrors;
    return mirrors;
  }

  /**
   * @description: 命令处理
   * @param {*} command
   * @return {*}
   */
  async dispatchCommand(command) {
    if (command === "--version" || command === "--v") {
      await this.printVersion();
    } else if (command === "update") {
      await this.updateVersion();
    } else if (command === "current") {
      await this.getOriginUrl();
    } else if (command === "ls") {
      await this.lsAllOrigin();
    } else if (command === "help") {
      help();
    } else if (command === "use") {
      await this.useOrigin();
    } else if (command === "ping") {
      await this.pingOrigin();
    } else if (command === "add") {
      await this.addMirror();
    } else if (command === "del") {
      await this.delMirror();
    }
    process.exit(0);
  }

  /**
   * @description: 更新版本
   * @return {*}
   */
  async updateVersion() {
    await this.getCurVersion();
    await this.getLatestVersion();
    if (this.curPkgVersion !== latestVersion) {
      await execa("npm", ["install", "-g", "mnpmmior@latest"]);
      console.log(chalk.green("😀😀😀 已更新为最新版本"));
    } else {
      console.log(chalk.green("😡😡😡 已是最新版本"));
    }
  }

  /**
   * @description: 输出当前版本号
   * @return {*}
   */
  async printVersion() {
    await this.getCurVersion();
    console.log(chalk.green("⭐️⭐️⭐️ " + this.curPkgVersion));
  }

  /**
   * @description: 获取当前版本号
   * @return {*}
   */
  async getCurVersion() {
    if (this.curPkgVersion) return;
    const pkgJsonStr = fs.readFileSync(pkgUrl, "utf-8");
    const pkg = JSON.parse(pkgJsonStr);
    this.curPkgVersion = pkg.version;
  }

  /**
   * @description: 获取当前镜像源地址
   * @return {*}
   */
  async getOriginUrl(log = true) {
    const origin = await execa("npm", ["config", "get", "registry"]);
    if (log) {
      console.log(chalk.green("⭐️⭐️⭐️ " + origin.stdout));
    }
    return origin.stdout;
  }

  /**
   * @description: 列出所有镜像源地址
   * @return {*}
   */
  async lsAllOrigin() {
    const currentOrigin = await this.getOriginUrl(false);
    // const res = await getOrigin();
    const registries = this.mirrors;
    const keys = Object.keys(registries);
    const max = Math.max(...keys.map((v) => v.length)) + 7;
    const message = keys.map((item) => {
      const isCurrent = registries[item].registry == currentOrigin.trim();
      const prefix = isCurrent ? "* " : "  ";
      const prefixName = (prefix + item).padEnd(max, " ");
      let message = prefixName + registries[item].registry;
      return isCurrent ? chalk.green(message) : chalk.blue(message);
    });
    console.log(message.join("\n"));
  }

  /**
   * @description: 切换镜像源
   * @return {*}
   */
  async useOrigin() {
    const result = await this.chooseOrigin();
    const originUrl = this.mirrors[result.origin].registry;
    try {
      await execa("npm", ["config", "set", "registry", originUrl]);
      console.log(chalk.green("😀😀😀 已切换为" + result.origin + "镜像源"));
    } catch (error) {
      console.log(chalk.red("😡😡😡 切换失败"));
    }
  }

  /**
   * @description: 选择镜像源
   * @return {*}
   */
  async chooseOrigin() {
    const keys = Object.keys(this.mirrors);
    const max = Math.max(...keys.map((v) => v.length)) + 5;
    const choices = Object.keys(this.mirrors).map((item) => {
      const name = item.padEnd(max, " ") + this.mirrors[item].registry;
      return {
        name,
        value: item,
      };
    });
    const result = await inquirer.prompt([
      {
        type: "list",
        name: "origin",
        message: "请选择镜像源",
        choices,
      },
    ]);

    return result;
  }

  /**
   * @description: 测试镜像源连接
   * @return {*}
   */
  async pingOrigin() {
    const result = await this.chooseOrigin();
    let originUrl = this.mirrors[result.origin].registry;

    // 去掉字符串结尾的斜线
    if (originUrl.endsWith("/")) {
      originUrl = originUrl.slice(0, -1);
    }
    console.log(chalk.green("😀😀😀 正在测试" + originUrl + "镜像源"));
    try {
      const time = await ping(originUrl);
      console.log(chalk.blue(`响应时长: ${time}ms`));
    } catch (error) {
      console.log(chalk.red("GG"));
    }
  }

  /**
   * @description: 新增镜像源
   * @return {*}
   */
  async addMirror() {
    const result = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "请输入镜像源名称",
      },
      {
        type: "input",
        name: "registry",
        message: "请输入镜像源地址",
      },
    ]);
    const { name, registry } = result;
    if (this.mirrors[name]) {
      console.log(chalk.red("😡😡😡 镜像源已存在"));
      return;
    }
    this.mirrors[name] = {
      registry,
    };
    fs.writeFileSync(mirrorUrl, JSON.stringify(this.mirrors, null, 2));
    console.log(chalk.green("😀😀😀 镜像源添加成功"));
  }

  /**
   * @description: 删除镜像源
   * @return {*}
   */
  async delMirror() {
    const result = await this.chooseOrigin();
    const { origin } = result;
    delete this.mirrors[origin];
    fs.writeFileSync(mirrorUrl, JSON.stringify(this.mirrors, null, 2));
    console.log(chalk.green("😀😀😀 镜像源删除成功"));
  }
}
