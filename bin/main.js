#!/usr/bin/env node
const semver = require("semver");
const chalk = require("chalk");
const validatePackageName = require('validate-npm-package-name');
const path = require("path");
const fs = require("fs-extra");
const ora = require("ora");
const symbols = require("log-symbols");
const readline = require('readline');
const download = require('download-git-repo');
const inquirer = require('inquirer');

function checkNodeVersion(wanted) {
    if(!semver.satisfies(process.version, wanted)) {
        console.log(chalk.red(
            `你所用的Node版本号：${process.version}, 但是tower-react-cli需要在${wanted}下运行.\n请升级你的node版本`
        ));
        process.exit(1)
    }
}

checkNodeVersion('>9.0.0');

// 检查版本通过后开始处理命令

const program = require('commander');
const minimist = require('minimist');
const package = require('../package.json');


// 获得当前cli版本号
program
    .version(package.version)
    .parse(process.argv);

// 创建流程
program
    .command('create <app-name>')
    .description('create a simple project made by chenTao')
    .action(function(name, cmd) {
        const options = cleanArgs(cmd);
        if (minimist(process.argv.slice(3))._.length > 1) {
            console.log(chalk.yellow('\n ⚠️  检测到您输入了多个名称，将以第一个参数为项目名哦~'))
        }
        create(name,options)
    });
program.parse(process.argv);


function camelize (str) {
    return str.replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : '')
}

// 获取参数
function cleanArgs (cmd) {
    const args = {};
    cmd.options.forEach(o => {
        const key = camelize(o.long.replace(/^--/, ''))
        // 如果没有传递option或者有与之相同的命令，则不被拷贝
        if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
            args[key] = cmd[key]
        }
    });
    return args
}


function clearConsole(title) {
    if (process.stdout.isTTY) {
        const blank = '\n'.repeat(process.stdout.rows)
        console.log(blank)
        readline.cursorTo(process.stdout, 0, 0)
        readline.clearScreenDown(process.stdout)
        if (title) {
            console.log(title)
        }
    }
}

// create project
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
    console.log(chalk.red('开始创建.....'));
    const spinner = ora('正在下载模板，请稍后...');
    spinner.start();
    download(
        'https://github.com:bbct93/template-react',
        name,
        { clone: true },
        err => {
            if (err) {
                spinner.fail();
                console.log(symbols.error, chalk.red(err));
            } else {
                spinner.succeed();
                console.log(symbols.success, chalk.green(`🎉  项目创建成功 ${projectName}.\n👉开始愉快开发吧`));
            }
        }
    );

}

