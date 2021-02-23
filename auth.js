const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

module.exports = function (passport) {
    passport.serializeUser((user, done) => {
        done(null, user);
    });
    passport.deserializeUser((user, done) => {
        done(null, user);
    });
    passport.use(new GoogleStrategy({
        clientID: '276824870427-fgoth5ua8olchdtrhdqp6bqokr1plgpv.apps.googleusercontent.com',
        clientSecret: "YlS759x13UDDt1yJTtYy9yrf",
        //callbackURL: 'https://toppic.soic.iupui.edu/auth/google/callback'
        callbackURL: 'http://localhost:8443/auth/google/callback'
    }, (token, refreshToken, profile, done) => {
        return done(null, {
            profile: profile,
            token: token
        });
    }));
};