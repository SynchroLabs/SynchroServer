
exports.login = function(req, res, message)
{
    var post = req.body;
    if (post && post.email)
    {
        if (post.email == 'bob.dickinson@gmail.com' && post.password == 'Password69') 
        {
            req.session.user_id = post.email;
            var nextPage = "/studio/samples/sandbox"; // default
            if (req.session.nextPage)
            {
                nextPage = req.session.nextPage;
                req.session.nextPage = null;
            }
            res.redirect(nextPage);
        }
        else 
        {
            res.render('login', { warning: "Email address and password combination were not correct" });
        }
    }
    else
    {
        res.render('login', { warning: req.session.loginMessage });
        req.session.loginMessage = null;
    }

};

exports.logout = function(req, res)
{
    delete req.session.user_id;
    req.session.loginMessage = "You have been signed out";
    res.redirect('/login');
}

exports.checkAuth = function(req, res, next) 
{
    if (!req.session.user_id)
    {
        req.session.loginMessage = "The page you have attempted to access requires that you be signed in";
        req.session.nextPage = req.path;
        res.redirect('login');
    }
    else 
    {
        next();
    }
}
