const chalk = require('chalk');
const figlet = require('figlet');
const clear = require('clear');

module.exports = {
    show(){
        clear();
        console.log(chalk.blueBright(figlet.textSync('ShipMe CLI', {horizontalLayout: 'full'})));   
    }
}
