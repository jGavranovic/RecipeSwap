const express = require('express')
const app = express()
const path = require('path')
const fs = require('fs')
const session = require('express-session')
const PORT = 5049;
app.use(
    express.json(),
    express.urlencoded(),
    session({
        secret: 'WB5RJI9Rto',
        saveUninitialized: false
    })
)
app.use('/public', express.static(path.join(__dirname,'public')))
app.use('/js', express.static(path.join(__dirname,'node_modules/bootstrap/dist/js')))


app.use(express.static(path.join(__dirname,'public')))
app.set('view engine','ejs')

app.get(/.*/, (req,res,next)=>{
    delete req.session.redirect;
    next()
})

app.get('/createaccount', (req,res)=>{
    res.render('createaccount',{page: 'login', username: req.session.username, invalidUsername: false, rejectedUsername: ""})
})
app.post('/createaccount', (req,res)=>{
    const account = req.body;
    if (!usernameExists(account)){
        addNewAccount(account)
        req.session.username = account.username;
        res.redirect('../myaccount')

    }else {
        res.render('createaccount',{page:'login', username:req.session.username, invalidUsername: true, rejectedUsername: account.username})
    }
})
app.get('/login',(req,res)=>{
    res.render('login',{page:'login', username:req.session.username, invalidUsername: false, invalidPassword: false, rejectedUsername: ""})
})
app.post('/login', (req,res)=>{
    const account = req.body;
    if (!usernameExists(account))
        res.render('login', {page:'login', username:req.session.username, invalidUsername: true, invalidPassword:false,rejectedUsername: account.username})
    else if (validLogin(account)){
        req.session.username = account.username;
        if (req.session.redirect)
            res.redirect('../share');
        else
            res.redirect('../myaccount')
    }else {
        res.render('login', {page:'login', username:req.session.username, invalidUsername: false, invalidPassword: true, rejectedUsername: account.username})
    }
        
})
app.get('/share', (req,res)=>{
    if (req.session.username) 
        res.render('share', {page: 'share', username: req.session.username})
    else{
        req.session.redirect= 'share';
        res.render('login', {page: 'share', username: req.session.username, invalidUsername:false, invalidPassword:false, rejectedUsername: ''})
    }
})
app.get('/logout', (req,res)=>{
    delete req.session.username;
    res.redirect('../login');
})

app.get('/:page', (req,res)=>{
    res.render(req.params.page, {page: req.params.page, username: req.session.username})
})


app.listen(PORT, () => console.log(`App start on port ${PORT}`))

function usernameExists(account){
    const accounts = parseAccounts()
    for (i=0;i<accounts.length;i++){
        if (account.username.toLowerCase() == accounts[i].username.toLowerCase())
            return true;
    }
    return false;
}

function validLogin(account){
    const accounts = parseAccounts();
    for (i=0;i<accounts.length;i++){
        if (account.username.toLowerCase() == accounts[i].username.toLowerCase() && account.password == accounts[i].password)
            return true;
    }
    return false;
}

function addNewAccount(account){
    const accounts = parseAccounts();
    accounts.push({"username":account.username, "password":account.password})
    fs.writeFileSync('accounts.json',JSON.stringify(accounts));
}

function parseAccounts(){
    return JSON.parse(fs.readFileSync('accounts.json', 'utf8'))
}