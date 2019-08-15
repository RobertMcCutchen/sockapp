//First, I initialize my node programs.
const express = require('express')
const mustacheExpress = require('mustache-express')
const session = require('express-session')
const app = express()
const bcrypt = require('bcrypt')
const saltRounds = 10
const models = require('./models')
const multer = require('multer')
const upload = multer({dest: __dirname + '/uploads/images'})

//This code initializes sessions.
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
}))

//This set up the middleware.
app.use(express.urlencoded())
app.use('/static', express.static(__dirname + '/static'))
app.use(express.static('public'))
app.use('/uploads', express.static('uploads'))

//This line of code keeps users from viewing 'auth' pages without being logged in.
app.all('/auth/*',authenticate)

//This code creates an authentication middleware. 
function authenticate(req,res,next) {
    if(req.session) {
        if(req.session.user.id) {
            // perform the original request 
            next()
        } else {
            res.redirect('/login')
        }
    }
}

//This line of code tells express to use the mustache templating engine.
app.engine('mustache', mustacheExpress())
//The pages are located in the 'views' directory.
app.set('views', './views')
//The extension I will be using is '.mustache'
app.set('view engine', 'mustache')

//This code connects me to my database.
var pgp = require('pg-promise')();
var connectionString = 'postgres://euexyxvz:cNwe2i-AD-aiRLkV6q52HEctHiynEaDB@raja.db.elephantsql.com:5432/euexyxvz';
var db = pgp(connectionString);

//This code creates the 'register' page.
app.get('/register', (req,res) => {
    res.render('register')
})

//This code gives functionality to the 'register' page.
app.post('/register', upload.single('photo'), (req,res) => {
    let username = req.body.username 
    let password = req.body.password
    let sockcolor = req.body.sockcolor
    let sockstyle = req.body.sockstyle
    let emailaddress = req.body.emailaddress
    let imageurl = null

    // res.json(req.file).then(object => object.path)
    console.log('file', req.file)
    if(req.file) {
        // res.json(req.file)
        imageurl = req.file.filename
    }
    // else {
    //     res.send("Something went wrong with upload...")
    // }
    
    //This encrypts the password.
    bcrypt.hash(password, 10).then(function(hash) {
        let user = models.User.build({
            username: username,
            password: hash,
            sockcolor: sockcolor,
            sockstyle: sockstyle,
            imageurl: imageurl,
            emailaddress: emailaddress,
        })

        user.save().then(savedUser => console.log('user saved'))
    .catch(error => console.log(error))
    }) 
    res.redirect('/home')
})

//This code creates the 'login' page.
app.get('/login', (req,res) => {
    res.render('login')
})

//This code gives functionality to the 'login' page.
app.post('/login', async (req,res) => {
    let username = req.body.username
    let password = req.body.password

    let user = await models.User.findOne({
        where: {
            username: username
        }
    })
    if(user) {

        let result = await bcrypt.compare(password, user.password)
        if(result) {
            console.log('rs of brcypt')
            console.log(result)
        }

        bcrypt.compare(password, user.password, (error, result) => {
            if(result) {
                if(req.session) {
                    req.session.user = {userid: user.id}
                    res.redirect('/home')
                }
            } else {
                console.log('No result')
                res.render('login', {message: 'Invalid username or password!'})
            }
        })
    } else {
        console.log('No user')
        res.render('login', {message: 'Invalid username or password!'})
    }
})

//This code create the 'home' page.
app.get('/home', (req,res) => {
    let userid = req.session.user.userid

    models.User.findAll({
        where: {
            id: userid
        }
    }).then(user => {
        console.log(user)
        res.render('home', {user:user})
    })

})

//This code give functionality to the 'logout' button.
app.post('/logout',(req,res) => {
    if(req.session) {
        req.session.destroy(error => {
            if(error) {
                next(error)
                console.log('Problem!')
            } else {
                res.redirect('/login')
            }
        }) 
    }
})

//This line of code will tell us that the server is running.
app.listen(3001, () => {console.log('Server is running...')})

