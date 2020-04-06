//TODO 
// log out client
// store items to be picked up
// create functions where necessary
// ensure the script can be invoked periodically/scheduled
//get the expiration of the cookie
require("dotenv").config()
const puppeteer = require('puppeteer');
const fs = require('fs');
const cheerio = require('cheerio')
const config = {
    "email": process.env.EMAIL,
    "password": process.env.PASSWORD
};
const cookies = require('./cookies.json');
const dashboard_url = process.env.DASHBOARD_URL;
const login_url = 'https://www.shipme.me/customer/login';

(async () => {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    let html;
    if(Object.keys(cookies).length){
        await page.setCookie(...cookies)
        console.log('Cookies present')
        await page.goto(dashboard_url, {waitUntil: 'networkidle0'})
        html = await page.content()
    
    }else{
        fs.writeFileSync('./cookies.json', JSON.stringify({}));       
        await login(page, config, login_url);
        try {
            let message = {
                'message': 'Successfully logged in',
                'timestamp': Date.now()
            }
            console.log(message)
            fs.writeFileSync('./logs.json', JSON.stringify(message))
        } catch (error) {
            console.log('Failed to login')
            let message = {
                'message': 'failed to login',
                'timestamp': Date.now()
            }
            fs.writeFileSync('./logs.json', JSON.stringify(message))
            process.exit(0)
        }       
    }  
    let currentCookies = await page.cookies();
    fs.writeFileSync('./cookies.json', JSON.stringify(currentCookies))
    await page.goto(dashboard_url, {waitUntil: 'networkidle0'})
    html = await page.content()
    getItemsReadyForPickup(html);  
    await browser.close();

    function getItemsReadyForPickup(html){
        const $ = cheerio.load(html)
        let itemNames = []
        let itemStatus = []
        let results = []
        let status, name = '';
        $('.description').each((i, el)=>{
            if($(el).children()[0].tagName === 'h5'){
                name = $(el).children()[0].children[0].data;
                itemNames.push(name)
            }
        })
        $('.box-left').each((i, ele)=>{
            if($(ele).children()[0].tagName === 'p'){
                status = $(ele).children()[0].children[0].data
                itemStatus.push(status)
            }
        })
        for (let index = 0; index < itemNames.length; index++) {
            if(itemStatus[index] === 'Ready for Pickup'){
                results.push({
                    'name': itemNames[index],
                    'status': itemStatus[index]
                })
            }            
        }
        console.log('Total items ready for pickup -> ', results.length)
        for(let j = 0; j < results.length; j++){
            console.log(`(${j+1}) - ${results[j].name}`)
        }     
    }

    async function login(page, config, url){
        console.log('Attempting New Login')
        await page.goto(url, {waitUntil: 'networkidle0'});
        await page.type('#email', config.email, {delay: 30});
        await page.type('#password', config.password, {delay: 30});
        await page.keyboard.press('Enter');
        await page.waitForNavigation({waitUntil: "networkidle0"})
        await page.waitFor(1000)
    }
  })();