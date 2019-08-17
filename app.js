//First, I initialize my node programs.
const express = require('express')
const mustacheExpress = require('mustache-express')
const session = require('express-session')
const app = express()
const bcrypt = require('bcrypt')
const saltRounds = 10
const models = require('./models')
const Sequelize = require('sequelize')

const multer = require('multer')
const storage = multer.diskStorage(
    {
        destination: function (req, file, cb) {
            cb(null, __dirname + '/uploads/images')
          },
        filename: function ( req, file, cb ) {
            cb( null, req.body.username + '-' + Date.now() + '-' + file.originalname)
        }
    }
);
const upload = multer({storage: storage})

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
    console.log('file', req.file)
    if(req.file) {
        imageurl = req.file.filename
    }

    //This encrypts the password.
    bcrypt.hash(password, 10).then(function(hash) {
        let user = models.User.build({
            username: username,
            password: hash,
            sockcolor: sockcolor,
            sockstyle: sockstyle,
            imageurl: '/uploads/images/' + imageurl,
            emailaddress: emailaddress,
        })

        user.save().then(savedUser => {
            if(req.session) {
                console.log('there is a session')
                req.session.user = {userid: savedUser.id}
                res.redirect('/home')
            }
        })
    
    .catch(error => console.log(error))
    })
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

    console.log(req.session.user)
    /*let sockcolor = req.session.user.sockcolor
    let sockstyle = req.session.user.sockstyle*/

    models.User.findAll({
        where: {
            id: userid
        }
    }).then(userArray => {
        let user = userArray[0]
        models.User.findAll({
            where: {
                sockcolor: user.sockcolor,
                sockstyle: user.sockstyle,
                id: {[Sequelize.Op.not]: userid}
            }
        }).then(potentialmatch => {
            res.render('home', {user: user, potentialmatch: potentialmatch})
        })
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

