//TODO 
// log out client
// store items to be picked up
// create functions where necessary
// ensure the script can be invoked periodically/scheduled
//get the expiration of the cookie
//append messages to log or dump to database
//make into class or npm package
//check the expiry of the cookie. It seems they set it to expire every two hours
//pass flags to command i.e. username and password and status pickup, origin etc
// Invoice Form Upload URL https://www.shipme.me/customer/dashboard/package-invoice-attache/SME010121458194
// Upload an invoice - https://dev.to/sonyarianto/practical-puppeteer-how-to-upload-a-file-programatically-4nm4
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
        let itemIds = []
        let results = []
        let status, name, id = '';
        $('.description').each((i, el)=>{
            if($(el).children()[2].attribs.class === 'fntsize12 darkgray'){
                let data = $(el).children()[2].children[0].data;
                let substring = data.substring(0, 3);
                if(substring === 'SME'){
                    itemIds.push(data)
                }
            }

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
            if(itemStatus[index] === 'Received at Destination'){
                results.push({
                    'Id': itemIds[index],
                    'Name': itemNames[index],
                    'Status': itemStatus[index],                    
                })
            }            
        }
        console.log('Total Items: ', results.length)
        if(results.length > 0){
            console.table(results);
        }else{
            console.log('No Items Found.')
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
