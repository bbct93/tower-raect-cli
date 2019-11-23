const semver = require("semver");
const chalk = require("chalk");

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
const package = require('../package.json')


// 获得当前cli版本号
program
    .version(package.version)
    .parse(process.argv);

// 创建流程
program
    .command('create <app-name>')
    .description('create a simple project made by chenTao')
    .option('-p, --preset <presetName>', 'Skip prompts and use saved or remote preset')
    .option('-d, --default', 'Skip prompts and use default preset')
    .action(function(name, cmd) {
        const options = cleanArgs(cmd);
        if (minimist(process.argv.slice(3))._.length > 1) {
            console.log(chalk.yellow('\n ⚠️  检测到您输入了多个名称，将以第一个参数为项目名哦~'))
        }
        require('../lib/create')(name, options)
    });



function camelize (str) {
    return str.replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : '')
}

// 获取参数
function cleanArgs (cmd) {
    const args = {};
    cmd.options.forEach(o => {
        const key = camelize(o.long.replace(/^--/, ''));
        // 如果没有传递option或者有与之相同的命令，则不被拷贝
        if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
            args[key] = cmd[key]
        }
    });
    return args
}
