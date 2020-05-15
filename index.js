const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const libClui = require('clui');
const Spinner = libClui.Spinner;
const cliHeader = require('./libs/cli-header');
const inquirer = require('./libs/inquirer');
const configs = require('./configs/config');

(async () => { 
    async function start(){        
        cliHeader.show();
        const credentials = await inquirer.askForCredentials();
        const browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();
        let response = await login(browser, page, credentials, configs.urls.login);        
        if(response === 'Successfully Logged In!'){
            await page.waitForNavigation({waitUntil: "networkidle0"});  
            console.log('Login succesful');
            await page.goto(configs.urls.dashboard, {waitUntil: 'networkidle0'})
            const html = await page.content()
            getItems(html,credentials.statuses);
        }else{
            console.log('Unable to log into your ShipMe account.');               
        }            
        await browser.close();
    }

    await start();

    function getItems(html, statuses){
        const $ = cheerio.load(html);
        let itemNames = [];
        let itemStatus = [];
        let itemIds = [];
        let results = [];
        let status, name;
        $('.description').each((i, el)=>{
            if($(el).children()[2].attribs.class === 'fntsize12 darkgray'){
                let data = $(el).children()[2].children[0].data;
                let substring = data.substring(0, 3);
                if(substring === 'SME'){
                    itemIds.push(data);
                }
            }
            if($(el).children()[0].tagName === 'h5'){
                name = $(el).children()[0].children[0].data;
                itemNames.push(name);
            }           
        })
        $('.box-left').each((i, ele)=>{
            if($(ele).children()[0].tagName === 'p'){
                status = $(ele).children()[0].children[0].data
                itemStatus.push(status)
            }
        });
        for (let index = 0; index < itemNames.length; index++) {
            for(let j = 0; j < statuses.length; j++){
                if(itemStatus[index] === statuses[j]){
                    results.push({
                        'Id': itemIds[index],
                        'Name': itemNames[index],
                        'Status': itemStatus[index],                    
                    });
                } 
            }                      
        }
        if(results.length > 0){
            console.log('Total Items: ', results.length);
            console.table(results);
        }else{
            console.log('No Items Found.');
        }
    }

    async function login(browser, page, config, url){
        const status = new Spinner('Attempting New Login');
        status.start();
        await page.goto(url, {waitUntil: 'networkidle0'});
        await page.type('#email', config.email, {delay: 30});
        await page.type('#password', config.password, {delay: 30});
        await page.keyboard.press('Enter'); 
        await page.waitFor(1000); 
        const html = await page.content();
        const $ = cheerio.load(html);
        let response;
        $('body').children().each((i, ele)=>{
            if($(ele)[0].tagName === 'div'){
                if($(ele)[0].attribs.class === 'swal2-container swal2-top-end swal2-fade swal2-shown'){
                    response = $(ele)[0].children[0]['children'][0].children[7].children[0].data;
                }
            }        
        });
        status.stop();               
        return response;      
    }
})();
