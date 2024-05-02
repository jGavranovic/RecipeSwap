const express = require('express')
const app = express()
const path = require('path')
const fs = require('fs')
const fileUpload = require('express-fileupload')
const session = require('express-session')
const PORT = 5049;


app.use(express.urlencoded())
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
}));
app.use(
    express.json(),
    session({
        secret: 'WB5RJI9Rto',
        saveUninitialized: false
    })
)
app.use('/public', express.static(path.join(__dirname,'public')))
app.use('/js', express.static(path.join(__dirname,'node_modules/bootstrap/dist/js')))
app.use('/data/images', express.static(path.join(__dirname,'data/images')))

app.use(express.static(path.join(__dirname,'public')))
app.set('view engine','ejs')

let recipeIDCounter = (parseRecipes().length != 0)?++parseRecipes().slice(-1)[0].id:1;
const imagePath = path.join(__dirname, 'data/images')

app.get(/.*/, (req,res,next)=> {
    delete req.session.redirect;
    next()
})
app.post('/share',(req,res)=>{
    req.files.image.mv(path.join(imagePath, `${recipeIDCounter}.${req.files.image.name.split('.')[1]}`))
    const recipe = req.body
    recipe.id = recipeIDCounter++
    recipe.user = req.session.username
    let recipes = parseRecipes()
    recipes.push(recipe)
    fs.writeFile('data/recipes.json',JSON.stringify(recipes), function () {})
    res.redirect('../discover')
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
app.get('/',(req,res)=>{
    res.redirect('../discover')
})
app.get('/discover',(req,res)=>{
    res.render('discover',{page:'discover',username:req.session.username,recipes:parseRecipes()})
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
    fs.writeFile('data/accounts.json',JSON.stringify(accounts), () =>{});
}

function parseAccounts(){
    return JSON.parse(fs.readFileSync('data/accounts.json', 'utf8'))
}

function parseRecipes(){
    return JSON.parse(fs.readFileSync('data/recipes.json', 'utf8'))
}