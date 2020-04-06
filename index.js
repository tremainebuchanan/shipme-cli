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

(async () => {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    if(Object.keys(cookies).length){
        await page.setCookie(...cookies)
        await page.goto(dashboard_url, {waitUntil: 'networkidle2'})
        const html = await page.content()
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
    
    }else{
        await page.goto('https://www.shipme.me/customer/login', {waitUntil: 'networkidle0'});
        await page.type('#email', config.email, {delay: 30});
        await page.type('#password', config.password, {delay: 30});
        await page.keyboard.press('Enter');
        await page.waitForNavigation({waitUntil: "networkidle0"})
        await page.waitFor(5000)

        try {
            let message = {
                'message': 'Successfully logged in',
                'timestamp': Date.now
            }
            fs.writeFileSync('./logs.json', JSON.stringify(message))
        } catch (error) {
            console.log('Failed to login')
            let message = {
                'message': 'failed to login',
                'timestamp': Date.now
            }
            fs.writeFileSync('./logs.json', JSON.stringify(message))
            process.exit(0)
        }

        let currentCookies = await page.cookies();
        fs.writeFileSync('./cookies.json', JSON.stringify(currentCookies))
    }    
    await browser.close();
  })();