const inquirer = require('inquirer');
const config = require('../configs/config');
module.exports = {
    askForCredentials: () => {
        const questions = [
            {
                type: 'input',
                name: 'email',
                message: 'Enter your ShipMe account e-mail address:',
                validate: function(value){
                    if(value.length){
                        return true;
                    }else{
                        return 'Please enter ShipMe account e-mail address.'
                    }
                }
            },{
                type: 'password',
                name: 'password',
                mask: '*',
                message: 'Enter your ShipMe account password:',
                validate: function(value){
                    if(value.length){
                        return true;
                    }else{
                        return 'Please enter ShipMe account password.'
                    }
                }
            },{
                type: 'checkbox',
                name: 'statuses',
                message: 'Choose the status of packages from the list below:',
                choices: config.statuses,
                default: config.statuses[0]
            }
        ];
        return inquirer.prompt(questions);
    }
}