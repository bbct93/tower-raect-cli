const validatePackageName = require('validate-npm-package-name');
const path = require("path");
const fs = require("fs-extra");

async function create(projectName, options) {
    const cwd = options.cwd || process.cwd();
    // 检测是否在当前目录
    const inCurrent = projectName === '.';
    const name = inCurrent ? path.relative('../', cwd) : projectName;
    const targetDir = path.resolve(cwd, projectName || '.');
    // 检测是否符合npm命名
    const result = validatePackageName(name);
    if (!result.validForNewPackages) {
        console.error(chalk.red(`不合法的项目名: "${name}"`));
        result.errors && result.errors.forEach(err => {
            console.error(chalk.red.dim('❌ ' + err))
        });
        result.warnings && result.warnings.forEach(warn => {
            console.error(chalk.red.dim('⚠️ ' + warn))
        });
        exit(1)
    }
    // 检查文件夹是否存在
    if (fs.existsSync(targetDir)) {
        if (options.force) {
            await fs.remove(targetDir)
        } else {
            await clearConsole();
            if (inCurrent) {
                const { ok } = await inquirer.prompt([
                    {
                        name: 'ok',
                        type: 'confirm',
                        message: `Generate project in current directory?`
                    }
                ]);
                if (!ok) {
                    return
                }
            } else {
                const { action } = await inquirer.prompt([
                    {
                        name: 'action',
                        type: 'list',
                        message: `目标文件夹 ${chalk.cyan(targetDir)} 已经存在，请选择：`,
                        choices: [
                            { name: '覆盖', value: 'overwrite' },
                            { name: '取消', value: false }
                        ]
                    }
                ]);
                if (!action) {
                    return
                } else if (action === 'overwrite') {
                    console.log(`\nRemoving ${chalk.cyan(targetDir)}...`);
                    await fs.remove(targetDir)
                }
            }
        }
    }
    await clearConsole();

    // 校验完成，开始创建\
    console.log(chalk.red('开始创建.....'))
}